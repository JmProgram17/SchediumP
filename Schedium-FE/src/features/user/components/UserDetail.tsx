import { Users, Mail, Shield, Calendar, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/design-system/components/Badge'
import type { User } from '../types'

interface UserDetailProps {
  user: User
}

export function UserDetail({ user }: UserDetailProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user.first_name} {user.last_name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant={user.active ? "success" : "destructive"}
            className="flex items-center gap-1"
          >
            {user.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {user.active ? 'Activo' : 'Inactivo'}
          </Badge>
          {user.role && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield size={14} />
              {user.role.name}
            </Badge>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Información Personal
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</p>
                <p className="text-gray-900 dark:text-gray-100">{user.first_name} {user.last_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Documento</p>
                <p className="text-gray-900 dark:text-gray-100">{user.document_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-gray-100">{user.role?.name || 'Sin rol asignado'}</p>
                  {user.role?.description && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">({user.role.description})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Información del Sistema
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Registro</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Última Actualización</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(user.updated_at)}</p>
              </div>
            </div>

            {user.last_login && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Último Login</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(user.last_login)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</p>
                <p className={`font-medium ${user.active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {user.active ? 'Usuario Activo' : 'Usuario Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions */}
      {user.role?.permissions && user.role.permissions.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Permisos del Rol
          </h4>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {user.role.permissions.map((permission) => (
              <div 
                key={permission.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <Shield className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {permission.action} {permission.resource}
                  </p>
                  {permission.name !== `${permission.action}_${permission.resource}` && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{permission.name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Información del Usuario</p>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              Este usuario fue creado el {formatDate(user.created_at)} y tiene asignado el rol de {user.role?.name || 'Sin rol'}.
              {user.last_login && ` Su último acceso fue el ${formatDate(user.last_login)}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}