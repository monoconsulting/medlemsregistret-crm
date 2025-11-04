import type { Metadata } from "next"
import "./globals.css"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Medlemsregistret CRM",
  description: "Standalone frontend powered by PHP API",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col p-4">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-semibold">Medlemsregistret CRM</h1>
            <p className="text-sm text-slate-600">
              Samma upplevelse lokalt och på Loopia – data hämtas från PHP-API:t på samma origin.
            </p>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
