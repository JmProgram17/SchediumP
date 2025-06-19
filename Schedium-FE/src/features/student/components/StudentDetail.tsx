/**
 * StudentDetail Component - Detailed view modal with actions
 * Displays comprehensive student information with edit capabilities
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Edit3, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap,
  FileText,
  User
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { useStudent } from '../hooks'
import { Student, StudentStatus, DocumentType } from '../types'

interface StudentDetailProps {
  studentId: string
  onClose: () => void
  onEdit: (student: Student) => void
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  studentId,
  onClose,
  onEdit
}) => {
  const { data: student, isLoading, error } = useStudent(studentId)

  const getStatusBadge = (status: StudentStatus) => {
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
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      CC: 'Cédula de Ciudadanía',
      TI: 'Tarjeta de Identidad',
      CE: 'Cédula de Extranjería',
      PEP: 'Permiso Especial de Permanencia',
      NIT: 'Número de Identificación Tributaria'
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-red-200">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">Error al cargar estudiante</p>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="mt-4"
                >
                  Cerrar
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Detalle del Estudiante
              </CardTitle>
              <div className="flex items-center gap-2">
                {student && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(student)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : student ? (
                <div className="space-y-6">
                  {/* Header with Name and Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h2>
                      <p className="text-gray-600">{student.program}</p>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Tipo de Documento
                          </label>
                          <p className="text-gray-900">
                            {getDocumentTypeLabel(student.documentType)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Número de Documento
                          </label>
                          <p className="text-gray-900 font-mono">
                            {student.documentNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Nombres
                          </label>
                          <p className="text-gray-900">{student.firstName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Apellidos
                          </label>
                          <p className="text-gray-900">{student.lastName}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Información de Contacto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Email
                          </label>
                          <p className="text-gray-900">
                            <a 
                              href={`mailto:${student.email}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {student.email}
                            </a>
                          </p>
                        </div>
                        {student.phone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Teléfono
                            </label>
                            <p className="text-gray-900">
                              <a 
                                href={`tel:${student.phone}`}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {student.phone}
                              </a>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Academic Information */}
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Información Académica
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Programa
                          </label>
                          <p className="text-gray-900">{student.program}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Semestre
                          </label>
                          <p className="text-gray-900">{student.semester}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Estado
                          </label>
                          <div className="mt-1">
                            {getStatusBadge(student.status)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dates Information */}
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fechas Importantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Fecha de Matrícula
                          </label>
                          <p className="text-gray-900">
                            {formatDate(student.enrollmentDate)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Fecha de Creación
                          </label>
                          <p className="text-gray-900">
                            {formatDate(student.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Última Actualización
                          </label>
                          <p className="text-gray-900">
                            {formatDate(student.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={onClose}
                    >
                      Cerrar
                    </Button>
                    <Button
                      onClick={() => onEdit(student)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar Estudiante
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Estudiante no encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}