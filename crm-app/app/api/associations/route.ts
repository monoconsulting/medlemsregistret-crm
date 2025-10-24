import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const municipalityId = searchParams.get('municipalityId')
    const status = searchParams.get('status')
    const pipeline = searchParams.get('pipeline')

    // Build where clause based on filters
    const where: any = {
      isDeleted: false,
    }

    if (municipalityId) {
      where.municipalityId = municipalityId
    }

    if (status) {
      where.crmStatus = status
    }

    if (pipeline) {
      where.pipeline = pipeline
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { orgNumber: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const associations = await db.association.findMany({
      where,
      select: {
        id: true,
        name: true,
        orgNumber: true,
        types: true,
        activities: true,
        streetAddress: true,
        postalCode: true,
        city: true,
        email: true,
        phone: true,
        homepageUrl: true,
        crmStatus: true,
        pipeline: true,
        isMember: true,
        memberSince: true,
        assignedTo: true,
        scrapedAt: true,
        description: true,
        descriptionFreeText: true,
        extras: true,
        municipality: true,
        municipalityRecord: {
          select: {
            id: true,
            name: true,
            platform: true,
          },
        },
        contacts: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            phone: true,
            isPrimary: true,
          },
          where: {
            isPrimary: true,
          },
          take: 1,
        },
        descriptionSections: {
          select: {
            id: true,
            title: true,
            data: true,
            orderIndex: true,
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        notes: {
          select: {
            id: true,
            content: true,
            authorName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            contacts: true,
            notes: true,
            tags: true,
          }
        }
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
