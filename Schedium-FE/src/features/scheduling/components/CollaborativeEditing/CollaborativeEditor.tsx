/**
 * CollaborativeEditor Component - Real-time collaborative schedule editing
 * Enables multiple users to edit schedules simultaneously with conflict resolution
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  User, 
  Eye, 
  Edit3, 
  Lock, 
  Unlock,
  Crown,
  Clock,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  MessageSquare,
  Send,
  X,
  Settings
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'
import { Avatar } from '@/design-system/components/Avatar'
import { Tooltip } from '@/design-system/components/Tooltip'
import { Input } from '@/design-system/components/Input'
import { Textarea } from '@/design-system/components/Textarea'
import { Switch } from '@/design-system/components/Switch'

import { ScheduleEntry, ScheduleConflict } from '../../types'
import { useScheduleWebSocket } from '../../services/websocket.service'
import { useRealTimeValidation } from '../../hooks/useRealTimeValidation'

export interface CollaborativeUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'away' | 'offline'
  currentAction?: {
    type: 'editing' | 'viewing' | 'selecting'
    entryId?: string
    timestamp: Date
  }
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canInvite: boolean
    canManagePermissions: boolean
  }
}

export interface CollaborativeSession {
  id: string
  scheduleId: string
  title: string
  users: CollaborativeUser[]
  owner: string
  createdAt: Date
  settings: {
    allowAnonymousView: boolean
    requireApproval: boolean
    lockingEnabled: boolean
    chatEnabled: boolean
    notificationsEnabled: boolean
  }
}

export interface ChatMessage {
  id: string
  userId: string
  message: string
  timestamp: Date
  type: 'message' | 'action' | 'system'
  metadata?: {
    entryId?: string
    action?: string
  }
}

export interface EntryLock {
  entryId: string
  userId: string
  userName: string
  timestamp: Date
  expiresAt: Date
}

interface CollaborativeEditorProps {
  session: CollaborativeSession
  entries: ScheduleEntry[]
  conflicts: ScheduleConflict[]
  currentUserId: string
  onUserAction: (action: string, data: any) => void
  onPermissionChange: (userId: string, permission: string, value: boolean) => void
  onSettingsChange: (settings: Partial<CollaborativeSession['settings']>) => void
  className?: string
}

// User avatar with status indicator
const UserAvatar: React.FC<{
  user: CollaborativeUser
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  onClick?: () => void
}> = ({ user, size = 'md', showStatus = true, onClick }) => {
  const getStatusColor = () => {
    const colors = {
      online: 'bg-green-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-400'
    }
    return colors[user.status]
  }

  const getRoleIcon = () => {
    const icons = {
      owner: <Crown className="w-3 h-3 text-yellow-500" />,
      editor: <Edit3 className="w-3 h-3 text-blue-500" />,
      viewer: <Eye className="w-3 h-3 text-gray-500" />
    }
    return icons[user.role]
  }

  return (
    <div className="relative">
      <Avatar
        src={user.avatar}
        alt={user.name}
        size={size}
        className={onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}
        onClick={onClick}
      >
        {user.name.charAt(0).toUpperCase()}
      </Avatar>
      
      {showStatus && (
        <>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-white`} />
          <div className="absolute -top-1 -right-1">
            {getRoleIcon()}
          </div>
        </>
      )}
    </div>
  )
}

// Active users panel
const ActiveUsersPanel: React.FC<{
  users: CollaborativeUser[]
  currentUserId: string
  onUserClick: (user: CollaborativeUser) => void
}> = ({ users, currentUserId, onUserClick }) => {
  const activeUsers = users.filter(user => user.status !== 'offline')
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Usuarios activos ({activeUsers.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
              user.id === currentUserId ? 'bg-blue-50 border border-blue-200' : ''
            }`}
            onClick={() => onUserClick(user)}
          >
            <UserAvatar user={user} size="sm" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {user.name}
                  {user.id === currentUserId && ' (tú)'}
                </span>
                <Badge 
                  variant={user.role === 'owner' ? 'default' : 'outline'} 
                  size="sm"
                >
                  {user.role}
                </Badge>
              </div>
              
              {user.currentAction && (
                <div className="text-xs text-gray-500 mt-1">
                  {user.currentAction.type === 'editing' && (
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      Editando
                    </span>
                  )}
                  {user.currentAction.type === 'viewing' && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Visualizando
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {user.permissions.canEdit && (
                <Tooltip content="Puede editar">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                </Tooltip>
              )}
              {user.currentAction?.entryId && (
                <Tooltip content="Editando entrada">
                  <Lock className="w-4 h-4 text-orange-500" />
                </Tooltip>
              )}
            </div>
          </div>
        ))}
        
        {activeUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No hay usuarios activos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Entry locks display
const EntryLocksPanel: React.FC<{
  locks: EntryLock[]
  entries: ScheduleEntry[]
  onReleaseLock: (entryId: string) => void
  currentUserId: string
}> = ({ locks, entries, onReleaseLock, currentUserId }) => {
  const activeLocks = locks.filter(lock => lock.expiresAt > new Date())
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="w-5 h-5" />
          Entradas bloqueadas ({activeLocks.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {activeLocks.map((lock) => {
          const entry = entries.find(e => e.id === lock.entryId)
          const isOwnLock = lock.userId === currentUserId
          
          return (
            <div
              key={lock.entryId}
              className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {entry?.title || 'Entrada eliminada'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Bloqueada por: {isOwnLock ? 'Ti' : lock.userName}
                </div>
                <div className="text-xs text-gray-500">
                  Expira: {lock.expiresAt.toLocaleTimeString()}
                </div>
              </div>
              
              {isOwnLock && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReleaseLock(lock.entryId)}
                >
                  <Unlock className="w-4 h-4" />
                </Button>
              )}
            </div>
          )
        })}
        
        {activeLocks.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Unlock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No hay entradas bloqueadas</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Chat component
const CollaborativeChat: React.FC<{
  messages: ChatMessage[]
  users: CollaborativeUser[]
  onSendMessage: (message: string) => void
  isOpen: boolean
  onToggle: () => void
}> = ({ messages, users, onSendMessage, isOpen, onToggle }) => {
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId)
  }

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageIcon = (type: string) => {
    const icons = {
      message: null,
      action: <Edit3 className="w-3 h-3 text-blue-500" />,
      system: <AlertCircle className="w-3 h-3 text-gray-500" />
    }
    return icons[type as keyof typeof icons]
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isOpen ? 'w-80 h-96' : 'w-12 h-12'
    }`}>
      {!isOpen ? (
        <Button
          className="w-12 h-12 rounded-full shadow-lg"
          onClick={onToggle}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      ) : (
        <Card className="w-full h-full shadow-lg">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" />
                Chat colaborativo
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col h-full p-0">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => {
                const user = getUserById(message.userId)
                
                return (
                  <div key={message.id} className="flex gap-2">
                    {user && (
                      <UserAvatar user={user} size="sm" showStatus={false} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900">
                          {user?.name || 'Usuario desconocido'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {getMessageIcon(message.type)}
                      </div>
                      
                      <div className={`text-sm rounded-lg px-3 py-2 ${
                        message.type === 'system' 
                          ? 'bg-gray-100 text-gray-700 italic' 
                          : 'bg-blue-50 text-gray-900'
                      }`}>
                        {message.message}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Message input */}
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribir mensaje..."
                  className="flex-1 min-h-0 resize-none"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Settings panel
const CollaborativeSettings: React.FC<{
  session: CollaborativeSession
  currentUserId: string
  onSettingsChange: (settings: Partial<CollaborativeSession['settings']>) => void
  onPermissionChange: (userId: string, permission: string, value: boolean) => void
}> = ({ session, currentUserId, onSettingsChange, onPermissionChange }) => {
  const currentUser = session.users.find(user => user.id === currentUserId)
  const canManageSettings = currentUser?.permissions.canManagePermissions || session.owner === currentUserId

  if (!canManageSettings) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuración de colaboración
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Session settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Configuración de sesión</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Vista anónima</label>
              <p className="text-xs text-gray-500">Permitir visualización sin cuenta</p>
            </div>
            <Switch
              checked={session.settings.allowAnonymousView}
              onCheckedChange={(checked) => 
                onSettingsChange({ allowAnonymousView: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Bloqueo de entradas</label>
              <p className="text-xs text-gray-500">Bloquear entradas durante edición</p>
            </div>
            <Switch
              checked={session.settings.lockingEnabled}
              onCheckedChange={(checked) => 
                onSettingsChange({ lockingEnabled: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Chat colaborativo</label>
              <p className="text-xs text-gray-500">Habilitar chat en tiempo real</p>
            </div>
            <Switch
              checked={session.settings.chatEnabled}
              onCheckedChange={(checked) => 
                onSettingsChange({ chatEnabled: checked })
              }
            />
          </div>
        </div>
        
        {/* User permissions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Permisos de usuarios</h4>
          
          <div className="space-y-2">
            {session.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <UserAvatar user={user} size="sm" />
                  <div>
                    <span className="text-sm font-medium">{user.name}</span>
                    <Badge variant="outline" size="sm" className="ml-2">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                
                {user.id !== session.owner && (
                  <div className="flex items-center gap-2">
                    <Tooltip content="Puede editar">
                      <Button
                        variant={user.permissions.canEdit ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => 
                          onPermissionChange(user.id, 'canEdit', !user.permissions.canEdit)
                        }
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Connection status indicator
const ConnectionStatus: React.FC<{
  isConnected: boolean
  connectionState: string
  userCount: number
}> = ({ isConnected, connectionState, userCount }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border-b">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
        <Badge 
          variant={isConnected ? 'default' : 'destructive'} 
          size="sm"
        >
          {connectionState}
        </Badge>
      </div>
      
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        {userCount} usuario{userCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  session,
  entries,
  conflicts,
  currentUserId,
  onUserAction,
  onPermissionChange,
  onSettingsChange,
  className
}) => {
  const [selectedUser, setSelectedUser] = useState<CollaborativeUser | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [entryLocks, setEntryLocks] = useState<EntryLock[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'locks' | 'settings'>('users')

  // WebSocket for real-time collaboration
  const { isConnected, connectionState } = useScheduleWebSocket({
    url: `ws://localhost:8080/collaborate/${session.id}`,
    enableLogging: true
  }, {
    onUserJoined: (userId, userInfo) => {
      setChatMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        userId: 'system',
        message: `${userInfo.name} se unió a la sesión`,
        timestamp: new Date(),
        type: 'system'
      }])
    },
    onUserLeft: (userId) => {
      const user = session.users.find(u => u.id === userId)
      if (user) {
        setChatMessages(prev => [...prev, {
          id: `system_${Date.now()}`,
          userId: 'system',
          message: `${user.name} dejó la sesión`,
          timestamp: new Date(),
          type: 'system'
        }])
      }
    },
    onMessage: (message) => {
      if (message.type === 'schedule_update') {
        // Handle collaborative editing events
        handleCollaborativeUpdate(message.payload)
      }
    }
  })

  const handleCollaborativeUpdate = useCallback((payload: any) => {
    switch (payload.action) {
      case 'lock_entry':
        setEntryLocks(prev => [...prev, payload.lock])
        break
      case 'unlock_entry':
        setEntryLocks(prev => prev.filter(lock => lock.entryId !== payload.entryId))
        break
      case 'chat_message':
        setChatMessages(prev => [...prev, payload.message])
        break
    }
  }, [])

  const handleSendChatMessage = useCallback((message: string) => {
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: currentUserId,
      message,
      timestamp: new Date(),
      type: 'message'
    }

    onUserAction('send_chat_message', { message: chatMessage })
    setChatMessages(prev => [...prev, chatMessage])
  }, [currentUserId, onUserAction])

  const handleReleaseLock = useCallback((entryId: string) => {
    onUserAction('unlock_entry', { entryId })
    setEntryLocks(prev => prev.filter(lock => lock.entryId !== entryId))
  }, [onUserAction])

  const handleUserClick = useCallback((user: CollaborativeUser) => {
    setSelectedUser(user)
  }, [])

  const onlineUsers = session.users.filter(user => user.status !== 'offline')

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Connection status header */}
      <ConnectionStatus
        isConnected={isConnected}
        connectionState={connectionState}
        userCount={onlineUsers.length}
      />

      <div className="flex flex-1 gap-6 p-6">
        {/* Main content area */}
        <div className="flex-1">
          {/* Collaborative features would integrate with the schedule matrix here */}
          <div className="bg-white rounded-lg border p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Edición colaborativa activa
            </h3>
            <p className="text-gray-600 mb-4">
              {onlineUsers.length} usuario{onlineUsers.length !== 1 ? 's' : ''} conectado{onlineUsers.length !== 1 ? 's' : ''}
            </p>
            <div className="flex justify-center gap-2">
              {onlineUsers.slice(0, 5).map((user) => (
                <UserAvatar
                  key={user.id}
                  user={user}
                  size="md"
                  onClick={() => handleUserClick(user)}
                />
              ))}
              {onlineUsers.length > 5 && (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  +{onlineUsers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Tab navigation */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'users' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Usuarios
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'locks' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('locks')}
            >
              Bloqueos
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              Config
            </button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'users' && (
                <ActiveUsersPanel
                  users={session.users}
                  currentUserId={currentUserId}
                  onUserClick={handleUserClick}
                />
              )}
              
              {activeTab === 'locks' && (
                <EntryLocksPanel
                  locks={entryLocks}
                  entries={entries}
                  onReleaseLock={handleReleaseLock}
                  currentUserId={currentUserId}
                />
              )}
              
              {activeTab === 'settings' && (
                <CollaborativeSettings
                  session={session}
                  currentUserId={currentUserId}
                  onSettingsChange={onSettingsChange}
                  onPermissionChange={onPermissionChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Chat component */}
      {session.settings.chatEnabled && (
        <CollaborativeChat
          messages={chatMessages}
          users={session.users}
          onSendMessage={handleSendChatMessage}
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      )}
    </div>
  )
}