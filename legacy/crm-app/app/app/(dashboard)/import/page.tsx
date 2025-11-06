"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileJson, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"

interface ImportStats {
  totalRecords: number
  importedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  deletedCount?: number
  errors: string[]
}

export default function ImportPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [existingDataInfo, setExistingDataInfo] = useState<{municipalityName: string, count: number} | null>(null)
  const [detectedMunicipality, setDetectedMunicipality] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const jsonFiles = files.filter(f => f.name.endsWith('.json') || f.name.endsWith('.jsonl'))

    if (jsonFiles.length !== files.length) {
      setError("Endast JSON och JSONL filer är tillåtna")
      return
    }

    setSelectedFiles(jsonFiles)
    setError(null)
    setDetectedMunicipality(null)

    // Try to detect municipality from first file
    if (jsonFiles.length > 0) {
      try {
        const firstFile = jsonFiles[0]
        const text = await firstFile.text()
        const lines = text.trim().split('\n')
        const firstLine = lines[0]
        
        let firstRecord
        if (firstFile.name.endsWith('.jsonl')) {
          firstRecord = JSON.parse(firstLine)
        } else {
          const parsed = JSON.parse(text)
          firstRecord = Array.isArray(parsed) ? parsed[0] : parsed
        }

        if (firstRecord?.municipality) {
          setDetectedMunicipality(firstRecord.municipality)
        }
      } catch (err) {
        console.error('Failed to detect municipality:', err)
      }
    }
  }

  const checkExistingData = async () => {
    if (selectedFiles.length === 0) {
      setError("Välj filer först")
      return
    }

    try {
      // Send first file to check endpoint to detect municipality and check for existing data
      const formData = new FormData()
      formData.append('file', selectedFiles[0])

      const response = await fetch(`/api/import/check`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (data.hasData) {
        setExistingDataInfo({ municipalityName: data.municipalityName, count: data.count })
        setShowConfirmDialog(true)
      } else {
        // No existing data, proceed with import
        await handleImport("new")
      }
    } catch (err) {
      setError("Kunde inte kontrollera befintlig data")
    }
  }

  const handleImport = async (mode: "new" | "update" | "replace") => {
    if (selectedFiles.length === 0) {
      setError("Välj filer")
      return
    }

    setIsUploading(true)
    setError(null)
    setImportStats(null)
    setShowConfirmDialog(false)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      formData.append('mode', mode)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Import misslyckades: ${response.statusText}`)
      }

      const result = await response.json()
      setImportStats(result)
      setSelectedFiles([])
      setDetectedMunicipality(null)

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett oväntat fel uppstod")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import</h1>
        <p className="text-muted-foreground">
          Importera föreningsdata från JSON-filer
        </p>
      </div>

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle>Importera föreningar</CardTitle>
          <CardDescription>
            Välj JSON-filer med föreningsdata. Kommunen hämtas automatiskt från filerna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">JSON-filer</Label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".json,.jsonl"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {detectedMunicipality && (
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Upptäckt kommun: {detectedMunicipality}
                      </div>
                    )}
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileJson className="h-4 w-4" />
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={checkExistingData}
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importerar...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importera
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Confirmation Dialog */}
          {showConfirmDialog && existingDataInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    Det finns redan {existingDataInfo.count} föreningar för {existingDataInfo.municipalityName}.
                  </p>
                  <p className="text-sm">Hur vill du hantera importen?</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImport("update")}
                      disabled={isUploading}
                    >
                      Uppdatera befintliga
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleImport("replace")}
                      disabled={isUploading}
                    >
                      Ersätt alla
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Stats */}
          {importStats && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-900">Import slutförd!</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                    <div>Totalt poster: {importStats.totalRecords}</div>
                    <div>Importerade: {importStats.importedCount}</div>
                    <div>Uppdaterade: {importStats.updatedCount}</div>
                    <div>Överhoppade: {importStats.skippedCount}</div>
                    {importStats.deletedCount !== undefined && importStats.deletedCount > 0 && (
                      <div className="col-span-2 text-orange-600">
                        Soft-deleted (saknas i import): {importStats.deletedCount}
                      </div>
                    )}
                    {importStats.errorCount > 0 && (
                      <div className="col-span-2 text-red-600">
                        Fel: {importStats.errorCount}
                      </div>
                    )}
                  </div>
                  {importStats.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Visa fel ({importStats.errors.length})
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs">
                        {importStats.errors.map((err, i) => (
                          <li key={i} className="text-red-600">{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruktioner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Välj en eller flera JSON/JSONL-filer med föreningsdata</p>
          <p>2. Kommunen identifieras automatiskt från filens innehåll</p>
          <p>3. Klicka på Importera för att starta importen</p>
          <p>4. Om det redan finns data för kommunen får du välja att uppdatera eller ersätta</p>
          <p className="mt-4 text-xs">
            <strong>Observera:</strong> Föreningar matchas baserat på detaljURL. Om samma URL finns kommer den befintliga posten att uppdateras.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
