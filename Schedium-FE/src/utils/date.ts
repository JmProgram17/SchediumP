/**
 * Date utility functions
 */

/**
 * Format a date string to a human-readable format
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }
  
  return dateObj.toLocaleDateString('es-ES', defaultOptions)
}

/**
 * Format a date to ISO string (YYYY-MM-DD) for input fields
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

/**
 * Get relative time (e.g., "hace 2 días", "en 3 semanas")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = dateObj.getTime() - now.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Hoy'
  if (diffInDays === 1) return 'Mañana'
  if (diffInDays === -1) return 'Ayer'
  if (diffInDays > 0) return `En ${diffInDays} días`
  return `Hace ${Math.abs(diffInDays)} días`
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj > new Date()
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.getFullYear() === today.getFullYear() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getDate() === today.getDate()
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const date1Obj = typeof date1 === 'string' ? new Date(date1) : date1
  const date2Obj = typeof date2 === 'string' ? new Date(date2) : date2
  const diffInMs = Math.abs(date2Obj.getTime() - date1Obj.getTime())
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
}

/**
 * Add days to a date
 */
export function addDays(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: string | Date, days: number): Date {
  return addDays(date, -days)
}