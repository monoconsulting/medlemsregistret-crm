import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import { ReactQueryProvider } from '@/lib/query-client'
import { Toaster } from '@/components/ui/toaster'
import { ToastProvider } from '@/components/ui/use-toast'

export const metadata: Metadata = {
  title: 'Medlemsregistret CRM',
  description: 'Administrera föreningar och medlemskap',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-100">
        <ToastProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
