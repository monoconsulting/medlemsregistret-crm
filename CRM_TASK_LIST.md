# CRM_IMPLEMENTATION_TASKLIST.md
**Purpose:** En enda, sammanhängande **task-lista** med **kryssrutor** och **kontrollpunkter** för en agent att följa när CRM-systemet implementeras – sammanfogad från **CRM_IMPLEMENTATION_1..4.md**. Varje sektion innehåller **DoD (Definition of Done)**, **Verifiering**, och **Fallback/Åtgärd**. Hänvisningar till originaldokumenten finns löpande.

---

## 0. Förberedelser & Ramverk  _(arkitektur, dev-miljö)_
[Ref: Teknisk Stack & Sidstruktur i **CRM_IMPLEMENTATION_1.md**] :contentReference[oaicite:0]{index=0}

- [ ] **Fastställ tech-stack** enligt specifikation (Next.js 15, TypeScript, shadcn/ui, Tailwind, TanStack Query, Zustand, React Hook Form + Zod; backend: Next.js API + tRPC + Prisma + MySQL; Redis cache; BullMQ för bakgrundsjobb). :contentReference[oaicite:1]{index=1}
- [ ] **Initiera repo** (monorepo eller app), skapa baseline för `apps/web` och `packages/*` vid behov.
- [ ] **Skapa .env* filer** för lokalt/labb/prod (hemligheter separerade, inga hårdkodade nycklar).
- [ ] **Sätt upp lint/test** (ESLint, Prettier, Vitest/Jest; Playwright e2e).
- [ ] **CI/CD**: pipeline som kör bygg, test, prisma migrate, lint.

**DoD:** Alla verktyg installerade, `pnpm dev` kör appen, CI kör grönt.
**Verifiering:** `pnpm -w build && pnpm -w test` utan fel.
**Fallback/Åtgärd:** Lås versioner i `package.json` och generera lockfile igen.

---

## 1. Datamodell & Prisma Migrations
[Ref: Databasschema i **CRM_IMPLEMENTATION_1.md**] :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}

- [ ] **Skapa Prisma-modell för**: `Association`, `Contact`, `Note`, `Tag`, `Group`, `GroupMembership`, `Activity`, `ScrapeRun` inkl. index, enum: `CrmStatus`, `Pipeline`, `ActivityType`. :contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}
- [ ] **Relationer & onDelete**: Säkerställ `@relation(..., onDelete: Cascade)` där angivet. :contentReference[oaicite:6]{index=6}
- [ ] **Fulltext/Index**: `@@fulltext([name, city])`, kombinerade index för filter/pag. :contentReference[oaicite:7]{index=7}
- [ ] **Kör migrationer** och generera Prisma client.

**DoD:** `prisma migrate dev` skapar tabeller; `prisma studio` visar relationer.
**Verifiering:** `pnpm prisma generate && pnpm prisma migrate dev`.
**Fallback/Åtgärd:** Vid schemafel – bryt migrationskedja i utveckling, regenerera.

---

## 2. Frontend Sidstruktur (UI Skelett)
[Ref: Dashboard, Kommunöversikt, Föreningslista m.m. i **CRM_IMPLEMENTATION_1.md**] :contentReference[oaicite:8]{index=8}

- [ ] **Dashboard**: KPI-kort, aktivitetsflöde, uppgifter, medlemsutveckling (komponenter: `KPICard`, `ActivityTimeline`, `TaskList`, `MembershipChart`). :contentReference[oaicite:9]{index=9}
- [ ] **Kommunöversikt**: `SwedenMap` + lista, sortering och navigation. :contentReference[oaicite:10]{index=10}
- [ ] **Föreningslista**: Sökfält, filterpanel (kommun, typer, aktiviteter, CRM-status, taggar, riksorg, kontaktinfo), vyväxling (tabell/kort/karta). :contentReference[oaicite:11]{index=11}

**DoD:** Vyer renderar med mock-data; filter ändrar listan; routing OK.
**Verifiering:** Manuell klickrunda; Playwright smoke: öppna/filtrera/byt vy.
**Fallback/Åtgärd:** Temporär mock via TanStack Query `initialData`.

---

## 3. Modaler & Dialoger (Avancerade Funktioner)
[Ref: Modaler i **CRM_IMPLEMENTATION_2.md**] :contentReference[oaicite:12]{index=12}

- [ ] **Redigera Förening (Modal)**: Tabs `basic/contact/activities/crm`; required validering (`name`, `municipality`, `types`) med React Hook Form + Zod; `extras`-fält. :contentReference[oaicite:13]{index=13}
- [ ] **Lägg till Kontakt (Modal)**: Roller, sociala medier, `isPrimary` med autounik primär. :contentReference[oaicite:14]{index=14}
- [ ] **Skicka Mail (Modal + AI-draft)**: AI-utkastpanel, RTE-editor, `recipients` härledning. :contentReference[oaicite:15]{index=15}

**DoD:** Alla tre modaler öppnar/stänger, validering fungerar, submit triggar mutation.
**Verifiering:** Formfel visas korrekt; `isPrimary` flyttar primärflagga.
**Fallback/Åtgärd:** Disable submit när `isSubmitting`; toast på fel.

---

## 4. tRPC Bas & Context
[Ref: tRPC setup i **CRM_IMPLEMENTATION_3.md**] :contentReference[oaicite:16]{index=16}:contentReference[oaicite:17]{index=17}

- [ ] **Init tRPC** med `superjson`, `errorFormatter` inkl. `ZodError`. :contentReference[oaicite:18]{index=18}
- [ ] **Context**: `getServerSession`, `prisma` i ctx. :contentReference[oaicite:19]{index=19}
- [ ] **Middleware**: `isAuthed`, `isAdmin`. :contentReference[oaicite:20]{index=20}
- [ ] **AppRouter + /api/trpc**‐handler. :contentReference[oaicite:21]{index=21}

**DoD:** `GET/POST /api/trpc` svarar; skyddade procedurer stoppar anonyma.
**Verifiering:** Minimal client-call (health ping) + 401/403-test.
**Fallback/Åtgärd:** Logga `TRPCError` orsak i serverkonsol.

---

## 5. Association Router (CRUD, filter, stats)
[Ref: Association Router i **CRM_IMPLEMENTATION_3.md**] :contentReference[oaicite:22]{index=22}:contentReference[oaicite:23]{index=23}

- [ ] **List**: Zod-schema med `search`, `municipalities`, `types`, `activities`, `crmStatus`, `pipeline`, `tags`, `hasEmail/hasPhone`, `isMember`, `assignedTo`, `dateRange`, `sortBy`, `page/limit`; Prisma `where` + `orderBy`; returnera `pagination`. :contentReference[oaicite:24]{index=24}
- [ ] **getById**: Inkludera `contacts`, `notes` (limit), `tags`, `groupMemberships`, `activities`. :contentReference[oaicite:25]{index=25}
- [ ] **create/update/bulkUpdate/delete** med aktivitetloggar och tagghantering. :contentReference[oaicite:26]{index=26}:contentReference[oaicite:27]{index=27}
- [ ] **stats**: totals, medlemmar, contacted/uncontacted, groupBy municipality/types, recent activities. :contentReference[oaicite:28]{index=28}

**DoD:** Alla endpoints svarar korrekt och returntyper matchar klienten.
**Verifiering:** tRPC integration-tester med seedad data.
**Fallback/Åtgärd:** Vid långsamma queries: lägg saknade index (se §1).

---

## 6. Contacts/Notes/Tags/Groups Routers
[Ref: Routers i **CRM_IMPLEMENTATION_3.md**] :contentReference[oaicite:29]{index=29}:contentReference[oaicite:30]{index=30}

- [ ] **Contacts**: `list/create/update/delete`; `isPrimary` reset på övriga kontakter. :contentReference[oaicite:31]{index=31}
- [ ] **Notes**: skapa/uppdatera/radera, med **ägarkontroll** (endast författare får ändra/ta bort). :contentReference[oaicite:32]{index=32}:contentReference[oaicite:33]{index=33}
- [ ] **Tags/Groups**: CRUD och `GroupMembership` unikhetskrav. :contentReference[oaicite:34]{index=34}

**DoD:** Alla CRUD med validering; aktivitetslogg vid ändringar.
**Verifiering:** Testa authorisation-paths (tillåten/otillåten).
**Fallback/Åtgärd:** Returnera `TRPCError` (`FORBIDDEN`/`NOT_FOUND`) enligt mallen.

---

## 7. Autentisering & RBAC
[Ref: NextAuth, middleware, RoleGuard i **CRM_IMPLEMENTATION_3.md**] :contentReference[oaicite:35]{index=35}:contentReference[oaicite:36]{index=36}

- [ ] **NextAuth**: Google + Credentials, JWT-session, adapter Prisma; `events.signIn` logg. :contentReference[oaicite:37]{index=37}
- [ ] **Middleware**: protect routes `/dashboard`, `/associations`, `/contacts`, `/groups`, `/stats`, `/admin`. :contentReference[oaicite:38]{index=38}
- [ ] **RoleGuard** komponent för klienten. :contentReference[oaicite:39]{index=39}

**DoD:** Inloggning fungerar, rollskydd nekar otillåtna användare.
**Verifiering:** Manuell inloggning + e2e (skyddade sidor redirectas).
**Fallback/Åtgärd:** Visa “Unauthorized” vy istället för blank sida.

---

## 8. Exportfunktionalitet
[Ref: Export Router i **CRM_IMPLEMENTATION_3.md**] :contentReference[oaicite:40]{index=40}

- [ ] **Excel-export**: `associations`, optioner för `includeContacts/Notes/Activities/Tags`. :contentReference[oaicite:41]{index=41}
- [ ] **CSV-export**: `json2csv` pipeline. :contentReference[oaicite:42]{index=42}
- [ ] **Filters/ids**: stöd för explicit ID-lista eller filterobjekt. :contentReference[oaicite:43]{index=43}

**DoD:** Nerladdad fil öppnas i Excel; kolumner korrekta.
**Verifiering:** Provexport med 5 st poster; datatyper OK.
**Fallback/Åtgärd:** Sätt rimliga kolumnbredd & datumformat.

```markdown
# CRM Implementation — Unified Task List (Continuation from **9**)

> Denna lista fortsätter från punkt **9** och samlar resterande uppgifter från originaldokumenten **CRM_IMPLEMENTATION_1.md**, **CRM_IMPLEMENTATION_2.md**, **CRM_IMPLEMENTATION_3.md** och **CRM_IMPLEMENTATION_4.md**. Varje del hänvisar löpande till källan.

---

## 9) Protected Route Middleware & RBAC (NextAuth + Middleware)
Källa: *CRM_IMPLEMENTATION_3.md* — “9. Protected Route Middleware”, “10. Role-Based Access Control Component” :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1}

- [ ] **Lägg in middleware.ts** med `withAuth` och matchers för skyddade rutter (`/dashboard`, `/associations`, `/contacts`, `/groups`, `/stats`, `/admin`).  
      **Kontroll:** Navigera till en skyddad URL som oinloggad → förväntad redirect till `/unauthorized`. :contentReference[oaicite:2]{index=2}
- [ ] **Konfigurera rollvillkor i middleware**: blockera `/admin` om `token.role !== 'ADMIN'`, och blockera `/stats` om roll inte är `ADMIN|MANAGER`.  
      **Kontroll:** Testa båda fallen med olika roller och verifiera redirect. :contentReference[oaicite:3]{index=3}
- [ ] **Inför `RoleGuard`-komponent** i frontend för komponent-nivå-skydd.  
      **Kontroll:** Wrappa en adminpanel med `<RoleGuard allowedRoles={['ADMIN','MANAGER']}>…</RoleGuard>` och säkerställ att en användare utan roll ser `fallback`. :contentReference[oaicite:4]{index=4}

---

## 10) tRPC Bas & Context + Association Router (API)
Källa: *CRM_IMPLEMENTATION_3.md* — “1. tRPC Router Setup”, “2. Association Router” :contentReference[oaicite:5]{index=5} :contentReference[oaicite:6]{index=6}

- [ ] **Initiera tRPC med `superjson` och skräddarsydd `errorFormatter`.**  
      **Kontroll:** Producera ett avsiktligt Zod-fel och verifiera att `zodError` returneras i `data`. :contentReference[oaicite:7]{index=7}
- [ ] **Skapa `Context`** (NextAuth `getServerSession`, Prisma-klient, req/res).  
      **Kontroll:** Logga `ctx.session?.user` i en testprocedur och verifiera att den finns efter inloggning. :contentReference[oaicite:8]{index=8}
- [ ] **Middleware för auth/roll:** `isAuthed`, `isAdmin` och export av `publicProcedure`, `protectedProcedure`, `adminProcedure`.  
      **Kontroll:** Kör en admin-endpoint som vanlig användare → `FORBIDDEN`. :contentReference[oaicite:9]{index=9}
- [ ] **Association Router:** Filtrering (search, municipality, types, activities, crmStatus, pipeline, tags, datum, hasEmail/Phone, isMember, assignedTo), sortering, pagination, `_count`.  
      **Kontroll:** Sätt filter + sort i klienten och kontrollera att total/totalPages stämmer mot databasen. :contentReference[oaicite:10]{index=10}
- [ ] **CRUD & Bulk:** `create`, `update` (med change-logik för status/pipeline), `bulkUpdate`, `getById` med inkluderade relationer (contacts (primär först), notes (senaste 50), tags, groupMemberships, activities).  
      **Kontroll:** Uppdatera pipeline och verifiera att aktivitetslogg skapas med rätt beskrivning. :contentReference[oaicite:11]{index=11} :contentReference[oaicite:12]{index=12}

---

## 11) Contacts Router (API)
Källa: *CRM_IMPLEMENTATION_3.md* — Contacts-CRUD med “isPrimary”-hantering :contentReference[oaicite:13]{index=13}

- [ ] **Update:** Om `isPrimary: true`, nollställ `isPrimary` på övriga kontakter i samma förening.  
      **Kontroll:** Sätt ny primär och kontrollera att tidigare primär avmarkeras. :contentReference[oaicite:14]{index=14}
- [ ] **Delete:** Ta bort kontakt och logga aktivitet med `description: Kontakt borttagen: {name}`.  
      **Kontroll:** Verifiera att aktivitetslogg skapats och att kontakten ej längre returneras av `getById`. :contentReference[oaicite:15]{index=15}

---

## 12) Notes Router (API)
Källa: *CRM_IMPLEMENTATION_3.md* — Notes list/create/update/delete inklusive ägarskap/kontroller och aktivitetslogg :contentReference[oaicite:16]{index=16} :contentReference[oaicite:17]{index=17}

- [ ] **List:** Paginera (default 50) nyaste först.  
      **Kontroll:** Skapa >50 anteckningar och kontrollera begränsning/ordning. :contentReference[oaicite:18]{index=18}
- [ ] **Create:** Spara `authorId/authorName` och logga `NOTE_ADDED` med `metadata.noteId`.  
      **Kontroll:** Verifiera att `activity`-posten skapas och innehåller rätt `associationId`. :contentReference[oaicite:19]{index=19}
- [ ] **Update:** Tillåt endast ägare att uppdatera, annars `FORBIDDEN`.  
      **Kontroll:** Försök uppdatera någon annans anteckning → förväntat fel. :contentReference[oaicite:20]{index=20}
- [ ] **Delete:** Hämta anteckning och radera.  
      **Kontroll:** Försök radera en icke-existerande anteckning → `NOT_FOUND`. :contentReference[oaicite:21]{index=21}

---

## 13) Export Router (Excel/CSV/JSON) + Export Dialog (Frontend)
Källa: *CRM_IMPLEMENTATION_3.md* — “Export Router”, ExcelJS/CSV/JSON, ExportDialog-komponent (formatval, options, nedladdning) :contentReference[oaicite:22]{index=22} :contentReference[oaicite:23]{index=23} :contentReference[oaicite:24]{index=24} :contentReference[oaicite:25]{index=25}

- [ ] **Excel-export:** skapa `Workbook`, “Föreningar” + (valfritt) “Kontakter”, “Anteckningar”, “Aktiviteter”; formatera header-rad (fill/font), generera `base64`, logga aktivitet.  
      **Kontroll:** Öppna filen i Excel och verifiera kolumnrubriker/blad och svenska tecken. :contentReference[oaicite:26]{index=26}
- [ ] **CSV-export:** Flatta fält (inkl. primär kontakt) och generera med `json2csv` (`withBOM: true`), logga aktivitet.  
      **Kontroll:** Öppna i Excel → kontrollera att delimiter “;” och ÅÄÖ visas korrekt. :contentReference[oaicite:27]{index=27}
- [ ] **JSON-export:** Hämta med `include: {contacts,tags,notes}` och returnera pretty JSON vid behov, logga aktivitet.  
      **Kontroll:** Validera JSON-schema i klient. :contentReference[oaicite:28]{index=28}
- [ ] **Frontend ExportDialog:** välj format (Excel/CSV/JSON) + options (`includeContacts`, `includeNotes`, `includeActivities`), anropa rätt tRPC-mutation, skapa blob och ladda ned, visa toast.  
      **Kontroll:** Testa alla tre format; visa “Export slutförd … {count}” och stäng dialogen. :contentReference[oaicite:29]{index=29} :contentReference[oaicite:30]{index=30}

---

## 14) AI Provider Layer & Prompts (Analysis, Email, Suggestions)
Källa: *CRM_IMPLEMENTATION_4.md* — AI-prompter för analys, e-post, segmentering, nästa steg, enrichment, conversion strategy; AI-router; UI-komponenter/Dialogs; integrations-exempel :contentReference[oaicite:31]{index=31} :contentReference[oaicite:32]{index=32} :contentReference[oaicite:33]{index=33} :contentReference[oaicite:34]{index=34}

- [ ] **Providers:** Stöd för **Ollama** (lokal, streaming), **OpenAI**, **Anthropic**; läs modell från ENV.  
      **Kontroll:** Kör `ai.testConnection` och verifiera `{available, provider, model}` i svar. :contentReference[oaicite:35]{index=35}
- [ ] **Prompts – Analys/Segmentering:** Implementera `createAssociationAnalysisPrompt`, `createSingleAssociationAnalysisPrompt`, `createSegmentationPrompt`.  
      **Kontroll:** Kör multi-analys och validera att senaste `notes/activities` inkluderas och att svaret loggas som aktivitet. :contentReference[oaicite:36]{index=36}
- [ ] **Prompts – E-post:** `createEmailDraftPrompt`, `createPersonalizedEmailPrompt` (svenska, handlingsbar ton).  
      **Kontroll:** Generera utkast för flera föreningar; kontrollera att ton och placeholders är korrekta. :contentReference[oaicite:37]{index=37}
- [ ] **Prompts – Suggestions:** `createNextActionsPrompt`, `createEnrichmentSuggestionsPrompt` (prioriterad datainsamling), `createConversionStrategyPrompt` (mål: membership/partnership/engagement).  
      **Kontroll:** Validera att texten följer strukturen 1–6 (nuläge → tidsplan) och är på svenska. :contentReference[oaicite:38]{index=38}
- [ ] **AI Router (`server/routers/ai.ts`):** `testConnection`, `analyzeAssociations`, (m.fl.) inkl. loggning (`metadata.tokensUsed`, provider).  
      **Kontroll:** Spåra aktivitetsposter vid analys/generering och att `associationIds.length` loggas. :contentReference[oaicite:39]{index=39}

---

## 15) AI UI-Komponenter & Integration i Listor
Källa: *CRM_IMPLEMENTATION_4.md* — `AIAnalysisDialog`, `AIEmailGenerator`, toolbar-actions och exempel i `app/associations/page.tsx` :contentReference[oaicite:40]{index=40} :contentReference[oaicite:41]{index=41}

- [ ] **Dialoger:** Implementera `AIAnalysisDialog` och `AIEmailGenerator` med öppna/stäng-state.  
      **Kontroll:** Öppna/stäng dialog via toolbar; stream/render av resultat eller “Stäng”-knapp funkar. :contentReference[oaicite:42]{index=42}
- [ ] **Bulk Actions:** Visa toolbar när `selectedIds.length > 0`; knappar för “AI-Analys” och “Generera e-post”.  
      **Kontroll:** Markera rader, öppna respektive dialog och bekräfta att `associationIds` skickas in. :contentReference[oaicite:43]{index=43}
- [ ] **Resultatvisning:** Markdown-rendering av AI-svar i dialog, `whitespace-pre-wrap`.  
      **Kontroll:** Klistra in punktlistor/kodblock och kontrollera korrekt rendering. :contentReference[oaicite:44]{index=44}

---

## 16) Dashboard/Lists — Statistik, Aktiviteter, Uppgifter (UI)
Källa: *CRM_IMPLEMENTATION_1.md* — Dashboardkort (Aktivitetsflöde m. realtime, Kommande uppgifter, Medlemsutveckling, Snabbstatistik, Sparade grupperingar, AI-Assistent) :contentReference[oaicite:45]{index=45}

- [ ] **Aktivitetsflöde:** `<ActivityTimeline realtime>` med filtertabs.  
      **Kontroll:** Skapa en aktivitet via API och bekräfta live-uppdatering utan reload. :contentReference[oaicite:46]{index=46}
- [ ] **Kommande uppgifter:** Rendera `<TaskList tasks={upcomingTasks}>`.  
      **Kontroll:** Lägg till ny uppgift i DB och verifiera att den visas. :contentReference[oaicite:47]{index=47}
- [ ] **Medlemsutveckling:** Visa `<MembershipChart data={…}>`.  
      **Kontroll:** Ändra data och säkerställ korrekt graflayout. :contentReference[oaicite:48]{index=48}
- [ ] **Snabbstatistik/Sparade grupperingar/AI-Assistent**: korten visas i sidokolumn; AI-QuickActions anropas.  
      **Kontroll:** Klicka på “AI-QuickActions” och verifiera att knappar triggar rätt call. :contentReference[oaicite:49]{index=49}

---

## 17) Designsystem & Statusfärger (UI)
Källa: *CRM_IMPLEMENTATION_1.md* — färgpalett + `statusColors` för CRM-statusar :contentReference[oaicite:50]{index=50}

- [ ] **Konfigurera färgpalett** (primary/success/warning/danger) och mappa CRM-statusar till färger (`statusColors`).  
      **Kontroll:** Rendera etiketter för alla statusar och säkerställ färgkontrast/AA-krav. :contentReference[oaicite:51]{index=51}

---

## 18) Avancerad Dashboard & AI Insights (UI)
Källa: *CRM_IMPLEMENTATION_2.md* — Medlems- och intäktsgrafer, DataTable “Medlemsföreningar – Detaljerad översikt”, AI-Insights/QuickActions-komponenter :contentReference[oaicite:52]{index=52} :contentReference[oaicite:53]{index=53}

- [ ] **Linje/Bar-grafer:** Rendera MRR/ARR-linjer (Recharts) med legend/tooltip.  
      **Kontroll:** Verifiera axlar och att dataserier uppdateras vid filter. :contentReference[oaicite:54]{index=54}
- [ ] **Detaljerad DataTable:** aktivera `searchable`, `exportable`, `pagination`.  
      **Kontroll:** Sök efter förening, exportera filtrerad vy till Excel via ExportDialog. :contentReference[oaicite:55]{index=55}
- [ ] **AIQuickActions/AIInsights**: knappar för kontaktstrategi/analys/e-post/similar; AI-Insights cachas 30 min (`staleTime`).  
      **Kontroll:** Visa “AI analyserar…”‐loader vid laddning och cachehit vid upprepning. :contentReference[oaicite:56]{index=56}

---

## 19) AI Sammanfattning & Stödda Leverantörer (Dokumentation/Verifikation)
Källa: *CRM_IMPLEMENTATION_4.md* — “✅ Sammanfattning” (providers, funktioner, integration) :contentReference[oaicite:57]{index=57}

- [ ] **Verifiera providers:** Ollama/OpenAI/Anthropic fungerar och är valbara via ENV.  
      **Kontroll:** Kör tre provkörningar (en per provider) av samma prompt och jämför svarstid/kostnad. :contentReference[oaicite:58]{index=58}
- [ ] **Verifiera funktioner:** Analys, e-post, next steps, segmentering, enrichment, conversion.  
      **Kontroll:** Skapa checklista i README med länk till respektive tRPC-mutation och UI-entrypoint. :contentReference[oaicite:59]{index=59}
- [ ] **Verifiera integrationer:** tRPC, React-komponenter, Markdown-rendering, aktivitetsloggning, streaming.  
      **Kontroll:** Logga tokenförbrukning (om tillgängligt) i `metadata`. :contentReference[oaicite:60]{index=60}

---

## 20) Kvalitetskontroller & E2E
- [ ] **Autorisering:** Simulera roller (ADMIN, MANAGER, USER) och bekräfta rutt/komponentskydd.  
      **Kontroll:** Cypress: gå till `/admin` som USER → blockeras. (Relaterar till pkt 9) :contentReference[oaicite:61]{index=61}
- [ ] **Exportvägar:** Testa Excel/CSV/JSON med och utan `associationIds`, med `filters`.  
      **Kontroll:** Excel innehåller rätt blad; CSV öppnas korrekt i svensk Excel; JSON valideras. (Relaterar till pkt 13) :contentReference[oaicite:62]{index=62}
- [ ] **AI-flöden:** Kör `testConnection`, `analyzeAssociations`, e-postgeneration och conversion-strategi.  
      **Kontroll:** Aktivitetsloggar skapas med rätt metadata (provider, tokens). (Relaterar till pkt 14) :contentReference[oaicite:63]{index=63}
- [ ] **UI-insikter:** DataTable-sökning, grafer, dialogs och bulk-actions fungerar.  
      **Kontroll:** Markera N rader → visa toolbar → öppna AI-dialoger. (Relaterar till pkt 15–18) :contentReference[oaicite:64]{index=64} :contentReference[oaicite:65]{index=65}

---

## 21) Dokumentation & “Hänvisa till original”
- [ ] **README – Arkitekturöversikt:** Lägg in länkar till källdelar:  
  - Auth/RBAC: *CRM_IMPLEMENTATION_3.md* §9–10 :contentReference[oaicite:66]{index=66}  
  - API (tRPC/Association/Contacts/Notes/Export): *CRM_IMPLEMENTATION_3.md* §1–4 + Export :contentReference[oaicite:67]{index=67} :contentReference[oaicite:68]{index=68} :contentReference[oaicite:69]{index=69} :contentReference[oaicite:70]{index=70} :contentReference[oaicite:71]{index=71}  
  - AI (Prompts/Router/UI): *CRM_IMPLEMENTATION_4.md* §9–13 + Sammanfattning :contentReference[oaicite:72]{index=72} :contentReference[oaicite:73]{index=73}  
  - UI/Dashboard/Designsystem: *CRM_IMPLEMENTATION_1.md* (kort/komponenter/färger) :contentReference[oaicite:74]{index=74} :contentReference[oaicite:75]{index=75}  
  - Avancerade dashboards och AI-Insights/DataTable: *CRM_IMPLEMENTATION_2.md* :contentReference[oaicite:76]{index=76} :contentReference[oaicite:77]{index=77}
- [ ] **Operativa guider:** Lägg till “Hur testar jag X?” för varje huvudområde (Auth, Export, AI, UI).
- [ ] **Felhantering:** Dokumentera typiska `TRPCError`-koder (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`) och hur de testas.

---

## 22) Driftsättning & Konfig
- [ ] **ENV för AI:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OLLAMA_HOST`, `*_MODEL`.  
      **Kontroll:** `ai.testConnection` rapporterar korrekt aktiv provider/modell. :contentReference[oaicite:78]{index=78}
- [ ] **Caching:** Säkerställ `staleTime` i AI-Insights och HTTP-cache i listor där möjligt. :contentReference[oaicite:79]{index=79}
- [ ] **Loggning:** Bekräfta aktivitetsloggning för create/update/export/AI (enhetlig format). :contentReference[oaicite:80]{index=80} :contentReference[oaicite:81]{index=81} :contentReference[oaicite:82]{index=82}

---

## 23) Post-Merge Sanity Checklist
- [ ] **Länkar i UI:** ExportDialog tillgänglig från DataTable-toolbar; AI-knappar syns vid selektion. :contentReference[oaicite:83]{index=83} :contentReference[oaicite:84]{index=84}
- [ ] **Åtkomst:** `/stats` kräver `ADMIN|MANAGER`; `/admin` kräver `ADMIN`. :contentReference[oaicite:85]{index=85}
- [ ] **Data-integritet:** Primär kontakt per förening är unik. :contentReference[oaicite:86]{index=86}
- [ ] **Statusfärger:** Samtliga CRM-statusar mappas korrekt till palette. :contentReference[oaicite:87]{index=87}
- [ ] **Exporter:** Excel-blad och CSV-delimiter/encoding OK; JSON pretty vid `pretty:true`. :contentReference[oaicite:88]{index=88} :contentReference[oaicite:89]{index=89}

---



