/**
 * ClassroomDetail Component - Professional detail view following Student pattern
 * Displays complete classroom information with edit capabilities
 */

import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  Building, 
  Users, 
  MapPin, 
  Calendar, 
  FileText,
  ArrowLeft,
  AlertCircle,
  Package
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useClassroom } from '../hooks'
import { ClassroomForm } from './ClassroomForm'
import { Classroom, ClassroomStatus, ClassroomType } from '../types'

interface ClassroomDetailProps {
  classroomId: string
  onBack?: () => void
  onEdit?: (classroom: Classroom) => void
  className?: string
}

export const ClassroomDetail: React.FC<ClassroomDetailProps> = ({
  classroomId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: classroom, isLoading, error } = useClassroom(classroomId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: ClassroomStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      MAINTENANCE: 'warning'
    } as const

    const labels = {
      ACTIVE: 'Activa',
      INACTIVE: 'Inactiva',
      MAINTENANCE: 'Mantenimiento'
    }

    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    )
  }

  const getTypeBadge = (type: ClassroomType) => {
    const colors = {
      LABORATORIO: 'success',
      AULA_TEORICA: 'outline',
      TALLER: 'warning',
      AUDITORIO: 'secondary'
    } as const

    const labels = {
      LABORATORIO: 'Laboratorio',
      AULA_TEORICA: 'Aula Teórica',
      TALLER: 'Taller',
      AUDITORIO: 'Auditorio'
    }

    return (
      <Badge variant={colors[type]} size="sm">
        {labels[type]}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCapacityColor = (capacity: number) => {
    if (capacity <= 20) return 'text-blue-600'
    if (capacity <= 50) return 'text-green-600'
    if (capacity <= 100) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-4" />
            <p>Error al cargar aula: {error.message}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!classroom) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Building className="w-8 h-8 mx-auto mb-4" />
            <p>Aula no encontrada</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Aula {classroom.room_number}
            </h1>
            <p className="text-gray-600">
              {classroom.room_number} • Campus ID: {classroom.campus_id}
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(classroom) : setShowEditForm(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <div className="mt-1">
                    <span className="font-mono font-medium text-lg">{classroom.room_number}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(ClassroomStatus.ACTIVE)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Aula</label>
                  <div className="mt-1">
                    {getTypeBadge(classroom.classroom_type as ClassroomType)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Capacidad</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className={`font-medium ${getCapacityColor(classroom.capacity)}`}>
                      {classroom.capacity} personas
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Edificio</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Campus {classroom.campus_id}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Piso</label>
                  <div className="mt-1">
                    <span className="font-medium">Capacidad: {classroom.capacity}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Equipamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">No hay equipamiento registrado</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID del Sistema</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                  {classroom.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                <p className="text-sm mt-1">
                  {formatDate(classroom.createdAt)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                <p className="text-sm mt-1">
                  {formatDate(classroom.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getCapacityColor(classroom.capacity)}`}>
                  {classroom.capacity}
                </div>
                <p className="text-sm text-gray-500">Capacidad máxima</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  0
                </div>
                <p className="text-sm text-gray-500">Equipos registrados</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setShowEditForm(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Información
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                disabled
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Horarios
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                disabled
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Reservas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <ClassroomForm
            classroom={classroom}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}