'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', duration = 5000, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full max-w-md items-start gap-4 overflow-hidden rounded-lg border p-4 shadow-lg',
        'transition-all animate-in slide-in-from-top-full',
        {
          'bg-white border-gray-200': variant === 'default',
          'bg-green-50 border-green-200': variant === 'success',
          'bg-red-50 border-red-200': variant === 'error',
        }
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-1 space-y-1">
        {title && (
          <div
            className={cn('text-sm font-semibold', {
              'text-gray-900': variant === 'default',
              'text-green-900': variant === 'success',
              'text-red-900': variant === 'error',
            })}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            className={cn('text-sm', {
              'text-gray-700': variant === 'default',
              'text-green-700': variant === 'success',
              'text-red-700': variant === 'error',
            })}
          >
            {description}
          </div>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:opacity-75',
          {
            'text-gray-500': variant === 'default',
            'text-green-700': variant === 'success',
            'text-red-700': variant === 'error',
          }
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export interface ToastProviderProps {
  children: React.ReactNode
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id, onClose: removeToast }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
