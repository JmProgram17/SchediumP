/**
 * Language Switcher Component - UI for changing application language
 * Provides dropdown and inline language selection options
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe, Check } from 'lucide-react'

import { useLanguageSwitcher } from '@/hooks/useTranslation'
import { Button } from '@/design-system/components/Button'
import { Badge } from '@/design-system/components/Badge'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  showFlag?: boolean
  showLabel?: boolean
  className?: string
  position?: 'left' | 'right' | 'center'
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  size = 'md',
  showFlag = true,
  showLabel = true,
  className = '',
  position = 'right'
}) => {
  const {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    getLanguageName,
    getLanguageFlag,
    isChanging
  } = useLanguageSwitcher()

  const [isOpen, setIsOpen] = useState(false)
  const [isChangingLang, setIsChangingLang] = useState(false)

  const handleLanguageChange = useCallback(async (language: string) => {
    if (language === currentLanguage) return

    setIsChangingLang(true)
    setIsOpen(false)

    try {
      await changeLanguage(language)
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChangingLang(false)
    }
  }, [currentLanguage, changeLanguage])

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const currentFlag = getLanguageFlag(currentLanguage)
  const currentName = getLanguageName(currentLanguage)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  }

  const dropdownPositionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  }

  if (variant === 'minimal') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDropdown}
          disabled={isChanging || isChangingLang}
          className="min-w-0 p-2"
          aria-label="Change language"
        >
          {showFlag && (
            <span className="text-lg" role="img" aria-label={currentName}>
              {currentFlag}
            </span>
          )}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`
                  absolute top-full mt-2 z-50 min-w-[120px]
                  bg-white border border-gray-200 rounded-lg shadow-lg
                  ${dropdownPositionClasses[position]}
                `}
              >
                <div className="py-1">
                  {availableLanguages.map((lang: string) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-sm
                        transition-colors hover:bg-gray-50
                        ${lang === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                      `}
                    >
                      <span className="text-base" role="img" aria-label={getLanguageName(lang)}>
                        {getLanguageFlag(lang)}
                      </span>
                      <span className="flex-1 text-left">{getLanguageName(lang)}</span>
                      {lang === currentLanguage && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {availableLanguages.map((lang: string) => {
          const isActive = lang === currentLanguage
          
          return (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              disabled={isChanging || isChangingLang}
              className={`
                flex items-center gap-1 ${sizeClasses[size]} rounded-md
                transition-all duration-200 border
                ${isActive 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              {showFlag && (
                <span className="text-sm" role="img" aria-label={getLanguageName(lang)}>
                  {getLanguageFlag(lang)}
                </span>
              )}
              {showLabel && <span>{getLanguageName(lang)}</span>}
            </button>
          )
        })}
        
        {(isChanging || isChangingLang) && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span>Changing...</span>
          </div>
        )}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDropdown}
        disabled={isChanging || isChangingLang}
        className={`
          flex items-center gap-2 ${sizeClasses[size]}
          ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-20' : ''}
        `}
      >
        <Globe className="w-4 h-4" />
        
        {showFlag && (
          <span className="text-base" role="img" aria-label={currentName}>
            {currentFlag}
          </span>
        )}
        
        {showLabel && <span>{currentName}</span>}
        
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
        {(isChanging || isChangingLang) && (
          <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className={`
                absolute top-full mt-2 z-50 min-w-[180px]
                bg-white border border-gray-200 rounded-lg shadow-lg
                ${dropdownPositionClasses[position]}
              `}
            >
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  Select Language
                </div>
                
                {availableLanguages.map((lang: string) => {
                  const isActive = lang === currentLanguage
                  
                  return (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      disabled={isChanging || isChangingLang}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2
                        transition-colors hover:bg-gray-50 disabled:opacity-50
                        ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                      `}
                    >
                      <span className="text-lg" role="img" aria-label={getLanguageName(lang)}>
                        {getLanguageFlag(lang)}
                      </span>
                      
                      <span className="flex-1 text-left font-medium">
                        {getLanguageName(lang)}
                      </span>
                      
                      {isActive && (
                        <div className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-blue-600" />
                          <Badge variant="secondary" size="sm">
                            Current
                          </Badge>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              <div className="border-t border-gray-100 px-3 py-2">
                <p className="text-xs text-gray-500">
                  Language preference is saved locally
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Mobile-optimized language switcher for mobile layout
export const MobileLanguageSwitcher: React.FC<{
  onClose?: () => void
  className?: string
}> = ({ onClose, className = '' }) => {
  const {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    getLanguageName,
    getLanguageFlag,
    isChanging
  } = useLanguageSwitcher()

  const [isChangingLang, setIsChangingLang] = useState(false)

  const handleLanguageChange = useCallback(async (language: string) => {
    if (language === currentLanguage) return

    setIsChangingLang(true)

    try {
      await changeLanguage(language)
      onClose?.()
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChangingLang(false)
    }
  }, [currentLanguage, changeLanguage, onClose])

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
        Language / Idioma
      </div>
      
      {availableLanguages.map((lang: string) => {
        const isActive = lang === currentLanguage
        const isDisabled = isChanging || isChangingLang
        
        return (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            disabled={isDisabled}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-lg
              transition-all duration-200 disabled:opacity-50
              ${isActive 
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-xl" role="img" aria-label={getLanguageName(lang)}>
              {getLanguageFlag(lang)}
            </span>
            
            <span className="flex-1 text-left font-medium">
              {getLanguageName(lang)}
            </span>
            
            {isActive && (
              <Check className="w-5 h-5 text-blue-600" />
            )}
            
            {isDisabled && lang === currentLanguage && (
              <div className="w-4 h-4 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSwitcher