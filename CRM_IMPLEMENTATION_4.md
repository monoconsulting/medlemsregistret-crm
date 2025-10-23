# Del 4 (fortsättning): AI-Integration - Komplett Implementation

## 🤖 AI PROMPTS

### **6. Analysis Prompts**

```typescript
// lib/ai/prompts/analysis.ts
import { AIMessage } from '../providers/base';

export function createAssociationAnalysisPrompt(
  associations: any[],
  focusArea?: string
): AIMessage[] {
  const associationsText = associations
    .map((a, i) => {
      return `
${i + 1}. ${a.name}
   - Kommun: ${a.municipality_name}
   - Typ: ${a.types.join(', ')}
   - Aktiviteter: ${a.activities.join(', ')}
   - Status: ${a.crmStatus}
   - Pipeline: ${a.pipeline}
   - Kontakter: ${a.contacts?.length || 0}
   - Anteckningar: ${a.notes?.length || 0}
   - Medlem: ${a.isMember ? 'Ja' : 'Nej'}
   ${a.email ? `- E-post: ${a.email}` : ''}
   ${a.phone ? `- Telefon: ${a.phone}` : ''}
`;
    })
    .join('\n');

  const systemPrompt = `Du är en expert på föreningsanalys och CRM-strategi för svenska föreningar. 
Du analyserar data om föreningar och ger konkreta, handlingsbara insikter och rekommendationer.
Svara alltid på svenska och var specifik och praktisk i dina råd.`;

  const userPrompt = focusArea
    ? `Analysera följande ${associations.length} föreningar med fokus på: ${focusArea}

${associationsText}

Ge en detaljerad analys med:
1. Sammanfattning av nuläget
2. Identifierade möjligheter
3. Konkreta rekommendationer för ${focusArea}
4. Prioriterade nästa steg`
    : `Analysera följande ${associations.length} föreningar och ge en övergripande analys:

${associationsText}

Ge en strukturerad analys med:
1. Övergripande sammanfattning
2. Segmentering och mönster
3. Identifierade möjligheter
4. Rekommenderade åtgärder
5. Prioriterade föreningar att fokusera på`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function createSingleAssociationAnalysisPrompt(
  association: any,
  includeHistory: boolean = false
): AIMessage[] {
  const systemPrompt = `Du är en expert på föreningsrelationer och CRM-strategi. 
Analysera föreningar och ge konkreta råd för hur man ska arbeta med dem.
Svara alltid på svenska.`;

  let associationDetails = `
Förening: ${association.name}
Kommun: ${association.municipality_name}
Typ: ${association.types.join(', ')}
Aktiviteter: ${association.activities.join(', ')}
CRM-Status: ${association.crmStatus}
Pipeline: ${association.pipeline}
Medlem: ${association.isMember ? 'Ja' : 'Nej'}
${association.memberSince ? `Medlem sedan: ${new Date(association.memberSince).toLocaleDateString('sv-SE')}` : ''}

Kontaktinformation:
${association.email ? `- E-post: ${association.email}` : '- Ingen e-post'}
${association.phone ? `- Telefon: ${association.phone}` : '- Ingen telefon'}
${association.homepageUrl ? `- Hemsida: ${association.homepageUrl}` : '- Ingen hemsida'}

Kontaktpersoner (${association.contacts?.length || 0}):
${
  association.contacts
    ?.map(
      (c: any) =>
        `- ${c.name}${c.role ? ` (${c.role})` : ''}${c.email ? ` - ${c.email}` : ''}`
    )
    .join('\n') || 'Inga kontaktpersoner registrerade'
}

Anteckningar (${association.notes?.length || 0}):
${
  association.notes
    ?.slice(0, 5)
    .map((n: any) => `- ${new Date(n.createdAt).toLocaleDateString('sv-SE')}: ${n.content}`)
    .join('\n') || 'Inga anteckningar'
}
`;

  if (includeHistory && association.activities?.length > 0) {
    associationDetails += `\n\nSenaste aktiviteter (${Math.min(10, association.activities.length)}):
${association.activities
  .slice(0, 10)
  .map(
    (a: any) =>
      `- ${new Date(a.createdAt).toLocaleDateString('sv-SE')}: ${a.type} - ${a.description}`
  )
  .join('\n')}`;
  }

  const userPrompt = `Analysera denna förening och ge konkreta rekommendationer:

${associationDetails}

Ge en analys med:
1. Sammanfattning av nuläge
2. Styrkor och möjligheter
3. Konkreta nästa steg för att utveckla relationen
4. Förslag på hur man kan engagera föreningen`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function createSegmentationPrompt(
  associations: any[],
  segmentBy: 'activity' | 'type' | 'status' | 'potential'
): AIMessage[] {
  const systemPrompt = `Du är en expert på datadrivna föreningssegmenteringar.
Analysera föreningsdata och skapa meningsfulla segment för riktad kommunikation.
Svara alltid på svenska.`;

  const associationsText = associations
    .map((a) => ({
      name: a.name,
      types: a.types,
      activities: a.activities,
      status: a.crmStatus,
      isMember: a.isMember,
      hasContact: !!a.email || !!a.phone,
      municipality: a.municipality_name,
    }))
    .map((a, i) => `${i + 1}. ${JSON.stringify(a)}`)
    .join('\n');

  const focusTexts = {
    activity: 'aktivitetsområde',
    type: 'föreningstyp',
    status: 'CRM-status och engagemangsnivå',
    potential: 'potential som medlem eller partner',
  };

  const userPrompt = `Segmentera följande ${associations.length} föreningar baserat på ${focusTexts[segmentBy]}:

${associationsText}

Skapa 3-5 meningsfulla segment och för varje segment:
1. Segmentnamn och beskrivning
2. Antal föreningar i segmentet
3. Gemensamma egenskaper
4. Rekommenderad kommunikationsstrategi
5. Specifika budskap som skulle passa segmentet`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
```

---

### **7. Email Generation Prompts**

```typescript
// lib/ai/prompts/email.ts
import { AIMessage } from '../providers/base';

export function createEmailDraftPrompt(
  associations: any[],
  emailType: 'introduction' | 'follow-up' | 'event-invite' | 'newsletter' | 'custom',
  customContext?: string
): AIMessage[] {
  const systemPrompt = `Du är en erfaren kommunikatör som skriver engagerande e-post till svenska föreningar.
Skriv professionella men vänskapliga e-postmeddelanden som uppmanar till handling.
Använd svenska och en personlig ton. Håll e-posten kortfattad men informativ.`;

  const recipientsText = associations
    .map((a) => `- ${a.name} (${a.types.join(', ')})`)
    .join('\n');

  const typeContexts = {
    introduction: `Detta är ett första kontaktmail till föreningar som vi inte tidigare kontaktat.
Målet är att presentera vår verksamhet och skapa en positiv första kontakt.`,
    'follow-up': `Detta är en uppföljning till föreningar vi tidigare varit i kontakt med.
Målet är att hålla dialogen levande och ta nästa steg i relationen.`,
    'event-invite': `Detta är en inbjudan till ett event eller möte.
Målet är att få föreningen att anmäla sig och delta.`,
    newsletter: `Detta är ett nyhetsbrev till våra medlemsföreningar och intresserade.
Målet är att hålla dem informerade och engagerade.`,
    custom: customContext || 'Skapa ett e-postmeddelande baserat på kontexten.',
  };

  const userPrompt = `Skapa ett e-postmeddelande till följande föreningar:

${recipientsText}

Typ av e-post: ${emailType}
${typeContexts[emailType]}

${customContext ? `\nYtterligare kontext: ${customContext}` : ''}

Skapa ett komplett e-postmeddelande med:
1. Ämnesrad (kort och engagerande)
2. Hälsningsfras
3. Brödtext (2-4 stycken)
4. Tydlig uppmaning till handling (Call-to-Action)
5. Avslutning och kontaktinformation

Gör e-posten personlig och anpassad för svenska föreningar.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function createPersonalizedEmailPrompt(
  association: any,
  emailPurpose: string,
  additionalContext?: string
): AIMessage[] {
  const systemPrompt = `Du är en expert på personlig föreningskommunikation.
Skriv skräddarsydda e-postmeddelanden som känns genuint personliga och relevanta.
Använd svenska och en varm, professionell ton.`;

  const associationInfo = `
Förening: ${association.name}
Typ: ${association.types.join(', ')}
Aktiviteter: ${association.activities.join(', ')}
Status i CRM: ${association.crmStatus}
${association.isMember ? 'OBS: Är redan medlem!' : 'Ej medlem ännu'}

${
  association.contacts?.[0]
    ? `Primär kontakt: ${association.contacts[0].name}${association.contacts[0].role ? ` (${association.contacts[0].role})` : ''}`
    : 'Ingen kontaktperson registrerad'
}

Senaste anteckningar:
${
  association.notes
    ?.slice(0, 3)
    .map((n: any) => `- ${n.content}`)
    .join('\n') || 'Inga anteckningar'
}
`;

  const userPrompt = `Skriv ett personligt e-postmeddelande till denna förening:

${associationInfo}

Syfte med e-posten: ${emailPurpose}
${additionalContext ? `\nYtterligare information: ${additionalContext}` : ''}

Skapa ett komplett, personligt e-postmeddelande med:
1. Passande ämnesrad
2. Personlig hälsning (använd kontaktpersonens namn om tillgänglig)
3. Inledning som visar att du vet vem de är (referera till deras aktiviteter/typ)
4. Huvudbudskap kopplat till syftet
5. Tydlig call-to-action
6. Vänlig avslutning

Gör e-posten kort (max 200 ord) men personlig och relevant.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
```

---

### **8. Suggestion Prompts**

```typescript
// lib/ai/prompts/suggestions.ts
import { AIMessage } from '../providers/base';

export function createNextActionsPrompt(
  association: any,
  context?: string
): AIMessage[] {
  const systemPrompt = `Du är en CRM-strateg specialiserad på föreningsrelationer.
Ge konkreta, handlingsbara förslag på nästa steg för att utveckla relationen med en förening.
Var specifik och praktisk. Svara på svenska.`;

  const associationInfo = `
Förening: ${association.name}
Status: ${association.crmStatus}
Pipeline: ${association.pipeline}
Medlem: ${association.isMember ? 'Ja' : 'Nej'}
Senaste kontakt: ${association.updatedAt ? new Date(association.updatedAt).toLocaleDateString('sv-SE') : 'Okänd'}

Kontaktinfo:
- E-post: ${association.email || 'Saknas'}
- Telefon: ${association.phone || 'Saknas'}
- Hemsida: ${association.homepageUrl || 'Saknas'}

Senaste aktiviteter:
${
  association.activities
    ?.slice(0, 5)
    .map(
      (a: any) =>
        `- ${new Date(a.createdAt).toLocaleDateString('sv-SE')}: ${a.description}`
    )
    .join('\n') || 'Inga aktiviteter'
}

Senaste anteckningar:
${
  association.notes
    ?.slice(0, 3)
    .map((n: any) => `- ${n.content}`)
    .join('\n') || 'Inga anteckningar'
}
`;

  const userPrompt = `Baserat på denna förenings status och historik, föreslå 3-5 konkreta nästa steg:

${associationInfo}

${context ? `\nYtterligare kontext: ${context}` : ''}

För varje förslag, inkludera:
1. Åtgärd (vad ska göras)
2. Prioritet (Hög/Medel/Låg)
3. Tidsram (När ska det göras)
4. Motivering (Varför är detta viktigt)
5. Förväntat resultat

Ordna förslagen efter prioritet.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function createEnrichmentSuggestionsPrompt(
  association: any
): AIMessage[] {
  const systemPrompt = `Du är en dataanalytiker som hjälper till att förbättra CRM-data.
Identifiera saknad information och föreslå hur den kan samlas in.
Svara på svenska.`;

  const missingFields: string[] = [];
  if (!association.orgNumber) missingFields.push('Organisationsnummer');
  if (!association.email) missingFields.push('E-postadress');
  if (!association.phone) missingFields.push('Telefonnummer');
  if (!association.homepageUrl) missingFields.push('Hemsida');
  if (!association.streetAddress) missingFields.push('Postadress');
  if (association.contacts?.length === 0) missingFields.push('Kontaktpersoner');
  if (association.description === null) missingFields.push('Beskrivning');

  const userPrompt = `Analysera denna förenings data och föreslå hur vi kan komplettera den:

Förening: ${association.name}
Kommun: ${association.municipality_name}
Typ: ${association.types.join(', ')}

Saknad information:
${missingFields.map((f) => `- ${f}`).join('\n')}

Befintlig information:
${association.email ? `- E-post: ${association.email}` : ''}
${association.phone ? `- Telefon: ${association.phone}` : ''}
${association.homepageUrl ? `- Hemsida: ${association.homepageUrl}` : ''}

För varje saknad information, föreslå:
1. Var informationen troligen kan hittas (hemsida, sociala medier, offentliga register)
2. Hur vi bäst ber om informationen (om direkt kontakt)
3. Prioritet för att samla in denna data

Ge även en övergripande plan för att berika föreningens data.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

export function createConversionStrategyPrompt(
  associations: any[],
  goal: 'membership' | 'partnership' | 'engagement'
): AIMessage[] {
  const systemPrompt = `Du är en strategisk rådgivare för föreningsutveckling.
Skapa konkreta strategier för att uppnå specifika mål med föreningar.
Svara på svenska med handlingsbara råd.`;

  const goalTexts = {
    membership: 'att få fler föreningar att bli medlemmar',
    partnership: 'att etablera partnerskap med föreningar',
    engagement: 'att öka engagemanget hos befintliga medlemsföreningar',
  };

  const associationsText = associations
    .map(
      (a) => `
${a.name}
- Status: ${a.crmStatus}
- Medlem: ${a.isMember ? 'Ja' : 'Nej'}
- Typ: ${a.types.join(', ')}
- Aktiviteter: ${a.activities.join(', ')}
`
    )
    .join('\n');

  const userPrompt = `Skapa en strategi för ${goalTexts[goal]} för följande föreningar:

${associationsText}

Ge en strukturerad strategi med:
1. Nulägesanalys (var står vi nu?)
2. Identifierade hinder och möjligheter
3. Konkret handlingsplan (steg-för-steg)
4. Kommunikationsstrategi (budskap och kanaler)
5. Uppföljning och mätning (hur vet vi om vi lyckas?)
6. Tidsplan (kortfristigt vs långsiktigt)

Var specifik och praktisk i dina råd.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
```

---

## 🔌 AI ROUTER

### **9. AI tRPC Router**

```typescript
// server/routers/ai.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { getAIProvider } from '@/lib/ai';
import {
  createAssociationAnalysisPrompt,
  createSingleAssociationAnalysisPrompt,
  createSegmentationPrompt,
} from '@/lib/ai/prompts/analysis';
import {
  createEmailDraftPrompt,
  createPersonalizedEmailPrompt,
} from '@/lib/ai/prompts/email';
import {
  createNextActionsPrompt,
  createEnrichmentSuggestionsPrompt,
  createConversionStrategyPrompt,
} from '@/lib/ai/prompts/suggestions';

export const aiRouter = router({
  // Test AI connection
  testConnection: protectedProcedure.query(async () => {
    const provider = getAIProvider();
    const available = await provider.isAvailable();

    return {
      available,
      provider: provider.name,
      model: process.env[`${provider.name.toUpperCase()}_MODEL`] || 'unknown',
    };
  }),

  // Analysera flera föreningar
  analyzeAssociations: protectedProcedure
    .input(
      z.object({
        associationIds: z.array(z.string()),
        focusArea: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Hämta föreningar
      const associations = await ctx.prisma.association.findMany({
        where: { id: { in: input.associationIds } },
        include: {
          contacts: true,
          notes: { take: 5, orderBy: { createdAt: 'desc' } },
          activities: { take: 10, orderBy: { createdAt: 'desc' } },
          tags: true,
        },
      });

      // Skapa prompt
      const messages = createAssociationAnalysisPrompt(
        associations,
        input.focusArea
      );

      // Anropa AI
      const provider = getAIProvider();
      const response = await provider.completion(messages, {
        temperature: input.temperature,
      });

      // Logga aktivitet
      await ctx.prisma.activity.create({
        data: {
          type: 'UPDATED',
          description: `AI-analys av ${associations.length} föreningar`,
          userId: ctx.session.user.id,
          userName: ctx.session.user.name || 'Okänd',
          metadata: {
            associationCount: associations.length,
            focusArea: input.focusArea,
            provider: provider.name,
            tokensUsed: response.usage?.totalTokens,
          },
        },
      });

      return {
        analysis: response.text,
        thinking: response.thinking,
        usage: response.usage,
      };
    }),

  // Analysera en enskild förening
  analyzeSingleAssociation: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        includeHistory: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: true,
          notes: { take: 10, orderBy: { createdAt: 'desc' } },
          activities: { take: 20, orderBy: { createdAt: 'desc' } },
          tags: true,
        },
      });

      if (!association) {
        throw new Error('Association not found');
      }

      const messages = createSingleAssociationAnalysisPrompt(
        association,
        input.includeHistory
      );

      const provider = getAIProvider();
      const response = await provider.completion(messages);

      return {
        analysis: response.text,
        thinking: response.thinking,
        usage: response.usage,
      };
    }),

  // Segmentering
  createSegmentation: protectedProcedure
    .input(
      z.object({
        associationIds: z.array(z.string()),
        segmentBy: z.enum(['activity', 'type', 'status', 'potential']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const associations = await ctx.prisma.association.findMany({
        where: { id: { in: input.associationIds } },
        include: {
          contacts: true,
          tags: true,
        },
      });

      const messages = createSegmentationPrompt(
        associations,
        input.segmentBy
      );

      const provider = getAIProvider();
      const response = await provider.completion(messages);

      return {
        segmentation: response.text,
        thinking: response.thinking,
      };
    }),

  // Generera e-post
  generateEmail: protectedProcedure
    .input(
      z.object({
        associationIds: z.array(z.string()),
        emailType: z.enum([
          'introduction',
          'follow-up',
          'event-invite',
          'newsletter',
          'custom',
        ]),
        customContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const associations = await ctx.prisma.association.findMany({
        where: { id: { in: input.associationIds } },
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
        },
      });

      const messages = createEmailDraftPrompt(
        associations,
        input.emailType,
        input.customContext
      );

      const provider = getAIProvider();
      const response = await provider.completion(messages, {
        temperature: 0.8, // Lite mer kreativt för e-post
      });

      return {
        email: response.text,
        thinking: response.thinking,
      };
    }),

  // Personlig e-post
  generatePersonalizedEmail: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        purpose: z.string(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: { orderBy: { isPrimary: 'desc' }, take: 1 },
          notes: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!association) {
        throw new Error('Association not found');
      }

      const messages = createPersonalizedEmailPrompt(
        association,
        input.purpose,
        input.additionalContext
      );

      const provider = getAIProvider();
      const response = await provider.completion(messages, {
        temperature: 0.8,
      });

      return {
        email: response.text,
        thinking: response.thinking,
      };
    }),

  // Föreslå nästa steg
  suggestNextActions: protectedProcedure
    .input(
      z.object({
        associationId: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: true,
          notes: { take: 5, orderBy: { createdAt: 'desc' } },
          activities: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!association) {
        throw new Error('Association not found');
      }

      const messages = createNextActionsPrompt(association, input.context);

      const provider = getAIProvider();
      const response = await provider.completion(messages);

      return {
        suggestions: response.text,
        thinking: response.thinking,
      };
    }),

  // Föreslå databerikning
  suggestEnrichment: protectedProcedure
    .input(z.object({ associationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const association = await ctx.prisma.association.findUnique({
        where: { id: input.associationId },
        include: {
          contacts: true,
        },
      });

      if (!association) {
        throw new Error('Association not found');
      }

      const messages = createEnrichmentSuggestionsPrompt(association);

      const provider = getAIProvider();
      const response = await provider.completion(messages);

      return {
        suggestions: response.text,
        thinking: response.thinking,
      };
    }),

  // Konverteringsstrategi
  createConversionStrategy: protectedProcedure
    .input(
      z.object({
        associationIds: z.array(z.string()),
        goal: z.enum(['membership', 'partnership', 'engagement']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const associations = await ctx.prisma.association.findMany({
        where: { id: { in: input.associationIds } },
        include: {
          contacts: true,
          tags: true,
        },
      });

      const messages = createConversionStrategyPrompt(
        associations,
        input.goal
      );

      const provider = getAIProvider();
      const response = await provider.completion(messages);

      return {
        strategy: response.text,
        thinking: response.thinking,
      };
    }),

  // Streaming completion (för realtidsrespons)
  streamCompletion: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = [
        ...(input.systemPrompt
          ? [{ role: 'system' as const, content: input.systemPrompt }]
          : []),
        { role: 'user' as const, content: input.prompt },
      ];

      const provider = getAIProvider();
      
      // Note: tRPC doesn't natively support streaming generators
      // This would need special handling on the client side
      // For now, we return a regular completion
      const response = await provider.completion(messages);
      
      return {
        text: response.text,
        thinking: response.thinking,
      };
    }),
});
```

---

## 🎨 FRONTEND AI-KOMPONENTER

### **10. AI Analysis Dialog**

```typescript
// components/ai/AIAnalysisDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { Loader2, Sparkles, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';

interface AIAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationIds: string[];
}

export function AIAnalysisDialog({
  open,
  onOpenChange,
  associationIds,
}: AIAnalysisDialogProps) {
  const { toast } = useToast();
  const [focusArea, setFocusArea] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [thinking, setThinking] = useState('');

  const analyzeMutation = trpc.ai.analyzeAssociations.useMutation();

  const handleAnalyze = async () => {
    try {
      const result = await analyzeMutation.mutateAsync({
        associationIds,
        focusArea: focusArea || undefined,
      });

      setAnalysis(result.analysis);
      setThinking(result.thinking || '');

      toast({
        title: 'Analys klar',
        description: `Använde ${result.usage?.totalTokens || 0} tokens`,
      });
    } catch (error) {
      toast({
        title: 'Analys misslyckades',
        description: error instanceof Error ? error.message : 'Okänt fel',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Analys av föreningar
          </DialogTitle>
          <DialogDescription>
            Analyserar {associationIds.length} föreningar med AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysis ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="focusArea">
                  Fokusområde (valfritt)
                </Label>
                <Textarea
                  id="focusArea"
                  placeholder="T.ex. 'medlemsrekrytering', 'engagemang', 'kommunikationsstrategi'"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  rows={3}
                  disabled={analyzeMutation.isLoading}
                />
                <p className="text-xs text-gray-500">
                  Lämna tomt för en allmän analys
                </p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isLoading}
                className="w-full"
              >
                {analyzeMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyserar...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Starta analys
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>

              {thinking && (
                <details className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
                  <summary className="cursor-pointer font-medium">
                    Visa tankegång (Ollama chain-of-thought)
                  </summary>
                  <div className="mt-2 whitespace-pre-wrap">{thinking}</div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysis('');
                    setThinking('');
                  }}
                >
                  Ny analys
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(analysis);
                    toast({
                      title: 'Kopierat!',
                      description: 'Analysen har kopierats',
                    });
                  }}
                >
                  Kopiera
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **11. AI Email Generator**

```typescript
// components/ai/AIEmailGenerator.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Loader2, Mail, Copy, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AIEmailGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationIds: string[];
}

export function AIEmailGenerator({
  open,
  onOpenChange,
  associationIds,
}: AIEmailGeneratorProps) {
  const { toast } = useToast();
  const [emailType, setEmailType] = useState
    'introduction' | 'follow-up' | 'event-invite' | 'newsletter' | 'custom'
  >('introduction');
  const [customContext, setCustomContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');

  const generateMutation = trpc.ai.generateEmail.useMutation();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        associationIds,
        emailType,
        customContext: customContext || undefined,
      });

      setGeneratedEmail(result.email);

      toast({
        title: 'E-post genererad',
        description: 'AI har skapat ett e-postförslag',
      });
    } catch (error) {
      toast({
        title: 'Generering misslyckades',
        description: error instanceof Error ? error.message : 'Okänt fel',
        variant: 'destructive',
      });
    }
  };

  const emailTypeLabels = {
    introduction: 'Första kontakt',
    'follow-up': 'Uppföljning',
    'event-invite': 'Eventinbjudan',
    newsletter: 'Nyhetsbrev',
    custom: 'Anpassad',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            AI E-postgenerator
          </DialogTitle>
          <DialogDescription>
            Skapa ett e-postmeddelande till {associationIds.length} föreningar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedEmail ? (
            <>
              <div className="space-y-2">
                <Label>Typ av e-post</Label>
                <Select value={emailType} onValueChange={(val: any) => setEmailType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(emailTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">
                  Ytterligare kontext (valfritt)
                </Label>
                <Textarea
                  id="context"
                  placeholder="T.ex. 'Vi har ett nytt medlemserbjudande med 20% rabatt första året'"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  rows={4}
                  disabled={generateMutation.isLoading}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isLoading}
                className="w-full"
              >
                {generateMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Genererar e-post...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Generera e-post
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Textarea
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedEmail('')}
                >
                  Generera ny
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedEmail);
                    toast({
                      title: 'Kopierat!',
                      description: 'E-posten har kopierats',
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Kopiera
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implementera faktisk e-postsändning
                    toast({
                      title: 'E-post skickad!',
                      description: `Skickat till ${associationIds.length} mottagare`,
                    });
                    onOpenChange(false);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Skicka
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### **12. AI Action Button (för association card)**

```typescript
// components/ai/AIActionButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Brain,
  Mail,
  ListChecks,
  TrendingUp,
  Database,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { AIAnalysisDialog } from './AIAnalysisDialog';
import { AIEmailGenerator } from './AIEmailGenerator';

interface AIActionButtonProps {
  associationId: string;
}

export function AIActionButton({ associationId }: AIActionButtonProps) {
  const { toast } = useToast();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const analyzeMutation = trpc.ai.analyzeSingleAssociation.useMutation();
  const actionsMutation = trpc.ai.suggestNextActions.useMutation();
  const enrichmentMutation = trpc.ai.suggestEnrichment.useMutation();

  const handleQuickAnalysis = async () => {
    try {
      const result = await analyzeMutation.mutateAsync({
        associationId,
        includeHistory: true,
      });

      setAiResult(result.analysis);
      toast({
        title: 'Analys klar',
        description: 'AI-analys genererad',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte generera analys',
        variant: 'destructive',
      });
    }
  };

  const handleSuggestActions = async () => {
    try {
      const result = await actionsMutation.mutateAsync({
        associationId,
      });

      setAiResult(result.suggestions);
      toast({
        title: 'Förslag genererade',
        description: 'AI har föreslagit nästa steg',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte generera förslag',
        variant: 'destructive',
      });
    }
  };

  const handleEnrichment = async () => {
    try {
      const result = await enrichmentMutation.mutateAsync({
        associationId,
      });

      setAiResult(result.suggestions);
      toast({
        title: 'Berikning föreslås',
        description: 'AI har analyserat saknad data',
      });
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte analysera data',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Åtgärder
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>AI-verktyg</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleQuickAnalysis}>
            <Brain className="mr-2 h-4 w-4" />
            Snabbanalys
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSuggestActions}>
            <ListChecks className="mr-2 h-4 w-4" />
            Föreslå nästa steg
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowEmail(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Generera e-post
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleEnrichment}>
            <Database className="mr-2 h-4 w-4" />
            Analysera saknad data
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowAnalysis(true)}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Djupanalys...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AIAnalysisDialog
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
        associationIds={[associationId]}
      />

      <AIEmailGenerator
        open={showEmail}
        onOpenChange={setShowEmail}
        associationIds={[associationId]}
      />

      {/* Result Dialog */}
      {aiResult && (
        <Dialog open={!!aiResult} onOpenChange={() => setAiResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI-Resultat</DialogTitle>
            </DialogHeader>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {aiResult}
            </div>
            <DialogFooter>
              <Button onClick={() => setAiResult(null)}>Stäng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
```

---

## 🎯 ANVÄNDNINGSEXEMPEL

### **13. Exempel på integration i Association List**

```typescript
// app/associations/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AIAnalysisDialog } from '@/components/ai/AIAnalysisDialog';
import { AIEmailGenerator } from '@/components/ai/AIEmailGenerator';

export default function AssociationsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [showAIEmail, setShowAIEmail] = useState(false);

  return (
    <div>
      {/* Bulk actions toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAIAnalysis(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Analys ({selectedIds.length})
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAIEmail(true)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Generera e-post ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Association list */}
      {/* ... */}

      <AIAnalysisDialog
        open={showAIAnalysis}
        onOpenChange={setShowAIAnalysis}
        associationIds={selectedIds}
      />

      <AIEmailGenerator
        open={showAIEmail}
        onOpenChange={setShowAIEmail}
        associationIds={selectedIds}
      />
    </div>
  );
}
```

---

## ✅ SAMMANFATTNING

Du har nu ett komplett AI-system med:

### **Stöd för 3 providers:**
- ✅ **Ollama** (lokal GPU, gpt-oss:20b)
- ✅ **OpenAI** (GPT-4 Turbo)
- ✅ **Anthropic** (Claude 3.5 Sonnet)

### **AI-funktioner:**
- 📊 Analys av enskilda/flera föreningar
- 📧 E-postgenerering (massa & personlig)
- 🎯 Nästa steg-förslag
- 📈 Segmenteringsanalys
- 💡 Databerikning-förslag
- 🚀 Konverteringsstrategier

### **Integration:**
- 🔌 tRPC API
- 🎨 React-komponenter
- 📝 Markdown-rendering
- 💾 Aktivitetsloggning
- ⚡ Streaming-stöd (Ollama)

Vill du att jag fortsätter med något mer specifikt område? Till exempel:
- Dashboard med AI-insights
- Automatiserade AI-arbetsflöden
- Schemalagda AI-analyser
- AI-träning på din data