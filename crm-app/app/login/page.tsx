'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/providers/auth-provider'
import { logAuthClientEvent } from '@/lib/auth-flow/client'

const loginSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(4, 'Lösenordet måste vara minst 4 tecken'),
})

type LoginSchema = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: params.get('email') ?? '',
      password: '',
    },
  })

  useEffect(() => {
    logAuthClientEvent({
      stage: 'client.page.login.mount',
      context: {
        prefilledEmail: params.get('email') ?? null,
      },
    })
  }, [params])

  const onSubmit = async (values: LoginSchema) => {
    setError(null)
    setIsSubmitting(true)

    const result = await login(values.email, values.password)
    setIsSubmitting(false)

    if (!result.ok) {
      setError(result.error ?? 'Felaktig e-post eller lösenord')
      logAuthClientEvent({
        stage: 'client.page.login.error',
        severity: 'warn',
        context: { message: result.error ?? 'unknown' },
      })
      return
    }

    router.push('/dashboard')
    logAuthClientEvent({
      stage: 'client.page.login.redirect',
      context: { destination: '/dashboard' },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">Logga in</CardTitle>
          <p className="text-sm text-muted-foreground">
            Använd dina administratörsuppgifter för att fortsätta
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-postadress</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="namn@forening.se" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lösenord</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Loggar in…' : 'Logga in'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-xs text-muted-foreground">
          <span>Behöver du ett konto? Kontakta systemadministratören.</span>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-semibold">Logga in</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
