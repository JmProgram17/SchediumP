import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'

interface SessionWarningModalProps {
  isOpen: boolean
  onContinue: () => void
  onLogout: () => void
  timeLeft: number
}

function SessionWarningModal({ isOpen, onContinue, onLogout, timeLeft }: SessionWarningModalProps): JSX.Element | null {
  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sesión por Expirar
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Tu sesión expirará en {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onContinue}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Continuar Sesión
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SessionManager(): JSX.Element {
  const { logout, checkAuth } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const handleSessionWarning = (): void => {
      setShowWarning(true)
      setTimeLeft(300) // 5 minutes in seconds
    }

    window.addEventListener('session-warning', handleSessionWarning)

    return (): void => {
      window.removeEventListener('session-warning', handleSessionWarning)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (showWarning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowWarning(false)
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return (): void => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [showWarning, timeLeft, logout])

  const handleContinueSession = async (): Promise<void> => {
    setShowWarning(false)
    setTimeLeft(0)
    await checkAuth()
  }

  const handleLogout = (): void => {
    setShowWarning(false)
    setTimeLeft(0)
    logout()
  }

  return (
    <SessionWarningModal
      isOpen={showWarning}
      onContinue={handleContinueSession}
      onLogout={handleLogout}
      timeLeft={timeLeft}
    />
  )
}