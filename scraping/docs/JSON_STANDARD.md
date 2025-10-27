# MUNICIPAL_ASSOCIATION_JSON_STANDARD.md

> **Scope:** Standard för scrapad kommun-/föreningsdata som ska in i CRM:et. Designad för att valideras med Zod och importeras med Prisma enligt befintlig kodbas.

## 1) Filformat

- **Rekommenderat för stora körningar:** **JSONL** (en förening per rad, *compact*). Lätt att streama och robust mot partial-fel. Importeraren kan läsa rad-för-rad.
- **Rekommenderat för granskning i Git:** **Pretty JSON** (array med objekt, indenterad). Lättläst för människor, bra för PR:er och diffar.
   Importeraren stödjer **båda** (JSONL och JSON-array). Validering sker med Zod enligt schemat nedan.

> **Varför inte alltid en rad?** För maskinell import är compact JSONL effektivast. För mänsklig review är *pretty* JSON överlägset. Vi kör pretty i repo/loggar och JSONL i batch-exporter/pipe-flöden.

## 2) Top-level struktur

Varje **post** (rad i JSONL eller objekt i en JSON-array) måste följa:

```
{
  "source_system": "FRI",
  "municipality": "Årjäng",
  "scrape_run_id": "9f2a2b01-2db1-4f58-9a17-2d9f3a2b6a11",
  "scraped_at": "2025-10-26T06:55:12.000Z",

  "association": {
    "detail_url": "https://fri.arjang.se/FORENING/123",
    "name": "Årjängs IF",
    "org_number": "802123-4567",
    "types": ["Idrottsförening"],
    "activities": ["Fotboll", "Juniorverksamhet"],
    "categories": ["Ungdom", "Lokal"],
    "homepage_url": "https://arjangsif.se",
    "street_address": "Storgatan 1",
    "postal_code": "672 30",
    "city": "Årjäng",
    "email": "info@arjangsif.se",
    "phone": "0573-123 45",

    "description": {
      "free_text": "Föreningen bedriver fotbollsverksamhet för barn och vuxna.",
      "sections": [
        {"label": "Övrig information", "items": [
          {"key": "Medlemsavgift", "value": "200 kr/år"},
          {"key": "Målgrupp", "value": "Barn, ungdomar, vuxna"}
        ]}
      ]
    }
  },

  "contacts": [
    {
      "contact_person_name": "Anna Andersson",
      "contact_person_role": "Ordförande",
      "contact_person_email": "anna@arjangsif.se",
      "contact_person_phone": "070-111 22 33"
    }
    {
      "contact_person_name": "Joel Nilsson",
      "contact_person_role": "Sekreterare",
      "contact_person_email": "anna@arjangsif.se",
      "contact_person_phone": "070-111 33 33"
    }
  ],

  "source_navigation": {
    "list_page_index": 3,
    "position_on_page": 12,
    "pagination_model": "next_button_disappears_on_last",
    "filter_state": { "category": "Idrott", "municipality": "Årjäng" }
  },

  "extras": {
    "founded_year": 1945,
    "national_affiliation": "SvFF"
  }
}
```

### Fältbeskrivningar (top-level)

- `source_system` *(string, required)* – Källplattform (t.ex. `"FRI"`).
- `municipality` *(string, required)* – Kommunnamn.
- `scrape_run_id` *(string, required)* – ID för körningen (uuid e.d.).
- `scraped_at` *(string|date, required)* – ISO-timestamp för när posten hämtades. Importeraren konverterar till Date/DateTime. 

### `association` (required)

- `detail_url` *(string, required, **unik** i DB)* – Absolut URL till detaljsida. Bas för upsert/konflikthantering.

- `name` *(string, required)* – Föreningens namn.

- `org_number` *(string|null)* – Organisationsnummer om tillgängligt.

- `types`, `activities`, `categories` *(string[])* – Normaliserade listor (kan vara tomma).

- `homepage_url`, `street_address`, `postal_code`, `city`, `email`, `phone` *(string|null)* – Kontakt och adress.

- `description` *(string **eller** objekt|null)* – Tillåt **antingen** ren text **eller** ett objekt:

  - **Text:** `"description": "…"`

  - **Objekt:**

    ```
    {
      "free_text": "…",
      "sections": [
        {"label": "Övrig information", "items": [{"key": "…", "value": "…"}]}
      ]
    }
    ```

  Behåller struktur för tvåkolumnstabeller m.m. vid scraping. 

### `contacts` (array, required)

Objekt med:
 `contact_person_name` (string, **required**),
 `contact_person_role` (string|null),
 `contact_person_email` (string|null),
 `contact_person_phone` (string|null).
 Importeraren mappar varje element till en **Contact**-rad länkad till föreningen. 

### `source_navigation` (object, optional)

`list_page_index` *(int|null)*, `position_on_page` *(int|null)*, `pagination_model` *(string|null)*, `filter_state` *(json|null)*. Meta om var posten hittades och hur sidan var filtrerad. 

### `extras` (object, optional)

Godtycklig nyckel–värde-påse (JSON) för fält som inte ingår i kärnmodellen (ex: `founded_year`). Lagrar i DB som JSON. 

## 3) Normaliseringsregler

1. **Nycklar i JSON ska vara `snake_case`** (som i exemplet). Importeraren mappar till DB-fält (camelCase i Prisma) enligt tabellen nedan. 
2. Saknade/tomma fält ska vara **`null`** (inte tomma strängar) där fältet inte är en lista. Listor får vara tomma (`[]`). 
3. Trimma whitespace, standardisera telefonformat så gott det går (valfritt, men rekommenderas).
4. `scraped_at` ska vara ISO 8601 string.
5. `detail_url` måste vara absolut URL.

## 4) JSON → Databas (Prisma) mappning

| JSON-nyckel                          | Prisma/DB-fält                               |
| ------------------------------------ | -------------------------------------------- |
| `source_system`                      | `Association.sourceSystem`                   |
| `municipality`                       | `Association.municipality`                   |
| `scrape_run_id`                      | `Association.scrapeRunId`                    |
| `scraped_at`                         | `Association.scrapedAt` (DateTime)           |
| `association.detail_url`             | `Association.detailUrl` (**unique**)         |
| `association.name`                   | `Association.name`                           |
| `association.org_number`             | `Association.orgNumber`                      |
| `association.types`                  | `Association.types` (string[])               |
| `association.activities`             | `Association.activities` (string[])          |
| `association.categories`             | `Association.categories` (string[])          |
| `association.homepage_url`           | `Association.homepageUrl`                    |
| `association.street_address`         | `Association.streetAddress`                  |
| `association.postal_code`            | `Association.postalCode`                     |
| `association.city`                   | `Association.city`                           |
| `association.email`                  | `Association.email`                          |
| `association.phone`                  | `Association.phone`                          |
| `association.description`            | `Association.description` (JSON/text)        |
| `source_navigation.list_page_index`  | `Association.listPageIndex`                  |
| `source_navigation.position_on_page` | `Association.positionOnPage`                 |
| `source_navigation.pagination_model` | `Association.paginationModel`                |
| `source_navigation.filter_state`     | `Association.filterState` (JSON)             |
| `extras`                             | `Association.extras` (JSON)                  |
| `contacts[].*`                       | Relationen `Contact` (name/email/phone/role) |

Mappningen är bekräftad av dina import-/mappningsanteckningar och används av importeraren när den kör `create`/`update` (P2002 på `detailUrl` ⇒ uppdatera i stället för duplicera och synka kontakter).

## 5) Zod-validering (referens)

Importeraren använder ett Zod-schema i denna stil (förenklad här; full version i koden): 

```
const ContactSchema = z.object({
  contact_person_name: z.string(),
  contact_person_email: z.string().nullable().optional(),
  contact_person_phone: z.string().nullable().optional(),
  contact_person_role: z.string().nullable().optional()
});

const AssociationSchema = z.object({
  detail_url: z.string().url(),
  name: z.string(),
  org_number: z.string().nullable().optional(),
  types: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  homepage_url: z.string().nullable().optional(),
  street_address: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  description: z.union([z.string(), z.any()]).nullable().optional()
});

export const ScrapedEntrySchema = z.object({
  source_system: z.string(),
  municipality: z.string(),
  scrape_run_id: z.string(),
  scraped_at: z.union([z.string(), z.date()]),
  association: AssociationSchema,
  contacts: z.array(ContactSchema).optional(),
  source_navigation: z.object({
    list_page_index: z.number().optional(),
    position_on_page: z.number().optional(),
    pagination_model: z.string().optional(),
    filter_state: z.any().optional()
  }).optional(),
  extras: z.record(z.any()).optional()
});
```



## 6) Import-semantik & dubbletter

- **Skapa**: `prisma.association.create({ data, include: { contacts: { create: [...] }}})`
- **Konflikt (P2002 på `detailUrl`) ⇒ Uppdatera**: `prisma.association.update({ where: { detailUrl }, data: { ...fields, contacts: { deleteMany: {}, create: [...] }}})` (enkelt och deterministiskt synk-beteende: “scrape är sanningen”).

------

## 7) Kort **Agent Instruction** (för scraping → JSON)

**Mål:** Leverera poster som exakt följer *Municipal Association JSON Standard* ovan.

1. **Pagination & slutvillkor**
    Navigera genom *alla* resultatsidor. När “Nästa” försvinner eller du når “Sista”/“Last”, avsluta. Logga `list_page_index` och `position_on_page` per rad. 
2. **Detaljsidor**
    Besök varje förenings detaljsida (om finns). Sätt `association.detail_url` till detalj-URLen.
3. **Fältmappning**
    Extrahera kärnfälten under `association.*` enligt standarden. Om data finns i tabellsektioner (t.ex. “Övrig information”) – normalisera in i `description.sections` som `{label, items[{key,value}]}` och lägg *ev. fritext* i `description.free_text`. `types/activities/categories` blir listor. 
4. **Kontakter**
    Fyll `contacts[]` med för- och efternamn, roll, e-post, telefon när detta finns. Lämna `null` där uppgift saknas (ingen gissning). 
5. **Metadata**
    Sätt `source_system`, `municipality`, `scrape_run_id`, `scraped_at`. Fyll `source_navigation` om möjligt.
6. **Extras**
    All övrig strukturerad info som inte passar i kärnfälten hamnar under `extras` som nyckel–värde-objekt.
7. **Validera före skrivning**
    Kör Zod-validering med `ScrapedEntrySchema`. Vid fel: logga rad/URL och fortsätt med nästa post. 
8. **Outputformat**
    För batch: skriv **JSONL** (en objekt-rad). För manuell review/test: skriv en **indenterad JSON-array**.

------

## 9) Varför denna standard “passar” din DB & importer

- Den följer din befintliga Prisma-modell och tRPC-lager (fält som `detailUrl`, `description` som JSON/text, relations-`contacts`). 
- Mappningstabellen och Zod-schemat matchar dina egna importanteckningar, inkl. upsert-strategin och kontakt-synk.
- Den är **robust** (null istället för tomma strängar, tydlig metadata, bevarar tabellinformation under `description.sections`). 

------

### Snabb not om “en rad vs pretty”

- **Agentoutput (stora körningar)**: JSONL compact är mest effektivt och enklast att streama/återuppta.
- **Review i Git/PR**: pretty JSON (indenterad) är bättre.
   Importeraren accepterar båda—så vi kan använda **båda parallellt** beroende på syfte. 

------

- 