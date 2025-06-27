/**
 * InstructorDetail Component - Professional detail view following Student pattern
 * Displays complete instructor information with edit capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  MapPin,
  Award,
  Briefcase,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useInstructor } from '../hooks'
import { InstructorForm } from './InstructorForm'
import { Instructor, InstructorStatus, ContractType } from '../types'

interface InstructorDetailProps {
  instructorId: string
  onBack?: () => void
  onEdit?: (instructor: Instructor) => void
  className?: string
}

export const InstructorDetail: React.FC<InstructorDetailProps> = ({
  instructorId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: instructor, isLoading, error } = useInstructor(instructorId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: InstructorStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive'
    } as const

    const labels = {
      ACTIVE: 'Activo',
      INACTIVE: 'Inactivo',
      SUSPENDED: 'Suspendido'
    }

    return (
      <Badge variant={variants[status]} size="sm">
        {labels[status]}
      </Badge>
    )
  }

  const getContractTypeBadge = (type: ContractType) => {
    const colors = {
      PLANTA: 'success',
      CONTRATO: 'warning', 
      CATEDRA: 'outline'
    } as const

    return (
      <Badge variant={colors[type]} size="sm">
        {type}
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
            <p>Error al cargar instructor: {error.message}</p>
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

  if (!instructor) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <User className="w-8 h-8 mx-auto mb-4" />
            <p>Instructor no encontrado</p>
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
              {instructor.first_name} {instructor.last_name}
            </h1>
            <p className="text-gray-600">
              {instructor.department?.name || 'Sin coordinación'} • Instructor
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(instructor) : setShowEditForm(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Documento</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{instructor.phone_number || 'N/A'}</span>
                    <Badge variant="outline" size="sm">
                      CC
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    <Badge variant={instructor.active ? 'success' : 'secondary'} size="sm">
                      {instructor.active ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{instructor.email}</span>
                  </div>
                </div>
                
                {instructor.phone_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{instructor.phone_number}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Información Profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Coordinación</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{instructor.department?.name || 'Sin coordinación'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Horas Asignadas</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span>{instructor.hour_count || 0} horas</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Contrato</label>
                  <div className="mt-1">
                    <Badge variant="outline" size="sm">
                      {instructor.contract?.contract_type || 'Sin contrato'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Contratación</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(instructor.created_at)}</span>
                  </div>
                </div>
              </div>
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
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID del Sistema</label>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">
                  {instructor.instructor_id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                <p className="text-sm mt-1">
                  {formatDate(instructor.created_at)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                <p className="text-sm mt-1">
                  {formatDate(instructor.updated_at)}
                </p>
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
                <FileText className="w-4 h-4 mr-2" />
                Ver Historial
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <InstructorForm
            instructor={instructor}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}