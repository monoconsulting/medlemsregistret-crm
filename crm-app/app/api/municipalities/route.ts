import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Updated to include all municipality fields

export async function GET() {
  try {
    const municipalities = await prisma.municipality.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        county: true,
        countyCode: true,
        province: true,
        population: true,
        registerStatus: true,
        platform: true,
        latitude: true,
        longitude: true,
        registerUrl: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(municipalities)
  } catch (error) {
    console.error('Error fetching municipalities:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid hämtning av kommuner' },
      { status: 500 }
    )
  }
}
