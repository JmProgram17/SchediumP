/**
 * ConfirmDialog Component - Reusable confirmation dialog
 * Provides consistent confirmation UX across all delete/destructive actions
 */

import React from 'react'
import { AlertTriangle, Trash2, Info } from 'lucide-react'

import { Modal } from '../Modal/Modal'
import { Button } from '../Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  icon?: React.ReactNode
}

const variantConfig = {
  danger: {
    icon: Trash2,
    confirmButtonVariant: 'destructive' as const,
    iconColor: 'text-red-500',
    titleColor: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    confirmButtonVariant: 'outline' as const,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-600'
  },
  info: {
    icon: Info,
    confirmButtonVariant: 'primary' as const,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-600'
  }
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
  icon
}) => {
  const config = variantConfig[variant]
  const IconComponent = config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      showCloseButton={false}
    >
      <div className="text-center p-6">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          {icon || <IconComponent className={`w-6 h-6 ${config.iconColor}`} />}
        </div>
        
        <h3 className={`text-lg font-medium mb-2 ${config.titleColor}`}>
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="sm:order-1"
          >
            {cancelText}
          </Button>
          
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="sm:order-2"
          >
            {loading ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}