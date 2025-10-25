import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { ImporterError, parseFixtureContent } from '@/lib/importer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fil krävs' }, { status: 400 })
    }

    const content = await file.text()
    const records = parseFixtureContent(file.name, content)

    if (!records.length) {
      return NextResponse.json({ error: 'Filen innehåller inga föreningar' }, { status: 400 })
    }

    const municipalityName = records[0]?.municipality?.trim()

    if (!municipalityName) {
      return NextResponse.json({ error: 'Kunde inte hitta kommun i filen' }, { status: 400 })
    }

    const municipality = await db.municipality.findFirst({
      where: { name: municipalityName },
      select: { id: true, name: true },
    })

    if (!municipality) {
      return NextResponse.json(
        {
          hasData: false,
          count: 0,
          municipalityName,
          municipalityId: null,
        },
        { status: 200 }
      )
    }

    const count = await db.association.count({
      where: { municipalityId: municipality.id },
    })

    return NextResponse.json({
      hasData: count > 0,
      count,
      municipalityName: municipality.name,
      municipalityId: municipality.id,
    })
  } catch (error) {
    console.error('Check error:', error)

    if (error instanceof ImporterError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Ett fel uppstod vid kontroll av befintlig data' }, { status: 500 })
  }
}
