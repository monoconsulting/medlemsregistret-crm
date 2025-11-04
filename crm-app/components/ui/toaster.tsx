"use client"

import { useEffect } from 'react'
import { useToast } from './use-toast'
import clsx from 'clsx'

export function Toaster() {
  const { messages, dismiss } = useToast()

  useEffect(() => {
    if (messages.length === 0) return
    const timers = messages.map((msg) => window.setTimeout(() => dismiss(msg.id), 4000))
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [messages, dismiss])

  if (messages.length === 0) return null

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            'w-full max-w-sm rounded-md border px-4 py-3 shadow-md backdrop-blur-sm',
            {
              'border-emerald-500 bg-emerald-50 text-emerald-900': message.variant === 'success',
              'border-rose-500 bg-rose-50 text-rose-900': message.variant === 'destructive',
              'border-slate-300 bg-white text-slate-900': !message.variant || message.variant === 'default',
            },
          )}
        >
          {message.title && <p className="font-semibold">{message.title}</p>}
          {message.description && <p className="text-sm opacity-80">{message.description}</p>}
        </div>
      ))}
    </div>
  )
}
