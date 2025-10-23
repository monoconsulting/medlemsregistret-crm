'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const error = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setFormError('Felaktig e-post eller lösenord')
      setIsLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Logga in</CardTitle>
          <CardDescription>Välkommen tillbaka till Medlemsregistret CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {(formError || error) && (
              <Alert variant="destructive">
                <AlertDescription>{formError ?? 'Inloggningen misslyckades. Försök igen.'}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loggar in...
                </span>
              ) : (
                'Logga in'
              )}
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled>
              <span className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Magisk länk (kommer snart)
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
