import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipalityId: string }> }
) {
  try {
    const { municipalityId } = await params
    const municipality = await db.municipality.findUnique({
      where: { id: municipalityId },
      select: {
        id: true,
        name: true,
        code: true,
        county: true,
        countyCode: true,
        province: true,
        population: true,
        registerUrl: true,
        registerStatus: true,
        platform: true,
        latitude: true,
        longitude: true,
      }
    })

    if (!municipality) {
      return NextResponse.json(
        { error: 'Kommun hittades inte' },
        { status: 404 }
      )
    }

    return NextResponse.json(municipality)
  } catch (error) {
    console.error('Error fetching municipality:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid hämtning av kommun' },
      { status: 500 }
    )
  }
}
