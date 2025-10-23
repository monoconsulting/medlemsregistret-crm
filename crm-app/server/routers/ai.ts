import { router, protectedProcedure } from '../trpc'
import type { TRPCContext } from '../trpc'
import { z } from 'zod'
import { TRPCError } from '@trpc/server'

async function fetchAssociation(ctx: TRPCContext, associationId: string) {
  return ctx.db.association.findUnique({
    where: { id: associationId },
    include: {
      contacts: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      tags: true,
      activityLog: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

type AssociationWithRelations = NonNullable<Awaited<ReturnType<typeof fetchAssociation>>>

function buildInsights(association: AssociationWithRelations) {
  const latestNote = association.notes[0]
  const engagementScore = association.activityLog.length * 10 + association.notes.length * 5
  const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30
  const isDormant = association.activityLog.every((activity) => activity.createdAt.getTime() < thirtyDaysAgo)

  const recommendedPipelineStep =
    association.crmStatus === 'CONTACTED' && isDormant ? 'FOLLOW_UP' : association.pipeline

  return {
    summary: `Föreningen ${association.name} i ${association.municipality} är markerad som ${association.crmStatus.toLowerCase()} i pipelinen (${association.pipeline}).`,
    latestNote: latestNote
      ? {
          excerpt: latestNote.content.slice(0, 140),
          createdAt: latestNote.createdAt,
        }
      : null,
    tags: association.tags.map((tag) => tag.name),
    engagementScore,
    recommendedPipelineStep,
    dormant: isDormant,
  }
}

function buildEmailDraft(
  association: AssociationWithRelations,
  author: { name?: string | null; email?: string | null }
) {
  const greeting = association.contacts.find((contact) => contact.isPrimary)?.name ?? association.name
  const intro = association.isMember
    ? `Hoppas allt är bra med er. Vi uppskattar verkligen ert medlemskap i ${association.municipality}.`
    : `Jag vill gärna följa upp vårt senaste samtal och se hur vi kan stötta ${association.name}.`

  const closing = association.isMember
    ? 'Återkom gärna om det finns något vi kan hjälpa till med den här säsongen.'
    : 'Hör gärna av er om ni vill veta mer eller boka in ett uppföljande möte.'

  const focusArea = association.tags.map((tag) => tag.name).slice(0, 3).join(', ') || 'ert engagemang'
  const noteLine = association.notes[0]?.content
    ? `Senaste anteckning: ${association.notes[0]?.content.slice(0, 120)}...`
    : ''

  return {
    subject: association.isMember
      ? `Tack för ert engagemang i ${association.municipality}`
      : `Uppföljning: ${association.name}`,
    body: `Hej ${greeting},\n\n${intro}\n\nUtifrån våra tidigare kontakter ser vi potential inom ${focusArea}. ${noteLine}\n\n${closing}\n\nVänliga hälsningar,\n${author.name ?? 'Ditt namn'}${author.email ? `\n${author.email}` : ''}`,
  }
}

function buildNextSteps(association: AssociationWithRelations) {
  const steps: string[] = []

  if (!association.isMember) {
    steps.push('Planera en riktad uppföljning inom de kommande 7 dagarna.')
  }

  if (association.notes.length === 0) {
    steps.push('Dokumentera senaste kontaktpunkten med en anteckning för teamet.')
  }

  if (association.tags.length === 0) {
    steps.push('Tagga föreningen med relevanta aktiviteter för bättre segmentering.')
  }

  const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30
  if (association.activityLog.every((activity) => activity.createdAt.getTime() < thirtyDaysAgo)) {
    steps.push('Ingen aktivitet på 30 dagar – planera en check-in för att återaktivera dialogen.')
  }

  if (steps.length === 0) {
    steps.push('Fortsätt dialogen enligt plan – läget ser stabilt ut.')
  }

  return steps
}

export const aiRouter = router({
  analyzeAssociation: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const association = await fetchAssociation(ctx, input.associationId)
      if (!association) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Föreningen kunde inte hittas' })
      }

      return buildInsights(association)
    }),
  emailDraft: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const association = await fetchAssociation(ctx, input.associationId)
      if (!association) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Föreningen kunde inte hittas' })
      }

      return buildEmailDraft(association, ctx.session.user)
    }),
  nextSteps: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const association = await fetchAssociation(ctx, input.associationId)
      if (!association) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Föreningen kunde inte hittas' })
      }

      return {
        steps: buildNextSteps(association),
      }
    }),
})
