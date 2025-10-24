import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseImportFile } from '@/lib/importer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Fil krävs' },
        { status: 400 }
      )
    }

    // Read and parse the file to extract municipality
    const parsed = parseImportFile(file.name, await file.text())
    const firstRecord = parsed.records[0]

    const municipalityName = firstRecord?.municipality
    if (!municipalityName) {
      return NextResponse.json(
        { error: 'Kunde inte hitta kommun i filen' },
        { status: 400 }
      )
    }

    // Find municipality by name
    const municipality = await db.municipality.findFirst({
      where: { name: municipalityName },
      select: { id: true, name: true }
    })

    if (!municipality) {
      return NextResponse.json(
        { error: `Kommun "${municipalityName}" finns inte i databasen` },
        { status: 404 }
      )
    }

    // Count existing associations
    const count = await db.association.count({
      where: { municipalityId: municipality.id }
    })

    return NextResponse.json({
      hasData: count > 0,
      count,
      municipalityName: municipality.name,
      municipalityId: municipality.id
    })

  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid kontroll av befintlig data' },
      { status: 500 }
    )
  }
}
