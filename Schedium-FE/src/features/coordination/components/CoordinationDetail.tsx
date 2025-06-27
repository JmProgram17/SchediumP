import { Badge } from '@/design-system/components/Badge'
import { Card } from '@/design-system/components'
import { Users, Mail, Phone, Calendar, User } from 'lucide-react'
import type { Coordination } from '../types'

interface CoordinationDetailProps {
  coordination: Coordination
}

export function CoordinationDetail({ coordination }: CoordinationDetailProps) {
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
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{coordination.name}</h2>
          <div className="flex items-center gap-2">
            {coordination.coordinator ? (
              <Badge variant="default" className="flex items-center gap-1">
                <Users size={14} />
                Coordinador Asignado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Sin Coordinador
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User size={18} />
              Información de Contacto
            </h3>
            <div className="space-y-3">
              {coordination.email ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span>{coordination.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail size={16} />
                  <span>No especificado</span>
                </div>
              )}

              {coordination.phone_number ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{coordination.phone_number}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone size={16} />
                  <span>No especificado</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={18} />
              Coordinador
            </h3>
            {coordination.coordinator ? (
              <div className="space-y-2">
                <div className="font-medium text-gray-900">
                  {coordination.coordinator.full_name || 
                   `${coordination.coordinator.first_name} ${coordination.coordinator.last_name}`}
                </div>
                <div className="text-sm text-gray-600">
                  Usuario: {coordination.coordinator.username}
                </div>
                <div className="text-sm text-gray-600">
                  Email: {coordination.coordinator.email}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">
                No hay coordinador asignado a esta coordinación
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={18} />
            Información del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <span className="ml-2 text-gray-600">{coordination.department_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Fecha de creación:</span>
              <span className="ml-2 text-gray-600">{formatDate(coordination.created_at)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Última actualización:</span>
              <span className="ml-2 text-gray-600">{formatDate(coordination.updated_at)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}