import React from 'react'
import { Search, X } from 'lucide-react'

export interface FilterField {
  key: string
  label: string
  type: 'select' | 'text' | 'range' | 'date'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  min?: number
  max?: number
}

export interface SearchFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onClear?: () => void
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  onClear
}) => {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-primary-500 focus:border-primary-500
          bg-white text-gray-900 placeholder-gray-500
          dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
          dark:focus:ring-primary-400 dark:focus:border-primary-400
        "
      />
      
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default SearchFilter