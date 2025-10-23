import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

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
        },
      })

      if (!association) {
        throw new Error('Association not found')
      }

      const lastNote = association.notes[0]?.content ?? 'Ingen anteckning registrerad'

      return {
        suggestedNextSteps: [
          'Föreslå ett uppstartsmöte med styrelsen.',
          association.phone ? 'Ring upp för att diskutera kommande aktiviteter.' : 'Skicka SMS för att boka in telefonsamtal.',
          `Följ upp senast antecknad aktivitet: "${lastNote.substring(0, 80)}${lastNote.length > 80 ? '…' : ''}"`,
        ],
      }
    }),
})
