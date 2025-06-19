/**
 * StudentList Component - Professional data table with search, pagination and actions
 * Implements CRUD operations with optimistic updates and accessibility
 */

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react'

import { Button } from '@/design-system/components/Button'
import { Input } from '@/design-system/components/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import { LoadingSpinner } from '@/design-system/components/LoadingSpinner'
import { 
  useStudentList, 
  useDeleteStudent, 
  useBulkDeleteStudents,
  useExportStudents 
} from '../hooks'
import { Student, StudentStatus, DocumentType } from '../types'
import { StudentForm } from './StudentForm'
import { StudentDetail } from './StudentDetail'
import { StudentFilters } from './StudentFilters'

interface StudentListProps {
  className?: string
}

export const StudentList: React.FC<StudentListProps> = ({ className }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  // Query parameters
  const query = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || '',
    status: searchParams.get('status') as StudentStatus || undefined,
    sortBy: searchParams.get('sortBy') as keyof Student || 'lastName',
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc'
  }), [searchParams])

  // API hooks
  const { data, isLoading, error } = useStudentList(query)
  const deleteStudent = useDeleteStudent()
  const bulkDelete = useBulkDeleteStudents()
  const exportData = useExportStudents()

  // Handlers
  const handleSearch = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (value) {
        newParams.set('search', value)
      } else {
        newParams.delete('search')
      }
      newParams.set('page', '1')
      return newParams
    })
  }

  const handleSort = (field: keyof Student) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      const currentSort = newParams.get('sortBy')
      const currentOrder = newParams.get('sortOrder')
      
      if (currentSort === field) {
        newParams.set('sortOrder', currentOrder === 'asc' ? 'desc' : 'asc')
      } else {
        newParams.set('sortBy', field)
        newParams.set('sortOrder', 'asc')
      }
      
      return newParams
    })
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('page', page.toString())
      return newParams
    })
  }

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === data?.items?.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(data?.items?.map(s => s.id) || []))
    }
  }

  const handleDelete = (student: Student) => {
    if (window.confirm(`¿Está seguro de eliminar al estudiante ${student.firstName} ${student.lastName}?`)) {
      deleteStudent.mutate(student.id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedStudents.size} estudiantes?`)) {
      bulkDelete.mutate(Array.from(selectedStudents), {
        onSuccess: () => setSelectedStudents(new Set())
      })
    }
  }

  const handleExport = (format: 'csv' | 'xlsx') => {
    exportData.mutate({ query, format })
  }

  const getStatusBadge = (status: StudentStatus) => {
    const variants = {
      ACTIVE: 'success',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} size="sm">
        {status}
      </Badge>
    )
  }

  const getDocumentTypeBadge = (type: DocumentType) => {
    return (
      <Badge variant="outline" size="sm">
        {type}
      </Badge>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar estudiantes: {error.message}</p>
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} estudiantes registrados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="hidden md:flex"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exportData.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Estudiante
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, documento o email..."
                value={query.search}
                onChange={(e) => handleSearch(e.target.value)}
                icon={Search}
              />
            </div>
            
            {selectedStudents.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-gray-600">
                  {selectedStudents.size} seleccionado(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StudentFilters
              query={query}
              onQueryChange={(newQuery) => {
                setSearchParams(newQuery)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 p-4">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-4 h-4"
                        aria-label="Seleccionar todos"
                      >
                        {selectedStudents.size === data?.items?.length && data?.items?.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      <button
                        onClick={() => handleSort('documentNumber')}
                        className="hover:text-blue-600 transition-colors"
                      >
                        Documento
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">
                      <button
                        onClick={() => handleSort('lastName')}
                        className="hover:text-blue-600 transition-colors"
                      >
                        Nombre Completo
                      </button>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-900">Email</th>
                    <th className="text-left p-4 font-medium text-gray-900">Programa</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    <th className="w-20 p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items?.map((student) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => handleSelectStudent(student.id)}
                          className="flex items-center justify-center w-4 h-4"
                          aria-label={`Seleccionar ${student.firstName} ${student.lastName}`}
                        >
                          {selectedStudents.has(student.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{student.documentNumber}</span>
                          {getDocumentTypeBadge(student.documentType)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            Semestre {student.semester}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{student.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{student.program}</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetail(student.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingStudent(student)
                              setShowForm(true)
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student)}
                            disabled={deleteStudent.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {data?.items?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron estudiantes</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > query.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {(query.page - 1) * query.limit + 1} a{' '}
            {Math.min(query.page * query.limit, data.total)} de {data.total} resultados
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(query.page - 1)}
              disabled={query.page <= 1}
            >
              Anterior
            </Button>
            
            <span className="px-3 py-1 text-sm">
              Página {query.page} de {Math.ceil(data.total / query.limit)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(query.page + 1)}
              disabled={query.page >= Math.ceil(data.total / query.limit)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <StudentForm
            student={editingStudent}
            onClose={() => {
              setShowForm(false)
              setEditingStudent(null)
            }}
            onSuccess={() => {
              setShowForm(false)
              setEditingStudent(null)
            }}
          />
        )}
        
        {showDetail && (
          <StudentDetail
            studentId={showDetail}
            onClose={() => setShowDetail(null)}
            onEdit={(student) => {
              setShowDetail(null)
              setEditingStudent(student)
              setShowForm(true)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}