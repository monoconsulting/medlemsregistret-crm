import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-6 py-16 text-center">
      <div className="max-w-md space-y-6 rounded-lg bg-background p-10 shadow-lg">
        <h1 className="text-2xl font-semibold">Åtkomst nekad</h1>
        <p className="text-sm text-muted-foreground">
          Du saknar nödvändiga rättigheter för att visa den här sidan. Kontakta en administratör om du
          tror att detta är felaktigt.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Tillbaka till översikten
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Logga in med annat konto
          </Link>
        </div>
      </div>
    </div>
  )
}
