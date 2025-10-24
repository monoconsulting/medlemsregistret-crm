import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { content, authorName } = await request.json()

    const note = await db.note.create({
      data: {
        content,
        authorName,
        authorId: 'system', // TODO: Replace with actual user ID when auth is implemented
        tags: [],
        associationId: params.id,
      },
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod vid skapande av anteckning' },
      { status: 500 }
    )
  }
}
