import React, { createContext, useContext, useState } from 'react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export interface TabsProps {
  children: React.ReactNode
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ 
  children, 
  defaultValue, 
  value, 
  onValueChange,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = value !== undefined ? value : internalValue

  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  children: React.ReactNode
  className?: string
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  value, 
  className = '' 
}) => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs')
  }

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-2 text-sm font-medium border-b-2 transition-colors
        ${isActive 
          ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

export const TabsContent: React.FC<TabsContentProps> = ({ 
  children, 
  value, 
  className = '' 
}) => {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within Tabs')
  }

  const { activeTab } = context
  if (activeTab !== value) return null

  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  )
}