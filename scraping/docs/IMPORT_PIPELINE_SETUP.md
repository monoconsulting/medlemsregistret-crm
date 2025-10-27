# IMPORT_PIPELINE_SETUP.md

## Mappstruktur (förslag)

```
<repo-root>/
	scraping/
│      	├─ schema/
│      	│  └─ scrapedEntry.schema.ts
│      	├─ scripts/
│      	│  └─ importAssociations.ts
│      	├─ json
│      	│  ├─ example.jsonl
│      	│  └─ example.json
├─ package.json
    └─ .env   # DATABASE_URL=...
```

> **Förutsättningar:**
>
> - Prisma är initierat i projektet och `@prisma/client` är genererat.
> - `Association.detailUrl` är **unique**.
> - `description`, `filterState`, `extras` är `Json?` i modellen.
> - `types/activities/categories` är `String[]` (Postgres) eller mappas till Json/text i din modell (justera i koden där markerat om du kör MySQL utan native arrays).

------

## 1) `schema/scrapedEntry.schema.ts`

```
// schema/scrapedEntry.schema.ts
/**
 * Zod schema for scraped municipal association entries.
 * Mirrors the JSON standard discussed in MUNICIPAL_ASSOCIATION_JSON_STANDARD.md.
 *
 * Validation rules:
 * - Enforces required metadata and association core fields
 * - Allows description as either string or structured object
 * - Normalizes arrays for types/activities/categories
 */

import { z } from "zod";

export const ContactSchema = z.object({
  contact_person_name: z.string().min(1, "contact_person_name is required"),
  contact_person_email: z.string().email().nullable().optional(),
  contact_person_phone: z.string().nullable().optional(),
  contact_person_role: z.string().nullable().optional(),
});

export const DescriptionSectionItemSchema = z.object({
  key: z.string(),
  value: z.any(), // keep flexible, importer will stringify if needed
});

export const DescriptionSectionSchema = z.object({
  label: z.string(),
  items: z.array(DescriptionSectionItemSchema).default([]),
});

export const DescriptionSchema = z.union([
  z.string(), // free text only
  z.object({
    free_text: z.string().optional(),
    sections: z.array(DescriptionSectionSchema).default([]),
  }),
]);

export const AssociationSchema = z.object({
  detail_url: z.string().url(),
  name: z.string().min(1),
  org_number: z.string().nullable().optional(),

  // Arrays: default to empty arrays to simplify downstream code
  types: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),

  homepage_url: z.string().url().nullable().optional(),
  street_address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),

  description: DescriptionSchema.nullable().optional(),
});

export const SourceNavigationSchema = z.object({
  list_page_index: z.number().int().nullable().optional(),
  position_on_page: z.number().int().nullable().optional(),
  pagination_model: z.string().nullable().optional(),
  filter_state: z.any().optional(),
});

export const ScrapedEntrySchema = z.object({
  source_system: z.string().min(1),
  municipality: z.string().min(1),
  scrape_run_id: z.string().min(1),
  scraped_at: z.union([z.string(), z.date()]),

  association: AssociationSchema,

  contacts: z.array(ContactSchema).optional(),
  source_navigation: SourceNavigationSchema.optional(),
  extras: z.record(z.any()).optional(),
});

export type TScrapedEntry = z.infer<typeof ScrapedEntrySchema>;
```

------

## 2) `scripts/importAssociations.ts`

```
// scripts/importAssociations.ts
/**
 * CLI importer for municipal association JSON.
 *
 * Features:
 * - Reads either JSONL (one JSON object per line) OR pretty JSON array
 * - Validates entries with Zod (ScrapedEntrySchema)
 * - Upserts Association by unique detailUrl
 * - Replaces Contacts per entry (deleteMany + create)
 * - Supports --dry for validation-only runs
 *
 * Usage:
 *   npx ts-node scripts/importAssociations.ts --file data/scrapes/example.jsonl
 *   npx ts-node scripts/importAssociations.ts --file data/scrapes/example.json --dry
 *
 * Options:
 *   --file <path>   Path to JSONL or JSON file
 *   --dry           Validate and show diff counts, but do not write to DB
 *   --limit <n>     Optional cap on number of records processed
 *
 * Assumptions about Prisma schema:
 *   - model Association {
 *       id               Int      @id @default(autoincrement())
 *       detailUrl        String   @unique
 *       name             String
 *       orgNumber        String?
 *       sourceSystem     String
 *       municipality     String
 *       scrapeRunId      String
 *       scrapedAt        DateTime
 *       types            String[]   // or Json/Text if MySQL; see TODO below
 *       activities       String[]   // ^
 *       categories       String[]   // ^
 *       homepageUrl      String?
 *       streetAddress    String?
 *       postalCode       String?
 *       city             String?
 *       email            String?
 *       phone            String?
 *       description      Json?
 *       listPageIndex    Int?
 *       positionOnPage   Int?
 *       paginationModel  String?
 *       filterState      Json?
 *       extras           Json?
 *       contacts         Contact[]
 *     }
 *
 *   - model Contact {
 *       id             Int    @id @default(autoincrement())
 *       associationId  Int
 *       name           String
 *       role           String?
 *       email          String?
 *       phone          String?
 *       association    Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
 *     }
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { PrismaClient, Prisma } from "@prisma/client";
import { ScrapedEntrySchema, TScrapedEntry } from "../schema/scrapedEntry.schema";

const prisma = new PrismaClient();

type CliOptions = {
  file: string;
  dry: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { file: "", dry: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && argv[i + 1]) {
      opts.file = argv[++i];
    } else if (a === "--dry") {
      opts.dry = true;
    } else if (a === "--limit" && argv[i + 1]) {
      opts.limit = Number(argv[++i]);
    }
  }
  if (!opts.file) {
    console.error("❌ Missing --file <path>");
    process.exit(1);
  }
  return opts;
}

async function* iterateJsonl(filePath: string): AsyncGenerator<any> {
  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      yield JSON.parse(trimmed);
    } catch (err) {
      console.error(`⚠️ Skipping invalid JSONL line: ${trimmed.slice(0, 200)}...`);
    }
  }
}

function isProbablyArrayJson(content: string) {
  const s = content.trim();
  return s.startsWith("[") && s.endsWith("]");
}

async function* iterateJsonArray(filePath: string): AsyncGenerator<any> {
  const content = await fs.promises.readFile(filePath, "utf-8");
  if (!isProbablyArrayJson(content)) {
    throw new Error("File does not look like a JSON array.");
  }
  const arr = JSON.parse(content);
  if (!Array.isArray(arr)) throw new Error("Top level is not an array.");
  for (const obj of arr) {
    yield obj;
  }
}

/**
 * Map a validated TScrapedEntry to Prisma data structures.
 * NOTE: Adjust array storage if your DB is MySQL without native string[]:
 *       - Option A: store as JSON: change Prisma field type to Json and pass arrays directly
 *       - Option B: store as comma-separated string: join(',') and split on read (not recommended)
 */
function toAssociationData(entry: TScrapedEntry): Prisma.AssociationUpsertArgs["create"] {
  const a = entry.association;

  // Normalize description: keep as-is (string or object). Prisma Json? field recommended.
  const description = a.description ?? null;

  // Optional navigation meta
  const nav = entry.source_navigation ?? {};

  // If your schema uses Json for arrays on MySQL, you can pass arrays as-is.
  // If it uses String[] on Postgres, this is also fine.
  const types = a.types ?? [];
  const activities = a.activities ?? [];
  const categories = a.categories ?? [];

  // Normalize timestamps
  const scrapedAt =
    typeof entry.scraped_at === "string" ? new Date(entry.scraped_at) : entry.scraped_at;

  return {
    detailUrl: a.detail_url,
    name: a.name,
    orgNumber: a.org_number ?? null,

    sourceSystem: entry.source_system,
    municipality: entry.municipality,
    scrapeRunId: entry.scrape_run_id,
    scrapedAt,

    types,
    activities,
    categories,

    homepageUrl: a.homepage_url ?? null,
    streetAddress: a.street_address ?? null,
    postalCode: a.postal_code ?? null,
    city: a.city ?? null,
    email: a.email ?? null,
    phone: a.phone ?? null,

    description, // Json? recommended

    listPageIndex: nav.list_page_index ?? null,
    positionOnPage: nav.position_on_page ?? null,
    paginationModel: nav.pagination_model ?? null,
    filterState: nav.filter_state ?? null,

    extras: entry.extras ?? null,

    // Contacts handled separately (deleteMany + create)
  };
}

function toContactsCreate(entry: TScrapedEntry): Prisma.ContactCreateWithoutAssociationInput[] {
  const contacts = entry.contacts ?? [];
  return contacts.map((c) => ({
    name: c.contact_person_name,
    role: c.contact_person_role ?? null,
    email: c.contact_person_email ?? null,
    phone: c.contact_person_phone ?? null,
  }));
}

async function upsertAssociation(entry: TScrapedEntry, dry: boolean) {
  const createData = toAssociationData(entry);
  const updateData = { ...createData }; // simple mirror update

  if (dry) return { action: "DRY", detailUrl: createData.detailUrl };

  // Upsert by unique detailUrl
  const result = await prisma.association.upsert({
    where: { detailUrl: createData.detailUrl },
    create: {
      ...createData,
      contacts: {
        create: toContactsCreate(entry),
      },
    },
    update: {
      ...updateData,
      // Replace contacts: clear then recreate
      contacts: {
        deleteMany: {}, // remove old
        create: toContactsCreate(entry),
      },
    },
    include: { contacts: true },
  });

  return { action: "UPSERT", id: result.id, detailUrl: result.detailUrl, contacts: result.contacts.length };
}

async function main() {
  const opts = parseArgs(process.argv);
  const filePath = path.resolve(process.cwd(), opts.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const isJsonl = filePath.toLowerCase().endsWith(".jsonl");
  const iter = isJsonl ? iterateJsonl(filePath) : iterateJsonArray(filePath);

  let count = 0;
  let ok = 0;
  let failed = 0;

  console.log(`▶️  Import start — file: ${filePath}  dry=${opts.dry ? "yes" : "no"}\n`);

  for await (const raw of iter) {
    if (opts.limit && count >= opts.limit) break;
    count++;

    // Validate with Zod
    const parsed = ScrapedEntrySchema.safeParse(raw);
    if (!parsed.success) {
      failed++;
      const issues = parsed.error.issues.map(i => `- ${i.path.join(".")}: ${i.message}`).join("\n");
      console.error(`❌ Row ${count} failed validation:\n${issues}\n`);
      continue;
    }

    try {
      const res = await upsertAssociation(parsed.data, opts.dry);
      ok++;
      console.log(`✅ Row ${count}: ${res.action} ${res.detailUrl}${"id" in res ? " (id " + res.id + ")" : ""}`);
    } catch (err: any) {
      failed++;
      if (err?.code === "P2002") {
        console.error(`⚠️ Row ${count}: Unique constraint error on detailUrl — this should have been handled by upsert. Error: ${err.meta?.target}`);
      } else {
        console.error(`❌ Row ${count} failed to upsert: ${err?.message ?? err}`);
      }
    }
  }

  console.log(`\n⏹️  Import finished: total=${count}, ok=${ok}, failed=${failed}, dry=${opts.dry ? "yes" : "no"}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

------

## 3) `package.json` (tillägg)

Lägg till (eller komplettera) följande script/dependencies.

```
{
  "scripts": {
    "import:associations": "ts-node scripts/importAssociations.ts --file",
    "import:dry": "ts-node scripts/importAssociations.ts --dry --file"
  },
  "dependencies": {
    "@prisma/client": "^5.19.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "prisma": "^5.19.0",
    "ts-node": "^10.9.2",
    "@types/node": "^22.7.5",
    "typescript": "^5.5.4"
  }
}
```

> Kör:
>
> ```
> npm i
> npx prisma generate
> ```
>
> Se till att `.env` innehåller `DATABASE_URL=...` mot din databas.

------

## 4) Exempelkommandon

```
# Validera utan DB-write (bra för PR-review)
npx ts-node scripts/importAssociations.ts --file data/scrapes/example.json --dry

# Importera indenterad JSON-array
npx ts-node scripts/importAssociations.ts --file data/scrapes/example.json

# Importera JSONL (en rad per objekt)
npx ts-node scripts/importAssociations.ts --file data/scrapes/example.jsonl

# Importera men begränsa till 50 rader
npx ts-node scripts/importAssociations.ts --file data/scrapes/example.jsonl --limit 50
```

------

## 5) Anpassningspunkter (om din DB inte stödjer String[])

- **MySQL utan native arrays:**

  - Ändra Prisma-fält `types/activities/categories` till `Json?` i modellen.

  - Koden här fungerar oförändrad (arrayer går in i Json).

  - Alternativt (inte rekommenderat): lagra kommaseparerad `String` och byt i koden:

    ```
    const typesCsv = (a.types ?? []).join(",");
    // ...spara i typesCsv istället
    ```

- **`description` som Text:**

  - Om du föredrar text, kan du `JSON.stringify` description-objekt i `toAssociationData`:

    ```
    const description = typeof a.description === "string" ? a.description : JSON.stringify(a.description);
    ```

  - Och ändra fälttyp i Prisma till `String?`.

------

## 6) Kvalitetssäkring & drift

- **Idempotens:** Upsert på `detailUrl` gör importen säkert körbar flera gånger.
- **Kontaktsynk:** `deleteMany + create` säkerställer att listan återspeglar senaste scrape.
- **Felsäkerhet:** Ogiltiga rader loggas och hoppar vidare (fortsätter batch).
- **Observabilitet:** Summering `ok/failed/total` på slutet.
- **Prestanda:** För riktigt stora körningar—batcha i chunkar; ev. använd `createMany` för nyimport (kan läggas till som förbättring).