"use client"

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await api.login(email.trim(), password)
      toast({ title: 'Inloggad', description: 'Du är nu inloggad.', variant: 'success' })
      router.push('/associations')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inloggningen misslyckades'
      toast({ title: 'Fel vid inloggning', description: message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Medlemsregistret CRM</h1>
        <p className="mt-2 text-sm text-slate-600">Logga in för att administrera föreningar.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-post
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-600 text-white hover:bg-sky-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  )
}
