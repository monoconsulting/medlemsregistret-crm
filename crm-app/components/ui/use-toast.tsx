"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface ToastMessage {
  id: number
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextValue {
  messages: ToastMessage[]
  toast: (message: Omit<ToastMessage, 'id'>) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])
  const toast = useCallback((message: Omit<ToastMessage, 'id'>) => {
    setMessages((current) => {
      const id = Date.now() + Math.random()
      return [...current, { ...message, id }]
    })
  }, [])

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((msg) => msg.id !== id))
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ messages, toast, dismiss }), [messages, toast, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider')
  return ctx
}
