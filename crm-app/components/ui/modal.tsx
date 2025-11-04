"use client"

import { ReactNode } from 'react'
import clsx from 'clsx'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}

export function Modal({ title, open, onClose, children, footer, widthClass }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" role="dialog" aria-modal="true">
      <div className={clsx('max-h-[90vh] w-full overflow-hidden rounded-lg bg-white shadow-xl', widthClass ?? 'max-w-2xl')}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-700"
            onClick={onClose}
            aria-label="Stäng"
          >
            Stäng
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          {children}
        </div>
        {footer && <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
