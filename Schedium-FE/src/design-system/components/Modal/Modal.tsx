/**
 * Modal Component - Reusable modal with overlay and animations
 * Provides consistent modal functionality across all forms and dialogs
 */

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

import { Button } from '../Button'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'

export interface ModalProps {
  open?: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  overlayClassName?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl'
}

export const Modal: React.FC<ModalProps> = ({
  open = false,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName
}) => {
  const modalOpen = open
  
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modalOpen, onClose, closeOnEscape])

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [modalOpen])

  if (!modalOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998] ${overlayClassName}`}
        onClick={closeOnOverlayClick ? (e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        } : undefined}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full ${sizeClasses[size]} ${className}`}
          style={{
            maxHeight: 'calc(100vh - 8rem)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="flex flex-col h-full">
            {title && (
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${showCloseButton ? 'pb-4' : ''}`}>
                <CardTitle>{title}</CardTitle>
                {showCloseButton && (
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
            )}
            
            <CardContent className={cn(
              "overflow-y-auto overflow-x-hidden flex-1",
              title ? '' : 'relative'
            )}>
              {!title && showCloseButton && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {children}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}