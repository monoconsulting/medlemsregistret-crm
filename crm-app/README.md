# Medlemsregistret CRM

CRM-system för hantering av svenska föreningar baserat på scrapad data från kommunala register.

## Teknisk Stack

### Frontend
- **Next.js 15** (App Router) med TypeScript
- **Shadcn/ui** + **Tailwind CSS** för UI-komponenter
- **TanStack Query** (React Query v5) för datahantering
- **Zustand** för UI-state
- **React Hook Form** + **Zod** för formulärvalidering

### Backend & Database
- **Next.js API Routes** med tRPC för typsäkerhet
- **Prisma ORM** mot MySQL
- **Redis** för caching av stora scraped datasets (planned)
- **BullMQ** för scraping-jobb i bakgrunden (planned)

### Sök & Filter
- **Meilisearch** eller **Typesense** (planned)

## Projektstruktur

```
crm-app/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── dashboard/       # Dashboard sida
│   │   ├── municipalities/  # Kommunöversikt
│   │   ├── associations/    # Föreningslista
│   │   ├── contacts/        # Kontakter
│   │   └── groups/          # Grupperingar
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Shadcn UI komponenter
│   └── layout/              # Layout komponenter
│       ├── sidebar.tsx      # Navigation sidebar
│       └── header.tsx       # Header med user menu
├── lib/
│   └── utils.ts             # Utility funktioner
└── prisma/
    └── schema.prisma        # Databas schema
```

## Databasschema

### Huvudmodeller

- **Association** - Föreningar med scrapad data
  - Core fields: name, orgNumber, types, activities, categories
  - Contact info: email, phone, address
  - CRM fields: crmStatus, isMember, pipeline, assignedTo
  - Source metadata: sourceSystem, municipality, scrapeRunId

- **Contact** - Kontaktpersoner för föreningar
  - Basic: name, role, email, phone, mobile
  - Social media: linkedinUrl, facebookUrl, etc.

- **Note** - Anteckningar kopplade till föreningar
- **Tag** - Taggar för kategorisering
- **Group** - Dynamiska grupperingar av föreningar
- **Activity** - Aktivitetslogg

### CRM Status Flow
- UNCONTACTED → CONTACTED → INTERESTED → NEGOTIATION → MEMBER
- LOST / INACTIVE (alternativa slut-status)

### Pipeline Stages
- PROSPECT → QUALIFIED → PROPOSAL_SENT → FOLLOW_UP → CLOSED_WON / CLOSED_LOST

## Komma igång

### Installation

```bash
cd crm-app
npm install
```

### Miljövariabler

Kopiera `.env.example` till `.env` och konfigurera:

```env
DATABASE_URL="mysql://root:password@localhost:3306/medlemsregistret_crm"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Databas Setup

```bash
# Generera Prisma Client
npm run db:generate

# Push schema till databasen
npm run db:push

# (Valfritt) Öppna Prisma Studio för att inspektera databasen
npm run db:studio
```

### Importera fixtures

Det finns färdiga JSON/JSONL-fixtures under `scraping/out/` samt i arkivet `scraping.zip`. För att hydrera databasen lokalt:

1. Säkerställ att en MySQL-instans körs och att `DATABASE_URL` pekar på databasen.
2. Installera `unzip` om det inte redan finns (skriptet använder systemets `unzip`-kommando för att läsa arkivet).
3. Kör:

```bash
npm run db:import-fixtures
```

Skriptet:

- Hittar automatiskt JSON/JSONL-filer i `scraping/out/` och i `scraping.zip`.
- Grupperar filer per kommun och kör import i transaktioner (`new`, `update` och `replace`-lägen stöds via `--mode` flagga).
- Skapar kommunposter vid behov och loggar resultat (skapade, uppdaterade, hoppade poster) i `ImportBatch`-tabellen.

För att validera importer utan att skriva till databasen kan du köra `npm run db:import-fixtures -- --dry-run`.

### Utvecklingsserver

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

### Bygga för produktion

```bash
npm run build
npm start
```

## Kvalitetssäkring

```bash
# ESLint
npm run lint

# Playwright-smoketest för kommunlistan
npm run test:municipalities

# Kombinerad lint + smoketest
npm run check:smoke
```

## Huvudfunktioner

### 1. Dashboard
- KPI-kort med statistik
- Aktivitetsflöde
- Top 5 kommuner
- Medlemsutveckling (graf)

### 2. Kommunöversikt
- Interaktiv Sverigekarta
- Lista över kommuner med statistik
- Filtrera och sortera

### 3. Föreningslista
- Avancerad sökning och filtrering
- Multi-select för bulk-operationer
- Exportfunktioner
- Tabell/Kort/Karta-vyer

### 4. Föreningsvy (Detaljsida)
- **Översikt** - Typ, aktiviteter, beskrivning
- **Kontakter** - Kontaktpersoner med roller
- **Anteckningar** - CRM-anteckningar
- **Aktivitet** - Automatisk aktivitetslogg
- **Scrapad data** - Raw data från källsystem

### 5. CRM-funktioner
- Pipeline-hantering
- Status-uppdateringar
- Tilldelning till säljare
- Taggar och grupperingar
- AI-assisterad insikter (planned)

## Implementerat

✅ **tRPC Setup**
- Typsäker API-lager med tRPC
- Association router med queries för list, getById, getStats
- TanStack Query integration

✅ **UI-komponenter**
- Button, Card, Badge, Input, Label
- Select, Dropdown Menu, Tabs, Dialog
- Avatar, Separator, Checkbox, Textarea
- Toast notifications system

✅ **Dashboard**
- Live KPI-kort (från tRPC)
- Top 5 kommuner (från tRPC)
- Responsive layout
- Loading states

✅ **Layout & Navigation**
- Sidebar med huvudnavigation
- Header med user menu och notifikationer
- Nested routes

## Nästa Steg

- [x] Skapa databas seeders från scrapad data
- [ ] Implementera fulltextsök med Meilisearch/Typesense
- [ ] Bygga ut Dashboard med riktiga grafer (Recharts)
- [ ] Implementera Kommunöversikt med Sverigekarta
- [ ] Skapa avancerad filtrering för föreningslista
- [ ] Bygga komplett föreningsvy med alla tabs
- [ ] Implementera AI-assistans med OpenAI
- [ ] Skapa export-funktioner (CSV, Excel)
- [ ] Implementera bulk-operationer
- [ ] Generera Prisma Client i produktionsmiljö

## Licens

Proprietary - Mono Consulting AB
