import React from 'react'

export interface Column<T> {
  key: keyof T | string
  title: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: string | number
  sortable?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  className?: string
  emptyText?: string
  onRowClick?: (record: T, index: number) => void
}

export function DataTable<T>({ 
  data, 
  columns, 
  loading = false, 
  className = '',
  emptyText = 'No hay datos disponibles',
  onRowClick 
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={`border rounded-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`border rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto border rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((record, rowIndex) => (
            <tr
              key={rowIndex}
              className={`
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(record, rowIndex)}
            >
              {columns.map((column, colIndex) => {
                const value = typeof column.key === 'string' && column.key.includes('.') 
                  ? column.key.split('.').reduce((obj: any, key: string) => obj?.[key], record)
                  : (record as any)[column.key]
                
                return (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render ? column.render(value, record, rowIndex) : value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable