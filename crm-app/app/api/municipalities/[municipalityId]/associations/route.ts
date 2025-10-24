import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ municipalityId: string }> }
) {
  try {
    const { municipalityId } = await params
    const associations = await db.association.findMany({
      where: {
        municipalityId,
      },
      select: {
        id: true,
        name: true,
        orgNumber: true,
        email: true,
        phone: true,
        streetAddress: true,
        postalCode: true,
        city: true,
        homepageUrl: true,
        types: true,
        activities: true,
        categories: true,
        crmStatus: true,
        pipeline: true,
        isMember: true,
        isDeleted: true,
        scrapedAt: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(associations)
  } catch (error) {
    console.error('Error fetching associations:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid hämtning av föreningar' },
      { status: 500 }
    )
  }
}
