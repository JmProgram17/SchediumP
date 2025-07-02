"""
WebSocket Manager for Real-time Notifications
Manages WebSocket connections and broadcasts database changes to connected clients.
"""

import json
import asyncio
from typing import Dict, Set, List, Optional, Any
from datetime import datetime
import logging

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and real-time notifications."""
    
    def __init__(self):
        # Store active connections by module
        self.connections: Dict[str, Set[WebSocket]] = {
            "academic-config": set(),
            "scheduling": set(),
            "groups": set(),
            "instructors": set(),
            "classrooms": set(),
            "programs": set(),
            "global": set()  # Connections listening to all changes
        }
        
        # Store user-specific connections for authenticated users
        self.user_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, module: str = "global", user_id: Optional[str] = None):
        """Accept a new WebSocket connection."""
        try:
            await websocket.accept()
            
            # Add to module connections
            if module not in self.connections:
                self.connections[module] = set()
            self.connections[module].add(websocket)
            
            # Add to user connections if authenticated
            if user_id:
                self.user_connections[user_id] = websocket
            
            logger.info(f"WebSocket connected to module '{module}'. User: {user_id or 'anonymous'}")
            logger.info(f"Active connections for {module}: {len(self.connections[module])}")
            
            # Send welcome message
            await self.send_to_websocket(websocket, {
                "type": "connection_established",
                "module": module,
                "timestamp": datetime.now().isoformat(),
                "message": f"Connected to {module} real-time updates"
            })
            
        except Exception as e:
            logger.error(f"Error connecting WebSocket: {e}")
            
    async def disconnect(self, websocket: WebSocket, module: str = "global", user_id: Optional[str] = None):
        """Remove a WebSocket connection."""
        try:
            # Remove from module connections
            if module in self.connections:
                self.connections[module].discard(websocket)
                
            # Remove from user connections
            if user_id and user_id in self.user_connections:
                del self.user_connections[user_id]
                
            logger.info(f"WebSocket disconnected from module '{module}'. User: {user_id or 'anonymous'}")
            logger.info(f"Active connections for {module}: {len(self.connections.get(module, set()))}")
            
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}")
            
    async def send_to_websocket(self, websocket: WebSocket, data: Dict[str, Any]):
        """Send data to a specific WebSocket."""
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.error(f"Error sending data to WebSocket: {e}")
            # Remove broken connection
            for module_connections in self.connections.values():
                module_connections.discard(websocket)
                
    async def broadcast_to_module(self, module: str, data: Dict[str, Any]):
        """Broadcast data to all connections listening to a specific module."""
        if module not in self.connections:
            logger.warning(f"Module '{module}' not found in connections")
            return
            
        message = {
            "timestamp": datetime.now().isoformat(),
            "module": module,
            **data
        }
        
        # Get connections for this module and global listeners
        target_connections = self.connections[module].copy()
        target_connections.update(self.connections.get("global", set()))
        
        if target_connections:
            logger.info(f"Broadcasting to {len(target_connections)} connections for module '{module}'")
            
            # Send to all connections concurrently
            tasks = []
            for websocket in target_connections:
                tasks.append(self.send_to_websocket(websocket, message))
                
            # Execute all sends concurrently
            await asyncio.gather(*tasks, return_exceptions=True)
        else:
            logger.debug(f"No active connections for module '{module}'")
            
    async def broadcast_database_change(self, table: str, operation: str, data: Optional[Dict[str, Any]] = None):
        """Broadcast database changes to relevant modules."""
        # Map database tables to frontend modules
        table_module_mapping = {
            "days": "academic-config",
            "time_blocks": "academic-config", 
            "schedule_configs": "academic-config",
            "quarters": "academic-config",
            "class_schedules": "scheduling",
            "day_time_blocks": "scheduling",
            "student_groups": "groups",
            "instructors": "instructors",
            "classrooms": "classrooms",
            "programs": "programs"
        }
        
        module = table_module_mapping.get(table, "global")
        
        notification = {
            "type": "database_change",
            "table": table,
            "operation": operation,  # 'create', 'update', 'delete'
            "data": data or {},
            "affected_module": module
        }
        
        logger.info(f"Broadcasting database change: {table} {operation} to module {module}")
        
        # Broadcast to specific module and global listeners
        await self.broadcast_to_module(module, notification)
        
        # Also notify global listeners if it's not already a global broadcast
        if module != "global":
            await self.broadcast_to_module("global", notification)
            
    async def notify_config_change(self, config_type: str, changes: Dict[str, Any]):
        """Notify about configuration changes."""
        notification = {
            "type": "config_change",
            "config_type": config_type,
            "changes": changes
        }
        
        # Configuration changes affect academic-config module primarily
        await self.broadcast_to_module("academic-config", notification)
        await self.broadcast_to_module("global", notification)
        
    async def notify_schedule_conflict(self, conflict_data: Dict[str, Any]):
        """Notify about scheduling conflicts."""
        notification = {
            "type": "schedule_conflict",
            "conflict": conflict_data
        }
        
        await self.broadcast_to_module("scheduling", notification)
        await self.broadcast_to_module("global", notification)
        
    async def send_to_user(self, user_id: str, data: Dict[str, Any]):
        """Send data to a specific authenticated user."""
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            await self.send_to_websocket(websocket, data)
        else:
            logger.warning(f"User {user_id} not connected via WebSocket")
            
    def get_connection_stats(self) -> Dict[str, int]:
        """Get statistics about active connections."""
        return {
            module: len(connections) 
            for module, connections in self.connections.items()
        }


# Singleton instance
websocket_manager = WebSocketManager()


async def handle_websocket_client(websocket: WebSocket, module: str = "global"):
    """Handle individual WebSocket client connection."""
    user_id = None
    
    try:
        # TODO: Extract user_id from JWT token in query params or headers
        # For now, we'll use anonymous connections
        
        await websocket_manager.connect(websocket, module, user_id)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages (like subscribing to different modules)
                await handle_client_message(websocket, message, module, user_id)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket_manager.send_to_websocket(websocket, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket_manager.send_to_websocket(websocket, {
                    "type": "error", 
                    "message": "Internal server error"
                })
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        await websocket_manager.disconnect(websocket, module, user_id)


async def handle_client_message(websocket: WebSocket, message: Dict[str, Any], current_module: str, user_id: Optional[str]):
    """Handle messages from WebSocket clients."""
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await websocket_manager.send_to_websocket(websocket, {
            "type": "pong",
            "timestamp": datetime.now().isoformat()
        })
        
    elif message_type == "subscribe":
        # Allow clients to subscribe to additional modules
        new_module = message.get("module", "global")
        if new_module in websocket_manager.connections:
            websocket_manager.connections[new_module].add(websocket)
            await websocket_manager.send_to_websocket(websocket, {
                "type": "subscribed",
                "module": new_module,
                "message": f"Subscribed to {new_module} updates"
            })
            
    elif message_type == "unsubscribe":
        # Allow clients to unsubscribe from modules
        module_to_unsubscribe = message.get("module", current_module)
        if module_to_unsubscribe in websocket_manager.connections:
            websocket_manager.connections[module_to_unsubscribe].discard(websocket)
            await websocket_manager.send_to_websocket(websocket, {
                "type": "unsubscribed", 
                "module": module_to_unsubscribe,
                "message": f"Unsubscribed from {module_to_unsubscribe} updates"
            })
            
    else:
        await websocket_manager.send_to_websocket(websocket, {
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        })