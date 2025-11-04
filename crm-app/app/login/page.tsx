"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.login(email, password)
      router.push("/associations")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ett oväntat fel inträffade")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow"
      >
        <h2 className="text-xl font-semibold">Logga in</h2>
        <p className="text-sm text-slate-600">
          Ange dina uppgifter för att komma åt medlemsregistret. Uppgifterna kontrolleras via PHP-API:t på samma origin.
        </p>
        {error ? (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        <label className="block text-sm font-medium text-slate-700">
          E-post
          <input
            className="mt-1 w-full rounded border border-slate-300 p-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Lösenord
          <input
            className="mt-1 w-full rounded border border-slate-300 p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Loggar in…" : "Logga in"}
        </button>
      </form>
    </div>
  )
}
