/**
 * GroupDetail Component - Modal for viewing detailed student group information
 * Displays comprehensive group data with navigation and action options
 */

import React from 'react'
import { 
  X, 
  Edit3, 
  Users, 
  Calendar, 
  Clock, 
  BookOpen,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Modal } from '@/design-system/components/Modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useStudentGroup } from '../hooks'

interface GroupDetailProps {
  groupId: string
  onBack: () => void
  onEdit: () => void
}

export const GroupDetail: React.FC<GroupDetailProps> = ({
  groupId,
  onBack,
  onEdit
}) => {
  const { data: group, isLoading, error } = useStudentGroup(groupId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusInfo = (active: boolean) => {
    return active
      ? { 
          icon: CheckCircle, 
          text: 'ACTIVO', 
          variant: 'success' as const,
          color: 'text-green-600'
        }
      : { 
          icon: XCircle, 
          text: 'INACTIVO', 
          variant: 'secondary' as const,
          color: 'text-gray-600'
        }
  }

  const getScheduleBadge = (scheduleType?: string) => {
    if (!scheduleType) return null
    
    // Map server names to display names and variants
    const scheduleMap = {
      'MaÃ±ana': { display: 'MAÑANA', variant: 'default' as const },
      'Mañana': { display: 'MAÑANA', variant: 'default' as const },
      'Tarde': { display: 'TARDE', variant: 'secondary' as const },
      'Noche': { display: 'NOCHE', variant: 'destructive' as const },
      'DIURNA': { display: 'DIURNA', variant: 'default' as const },
      'NOCTURNA': { display: 'NOCTURNA', variant: 'secondary' as const },
      'MIXTA': { display: 'MIXTA', variant: 'outline' as const },
      'SABATINA': { display: 'SABATINA', variant: 'destructive' as const }
    }

    const schedule = scheduleMap[scheduleType as keyof typeof scheduleMap] || 
                    { display: scheduleType, variant: 'outline' as const }

    return (
      <Badge variant={schedule.variant}>
        {schedule.display}
      </Badge>
    )
  }

  if (error) {
    return (
      <Modal open onOpenChange={onBack} className="max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <XCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar la ficha
            </h3>
            <p className="text-gray-600 mb-4">
              No se pudo cargar la información de la ficha. Por favor, inténtalo de nuevo.
            </p>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </Modal>
    )
  }

  return (
    <Modal open onOpenChange={onBack} className="max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            {isLoading ? 'Cargando...' : `Ficha #${group?.group_number}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEdit}
              disabled={isLoading}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : group ? (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center gap-4">
                  {(() => {
                    const statusInfo = getStatusInfo(group.active)
                    const StatusIcon = statusInfo.icon
                    return (
                      <>
                        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.text}
                        </Badge>
                      </>
                    )
                  })()}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Creado:</span> {formatDate(group.created_at)}
                  </div>
                </div>
                {group.current_quarter && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {group.current_quarter}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Program Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      Información del Programa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Nomenclatura</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {group.program?.nomenclature?.code || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Programa</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {group.program?.name || 'No especificado'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Nivel</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {group.program?.level?.study_type || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">Cadena</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {group.program?.chain?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule and Capacity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Programación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Jornada</label>
                      <div>
                        {getScheduleBadge(group.schedule?.name) || (
                          <Badge variant="outline">No especificada</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Capacidad</label>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {group.capacity} aprendices
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Duración del Programa</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {group.program?.level?.duration || 0} meses
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fecha de Inicio</label>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(group.start_date)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fecha de Finalización</label>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(group.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duración Total</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {(() => {
                            const start = new Date(group.start_date)
                            const end = new Date(group.end_date)
                            const diffTime = Math.abs(end.getTime() - start.getTime())
                            const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
                            return `${diffMonths} meses`
                          })()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado del Período</label>
                        <p className="font-medium">
                          {(() => {
                            const now = new Date()
                            const start = new Date(group.start_date)
                            const end = new Date(group.end_date)
                            
                            if (now < start) return 'No iniciado'
                            if (now > end) return 'Finalizado'
                            return 'En progreso'
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Fecha de creación:</span>
                    <span className="ml-2">{formatDate(group.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span>
                    <span className="ml-2">{formatDate(group.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ficha no encontrada
              </h3>
              <p className="text-gray-600">
                La ficha solicitada no existe o no está disponible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Modal>
  )
}