"""
WebSocket endpoints for real-time notifications.
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from app.core.websocket_manager import handle_websocket_client, websocket_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_global_endpoint(websocket: WebSocket):
    """
    Global WebSocket endpoint for all real-time updates.
    
    Usage from frontend:
    ```javascript
    const ws = new WebSocket('ws://localhost:8001/api/v1/ws');
    ```
    """
    await handle_websocket_client(websocket, "global")


@router.websocket("/ws/{module}")
async def websocket_module_endpoint(
    websocket: WebSocket, 
    module: str,
    user_id: Optional[str] = Query(None)
):
    """
    Module-specific WebSocket endpoint.
    
    Available modules:
    - academic-config: Academic configuration changes (days, time blocks, quarters)
    - scheduling: Schedule changes (class schedules, conflicts)
    - groups: Student group changes
    - instructors: Instructor changes
    - classrooms: Classroom changes
    - programs: Program changes
    
    Usage from frontend:
    ```javascript
    const ws = new WebSocket('ws://localhost:8001/api/v1/ws/academic-config');
    ```
    """
    valid_modules = [
        "academic-config", "scheduling", "groups", 
        "instructors", "classrooms", "programs", "global"
    ]
    
    if module not in valid_modules:
        await websocket.close(code=4000, reason=f"Invalid module. Valid modules: {', '.join(valid_modules)}")
        return
        
    await handle_websocket_client(websocket, module)


@router.get("/ws/stats")
async def get_websocket_stats():
    """
    Get WebSocket connection statistics.
    Useful for monitoring and debugging.
    """
    stats = websocket_manager.get_connection_stats()
    return {
        "status": "active",
        "total_connections": sum(stats.values()),
        "connections_by_module": stats
    }


@router.post("/ws/test-broadcast")
async def test_broadcast(module: str = "global", message: str = "Test message"):
    """
    Test endpoint to broadcast a message to WebSocket clients.
    Only available in development mode.
    """
    from app.config import settings
    
    if settings.APP_ENV == "production":
        return {"error": "Test endpoints not available in production"}
    
    await websocket_manager.broadcast_to_module(module, {
        "type": "test_message",
        "message": message,
        "sender": "test_endpoint"
    })
    
    return {
        "status": "success",
        "message": f"Test message sent to {module} module",
        "connections": len(websocket_manager.connections.get(module, set()))
    }