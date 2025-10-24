import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import {
  ImporterError,
  importAssociations,
  parseFixtureContent,
  type ImportMode,
  type ImportFile,
} from '@/lib/importer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const municipalityId = (formData.get('municipalityId') as string | null) || undefined
    const rawMode = (formData.get('mode') as string | null)?.toLowerCase()
    const mode: ImportMode = rawMode === 'new' || rawMode === 'replace' || rawMode === 'update' ? (rawMode as ImportMode) : 'update'

    if (!files.length) {
      return NextResponse.json({ error: 'Ingen fil vald' }, { status: 400 })
    }

    const parsedFiles: ImportFile[] = []

    for (const file of files) {
      const content = await file.text()
      const records = parseFixtureContent(file.name, content)

      if (!records.length) {
        continue
      }

      parsedFiles.push({ filename: file.name, records })
    }

    if (!parsedFiles.length) {
      return NextResponse.json({ error: 'Filerna innehåller inga föreningar' }, { status: 400 })
    }

    const result = await importAssociations({
      prisma: db,
      files: parsedFiles,
      mode,
      municipalityId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import error:', error)

    if (error instanceof ImporterError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ett oväntat fel uppstod' },
      { status: 500 }
    )
  }
}
