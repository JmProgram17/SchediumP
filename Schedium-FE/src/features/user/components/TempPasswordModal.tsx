import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  Copy, 
  Check, 
  X,
  Clock,
  Info,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Button, Card } from '@/design-system/components'
import type { TempPasswordModalData } from '../types/auth-strategy.types'

interface TempPasswordModalProps {
  data: TempPasswordModalData
  onClose: () => void
}

export const TempPasswordModal: React.FC<TempPasswordModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false)
  const [understood, setUnderstood] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatExpirationTime = () => {
    const now = new Date()
    const expires = new Date(data.expiresAt)
    const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60))
    return `${hoursLeft} horas`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full bg-white dark:bg-gray-900 max-h-full overflow-hidden flex flex-col">
            {/* Header con advertencia */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                    Contraseña Temporal Generada
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    El servicio de email no está disponible. Debe compartir esta contraseña de forma segura.
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Información del usuario */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.userName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expira en:
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Clock className="h-4 w-4" />
                    {formatExpirationTime()}
                  </span>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña Temporal:
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <code className="flex-1 text-lg font-mono text-center text-gray-900 dark:text-gray-100 select-all">
                      {data.password}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Instrucciones Importantes:
                </h4>
                <div className="space-y-2 ml-7">
                  {data.instructions.map((instruction, index) => (
                    <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                      {instruction}
                    </p>
                  ))}
                </div>
              </div>

              {/* Advertencias */}
              {data.warnings && data.warnings.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 dark:text-red-100 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5" />
                    Advertencias de Seguridad:
                  </h4>
                  <ul className="space-y-1 ml-7">
                    {data.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-red-700 dark:text-red-300 list-disc">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checkbox de confirmación */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Entiendo que debo compartir esta contraseña de forma segura con el usuario 
                    y que debe cambiarla en su primer inicio de sesión.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <Button
                  onClick={onClose}
                  disabled={!understood}
                  className="min-w-[120px]"
                >
                  Entendido
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}