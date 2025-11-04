"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/lib/trpc/client"
import { Loader2, Save } from "lucide-react"

interface JsonViewerModalProps {
  municipalityName: string
  children: React.ReactNode
}

export function JsonViewerModal({ municipalityName, children }: JsonViewerModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [jsonContent, setJsonContent] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)

  const filesQuery = trpc.scraping.getJsonFiles.useQuery(
    { municipalityName },
    { enabled: open }
  )

  const contentQuery = trpc.scraping.getJsonContent.useQuery(
    { fileName: selectedFile! },
    { enabled: !!selectedFile && open }
  )

  const updateMutation = trpc.scraping.updateJsonFile.useMutation()

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedFile) return

    try {
      const content = JSON.parse(jsonContent)
      await updateMutation.mutateAsync({
        fileName: selectedFile,
        content,
      })
      setIsEditing(false)
      contentQuery.refetch()
    } catch (error) {
      alert("Ogiltig JSON")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>JSON-filer för {municipalityName}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[60vh]">
          {/* File list */}
          <div className="w-1/3 border rounded p-4">
            <h3 className="font-semibold mb-2">Historiska filer</h3>
            {filesQuery.isLoading ? (
              <div>Laddar...</div>
            ) : (
              <div className="space-y-2">
                {filesQuery.data?.map((file) => (
                  <button
                    key={file}
                    onClick={() => handleFileSelect(file)}
                    className={`w-full text-left p-2 rounded ${
                      selectedFile === file ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {file}
                  </button>
                )) || <div>Inga filer hittades</div>}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 border rounded p-4">
            {selectedFile ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">{selectedFile}</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button size="sm" onClick={() => setIsEditing(true)}>
                        Redigera
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                          Avbryt
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Spara
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {contentQuery.isLoading ? (
                  <div>Laddar...</div>
                ) : (
                  <Textarea
                    value={isEditing ? jsonContent : JSON.stringify(contentQuery.data, null, 2)}
                    onChange={(e) => setJsonContent(e.target.value)}
                    readOnly={!isEditing}
                    className="h-full font-mono text-sm"
                    onFocus={() => {
                      if (!isEditing) setJsonContent(JSON.stringify(contentQuery.data, null, 2))
                    }}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Välj en fil för att visa innehållet
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}