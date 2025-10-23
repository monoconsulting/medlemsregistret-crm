import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { getAIProvider } from '@/lib/ai/provider'

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const safeJsonParse = <T>(input: string): T | null => {
  try {
    const cleaned = input
      .trim()
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch (error) {
    console.warn('Failed to parse AI response', error)
    return null
  }
}

export const aiRouter = router({
  analyzeAssociation: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.db.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: true,
          notes: true,
          tags: true,
        },
      })

      if (!association) {
        throw new Error('Association not found')
      }

      const provider = getAIProvider()

      if (provider) {
        try {
          const response = await provider.chat([
            {
              role: 'system',
              content:
                'Du är en expert på medlemsrekrytering. Analysera data och svara med JSON {summary, metrics:{healthScore,engagement,readiness}, highlights[], recommendedActions[]}. Procentvärden ska inkludera %.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                name: association.name,
                municipality: association.municipality,
                tags: association.tags.map((tag) => tag.name),
                contacts: association.contacts,
                notes: association.notes,
                isMember: association.isMember,
              }),
            },
          ])

          const parsed = safeJsonParse<{
            summary: string
            metrics: { healthScore: string; engagement: string; readiness: string }
            highlights: string[]
            recommendedActions: string[]
          }>(response)

          if (parsed) {
            return parsed
          }
        } catch (error) {
          console.error('AI provider analyzeAssociation failed', error)
        }
      }

      const score = association.isMember ? 0.9 : 0.45
      const engagement = association.notes.length / Math.max(association.contacts.length, 1)
      const readiness = Math.min(1, engagement + (association.isMember ? 0.25 : 0))

      const highlight = association.tags.map((tag) => tag.name).slice(0, 3)

      return {
        summary: `Organisationen ${association.name} har ${association.contacts.length} registrerade kontakter och ${association.notes.length} anteckningar.`,
        metrics: {
          healthScore: formatPercent(score),
          engagement: formatPercent(Math.min(1, engagement)),
          readiness: formatPercent(readiness),
        },
        highlights: highlight,
        recommendedActions: [
          association.isMember
            ? 'Planera uppföljande medlemsmöte för att säkra förlängning.'
            : 'Boka ett introduktionssamtal för att presentera medlemsförmånerna.',
          association.email
            ? `Skicka ett personligt mail till ${association.email}`
            : 'Ingen e-post registrerad – kontakta istället via telefon.',
        ],
      }
    }),

  generateEmailDraft: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        tone: z.enum(['friendly', 'formal', 'followup']).default('friendly'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.db.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      })

      if (!association) {
        throw new Error('Association not found')
      }

      const contactName = association.contacts[0]?.name ?? 'kontaktperson'
      const provider = getAIProvider()

      if (provider) {
        try {
          const completion = await provider.chat([
            {
              role: 'system',
              content:
                'Du skriver professionella svenska e-postutkast. Svara endast med JSON {subject, body}.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                association: {
                  name: association.name,
                  municipality: association.municipality,
                  isMember: association.isMember,
                },
                contactName,
                tone: input.tone,
                sender: ctx.session?.user.name ?? 'Medlemsregistret-teamet',
              }),
            },
          ])

          const parsed = safeJsonParse<{ subject: string; body: string }>(completion)
          if (parsed?.subject && parsed?.body) {
            return parsed
          }
        } catch (error) {
          console.error('AI provider generateEmailDraft failed', error)
        }
      }

      const greeting = input.tone === 'formal' ? 'Hej' : 'Hej hej'
      const closing = input.tone === 'formal' ? 'Vänliga hälsningar' : 'Varma hälsningar'

      const body = `
${greeting} ${contactName},

Jag hoppas att allt är bra med er hos ${association.name}! Vi arbetar just nu med att stärka stödet till föreningar i ${association.municipality ?? 'er kommun'} och jag tror att ni skulle ha stor glädje av ett medlemskap i Medlemsregistret.

Vi kan bland annat hjälpa er med:
• Digitalt CRM-stöd för hela styrelsen
• Automatiserade påminnelser kring bidrag och rapportering
• Exklusiva nätverksträffar och utbildningar

Har ni möjlighet att ta ett kort möte nästa vecka för att berätta mer om era behov?

${closing},
${ctx.session?.user.name ?? 'Medlemsregistret-teamet'}
`

      return {
        subject:
          input.tone === 'followup'
            ? `Uppföljning: Medlemskap för ${association.name}`
            : `Inbjudan till samtal – ${association.name}`,
        body: body.trim(),
      }
    }),

  nextSteps: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const association = await ctx.db.association.findUnique({
        where: { id: input.associationId },
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          activityLog: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })

      if (!association) {
        throw new Error('Association not found')
      }

      const lastNote = association.notes[0]?.content ?? 'Ingen anteckning registrerad'

      const provider = getAIProvider()

      if (provider) {
        try {
          const response = await provider.chat([
            {
              role: 'system',
              content:
                'Du är en proaktiv kundansvarig. Svara med JSON {suggestedNextSteps: string[]} med 3 konkreta steg på svenska.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                association: {
                  name: association.name,
                  pipeline: association.pipeline,
                  crmStatus: association.crmStatus,
                  hasUpcomingMeeting: association.activityLog.some((activity) => activity.type === 'MEETING_SCHEDULED'),
                  lastNote,
                },
              }),
            },
          ])

          const parsed = safeJsonParse<{ suggestedNextSteps: string[] }>(response)
          if (parsed?.suggestedNextSteps?.length) {
            return parsed
          }
        } catch (error) {
          console.error('AI provider nextSteps failed', error)
        }
      }

      return {
        suggestedNextSteps: [
          'Föreslå ett uppstartsmöte med styrelsen.',
          association.phone ? 'Ring upp för att diskutera kommande aktiviteter.' : 'Skicka SMS för att boka in telefonsamtal.',
          `Följ upp senast antecknad aktivitet: "${lastNote.substring(0, 80)}${lastNote.length > 80 ? '…' : ''}"`,
        ],
      }
    }),
})
