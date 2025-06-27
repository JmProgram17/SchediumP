/**
 * ProgramDetail Component - Professional detail view following established pattern
 * Displays complete program information with edit capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  BookOpen, 
  Clock, 
  Building, 
  Users,
  Calendar,
  FileText,
  ArrowLeft,
  GraduationCap,
  Monitor
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useProgram } from '../hooks'
import { ProgramForm } from './ProgramForm'
import { Program, ProgramStatus, ProgramLevel, ProgramModality } from '../types'

interface ProgramDetailProps {
  programId: string
  onBack?: () => void
  onEdit?: (program: Program) => void
  className?: string
}

export const ProgramDetail: React.FC<ProgramDetailProps> = ({
  programId,
  onBack,
  onEdit,
  className
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const { data: program, isLoading, error } = useProgram(programId)

  const handleEditSuccess = () => {
    setShowEditForm(false)
  }

  const getStatusBadge = (status: ProgramStatus) => {
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

  const getLevelBadge = (level: ProgramLevel) => {
    const colors = {
      TECNICO: 'outline',
      TECNOLOGO: 'secondary',
      ESPECIALIZACION: 'default'
    } as const

    return (
      <Badge variant={colors[level]} size="lg">
        {level}
      </Badge>
    )
  }

  const getModalityIcon = (modality: ProgramModality) => {
    switch (modality) {
      case 'PRESENCIAL':
        return <Building className="w-5 h-5" />
      case 'VIRTUAL':
        return <Monitor className="w-5 h-5" />
      case 'MIXTA':
        return <Users className="w-5 h-5" />
      default:
        return <Building className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BookOpen className="w-8 h-8 mx-auto mb-4" />
            <p>Programa no encontrado</p>
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
              {program.name}
            </h1>
            <p className="text-gray-600">
              {program.nomenclature?.code || 'N/A'} • {program.department?.name || 'Sin departamento'}
            </p>
          </div>
        </div>
        
        <Button onClick={() => onEdit ? onEdit(program) : setShowEditForm(true)}>
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
                <BookOpen className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código</label>
                  <p className="text-lg font-semibold">{program.nomenclature?.code || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    <Badge variant="success" size="sm">ACTIVO</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Nombre del Programa</label>
                <p className="text-lg">{program.name}</p>
              </div>


              <div>
                <label className="text-sm font-medium text-gray-500">Departamento</label>
                <p className="text-lg">{program.department?.name || 'Sin departamento'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Configuración Académica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nivel</label>
                  <div className="mt-1">
                    <Badge variant="outline" size="sm">{program.level?.study_type || 'N/A'}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cadena</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Monitor className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{program.chain?.name || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duración</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{program.level?.duration || 0} meses</span>
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
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Creado</label>
                <p className="text-sm">
                  {new Date(program.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última actualización</label>
                <p className="text-sm">
                  {new Date(program.updated_at).toLocaleDateString()}
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
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Ver Estudiantes
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Ver Horarios
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Cursos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {showEditForm && (
          <ProgramForm
            program={program}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}