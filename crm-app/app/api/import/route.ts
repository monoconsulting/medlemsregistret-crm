import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { importAssociations, parseImportFile, type ImportMode } from '@/lib/importer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const municipalityId = (formData.get('municipalityId') as string | null) ?? undefined
    const mode = (formData.get('mode') as ImportMode | null) ?? 'new'

    if (!files.length) {
      return NextResponse.json(
        { error: 'Ingen fil vald' },
        { status: 400 }
      )
    }

    const parsedFiles = await Promise.all(
      files.map(async (file) => {
        const content = await file.text()
        return parseImportFile(file.name, content)
      })
    )

    const result = await importAssociations({
      prisma: db,
      files: parsedFiles,
      mode,
      municipalityId: municipalityId ?? undefined,
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod' },
      { status: 500 }
    )
  }
}
