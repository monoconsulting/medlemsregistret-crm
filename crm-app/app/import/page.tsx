"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { resolveBackendUrl } from "@/lib/backend-base"
import { Loader2, Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react"

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    total: number
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Fetch CSRF token first
      const csrfUrl = resolveBackendUrl("api/csrf.php")
      const csrfRes = await fetch(csrfUrl)
      const csrfData = await csrfRes.json()

      if (!csrfData.ok || !csrfData.token) {
        throw new Error("Failed to obtain security token")
      }

      const url = resolveBackendUrl("api/import_associations.php")
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfData.token,
        },
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const url = resolveBackendUrl("api/import_associations.php")
    window.location.href = url
  }

  return (
    <AppLayout title="Import" description="Importera föreningsdata">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Importera föreningar</CardTitle>
            <CardDescription>
              Ladda upp en CSV-fil med föreningar för att importera dem till systemet.
              Filen måste vara semikolonseparerad och använda ANSI (Windows-1252) teckenkodning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>1. Ladda ner mall</Label>
                <p className="text-sm text-muted-foreground">
                  Använd denna mall för att säkerställa att formatet är korrekt.
                </p>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Ladda ner CSV-mall
                </Button>
              </div>

              <div className="space-y-2">
                <Label>2. Välj fil</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Importera
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fel vid import</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <Alert variant={result.failed === 0 ? "default" : "destructive"}>
                  {result.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>Import slutförd</AlertTitle>
                  <AlertDescription>
                    Totalt: {result.total} rader. Importerade: {result.imported}. Misslyckades: {result.failed}.
                  </AlertDescription>
                </Alert>

                {result.errors.length > 0 && (
                  <div className="border rounded-md p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Felmeddelanden:</h4>
                    <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Instruktioner</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Filen måste vara sparad som <strong>CSV (semikolonseparerad)</strong>.</li>
                <li>Teckenkodning ska vara <strong>Windows-1252 (ANSI)</strong> för att å, ä, ö ska fungera korrekt.</li>
                <li>Obligatorisk kolumn: <strong>Föreningsnamn</strong>.</li>
                <li>Övriga kolumner matchas mot rubrikerna i mallen.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
