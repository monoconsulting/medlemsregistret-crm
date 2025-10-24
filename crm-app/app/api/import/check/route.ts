import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    const text = await file.text()
    const lines = text.trim().split('\n')
    const firstLine = lines[0]

    let firstRecord
    if (file.name.endsWith('.jsonl')) {
      firstRecord = JSON.parse(firstLine)
    } else {
      const parsed = JSON.parse(text)
      firstRecord = Array.isArray(parsed) ? parsed[0] : parsed
    }

    const municipalityName = firstRecord?.municipality
    if (!municipalityName) {
      return NextResponse.json(
        { error: 'Kunde inte hitta kommun i filen' },
        { status: 400 }
      )
    }

    // Find municipality by name
    const municipality = await prisma.municipality.findFirst({
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
    const count = await prisma.association.count({
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
