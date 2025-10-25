# CRM Web Scraping och Importfunktionalitet

## Översikt

CRM-systemet innehåller en omfattande web scraping-funktionalitet för att samla in data om föreningar från svenska kommuners föreningsregister. Systemet använder Playwright för att automatisera webbläsare och extrahera data från olika plattformar, främst FRI Webb-Förening. Den scrapade datan importeras sedan direkt till databasen genom en robust importmotor.

## Web Scraping Process

### Plattformar som stöds

- **FRI Webb-Förening**: Den primära plattformen som används av många svenska kommuner
- Systemet är designat för att hantera olika varianter av FRI-plattformen med svenska och engelska gränssnitt

### Scraping-skript

Varje kommun har ett dedikerat scraping-skript i `scraping/`-katalogen (t.ex. `sollentuna_scrape.ts`, `arjang_scrape.ts`). Skripten:

1. **Navigerar listvyer**: Går igenom alla sidor med föreningar genom att klicka på "Next"/"Nästa"-knappar
2. **Extraherar listdata**: Samlar namn, typ, verksamhet och andra fält från tabellen
3. **Besöker detaljsidor**: För varje förening öppnas detaljsidan för ytterligare information
4. **Parsar strukturerad data**: Extraherar kontaktinformation, beskrivningar och metadata från tvåkolumnstabeller
5. **Hantera fel**: Robust felhantering med retries och rate limiting

### Dataextraktion

Systemet följer strikta regler för dataextraktion definierade i `docs/CRM_SCRAPING_INSTRUCTIONS_V.1.1.md`:

- **Kärnfält**: namn, organisationsnummer, e-post, telefon, hemsida, adress mappas till toppnivå
- **Tvåkolumnstabeller**: Etikett/värde-par från "Övrig information" sparas strukturerat i `description.sections`
- **Kontaktpersoner**: Extraheras till en separat `contacts`-array
- **Metadata**: Källsystem, kommun, scrape-run-id, tidsstämplar

## Data Output Format

Scraping-skripten producerar två typer av filer i `scraping/out/`:

1. **JSONL-filer** (`Municipality_associations_{run_id}.jsonl`): En JSON-post per rad för effektiv strömning
2. **Pretty JSON** (`Municipality_associations_{run_id}.json`): Formaterad JSON-array för läsning

### JSON Schema per förening

```json
{
  "source_system": "FRI",
  "municipality": "Sollentuna",
  "scrape_run_id": "uuid-v4",
  "scraped_at": "2025-01-01T12:00:00Z",
  "association": {
    "name": "Föreningsnamn",
    "org_number": "123456-7890",
    "types": ["Idrottsförening"],
    "activities": ["Fotboll", "Basket"],
    "homepage_url": "https://example.com",
    "email": "info@example.com",
    "phone": "+46 123 456 789",
    "street_address": "Gatunamn 1",
    "postal_code": "12345",
    "city": "Sollentuna",
    "description": {
      "sections": [
        {
          "title": "Övrig information",
          "data": {
            "founded_year": 1912,
            "fiscal_year_starts_mmdd": "0101",
            "national_affiliation": "Svenska Fotbollförbundet"
          }
        }
      ],
      "free_text": "Ytterligare beskrivning..."
    }
  },
  "contacts": [
    {
      "contact_person_name": "Anna Andersson",
      "contact_person_role": "Ordförande",
      "contact_person_email": "anna@example.com",
      "contact_person_phone": "+46 987 654 321"
    }
  ],
  "source_navigation": {
    "list_page_index": 1,
    "position_on_page": 5,
    "pagination_model": "numeric_plus_next_last"
  },
  "extras": {
    "custom_field": "värde"
  }
}
```

## Importfunktionalitet

Importprocessen hanteras av `crm-app/scripts/import-fixtures.ts` och använder `crm-app/lib/importer.ts` för kärnlogiken.

### Importkällor

Importfunktionen söker automatiskt efter data från två källor:

1. **Lokala filer**: `scraping/out/` - katalog med JSON/JSONL-filer
2. **Arkiv**: `scraping.zip` - komprimerat arkiv med samma struktur

### Importlägen

Tre olika importlägen stöds:

- **`new`**: Importerar endast nya föreningar, hoppar över existerande
- **`update`**: Uppdaterar existerande föreningar, skapar nya
- **`replace`**: Raderar alla föreningar för kommunen och importerar om från scratch

### Kommandoexempel

```bash
# Uppdatera alla kommuner med standardläge (update)
npx tsx crm-app/scripts/import-fixtures.ts

# Importera endast nya föreningar
npx tsx crm-app/scripts/import-fixtures.ts --mode=new

# Ersätt alla föreningar för en specifik kommun
npx tsx crm-app/scripts/import-fixtures.ts --mode=replace --municipality=Sollentuna
```

## Databas och Data Flow

### Databasschema

Importen använder Prisma ORM och mappar scrapad data till följande tabeller:

- **`Municipality`**: Kommuner (skapas automatiskt om saknas)
- **`Association`**: Huvudtabell för föreningar
- **`Contact`**: Kontaktpersoner (many-to-one med Association)
- **`DescriptionSection`**: Strukturerade beskrivningar (many-to-one med Association)
- **`ImportBatch`**: Spårning av importoperationer
- **`ScrapeRun`**: Metadata för scraping-körningar

### Dataflöde

1. **Parsing**: JSONL-filer parsas till `ScrapedAssociation[]`
2. **Validering**: Varje post valideras (namn, kommun krävs)
3. **Upplösning**: Kommun och scrape-run-ID:n matchas/uppskapas
4. **Deduplisering**: Kontrollerar mot existerande föreningar via `detail_url` eller namn+kommun
5. **Transaktion**: Hela importen körs i en databastransaktion
6. **Statistik**: Detaljerad rapportering av importerade/uppdaterade/hoppade över/fel

### Felhantering

- **Transaktioner**: Hela importen rullas tillbaka vid kritiska fel
- **Batch-tracking**: Varje import skapar en `ImportBatch`-post med status och statistik
- **Felrapportering**: Upp till 5 fel loggas per batch, med möjlighet att se alla
- **Återhämtning**: Misslyckade importer markerar batch som 'failed'

## Användning i praktiken

### Fullständig workflow

1. **Kör scraping**: `npx tsx scraping/sollentuna_scrape.ts`
2. **Verifiera output**: Kontrollera filer i `scraping/out/`
3. **Importera**: `npx tsx crm-app/scripts/import-fixtures.ts --mode=update`
4. **Monitorera**: Kolla importstatistik och fel i konsolen

### Automatisering

Systemet stödjer batch-import från arkiv, vilket möjliggör:
- Automatiserade nightly imports
- Import från externa källor
- Rollback genom att köra `replace` med äldre data

### Prestandaoptimeringar

- **Strömmande parsing**: JSONL-filer behandlas rad för rad
- **Batch-operationer**: Flera föreningar skapas/uppdateras i bulk
- **Caching**: Scrape-run-ID:n cachas för att undvika upprepade lookups
- **Indexering**: Databasen är optimerad för lookups på namn, detail_url och kommun

## Säkerhet och Compliance

- **Rate limiting**: Scraping respekterar servrar med delay mellan requests
- **Felhantering**: Robust hantering av nätverksfel och förändrade webbsidor
- **Data validation**: Strikt validering före import för att förhindra korrupt data
- **Audit trail**: Alla importer loggas med användare, tid och statistik

## Utvidgning

Systemet är designat för att enkelt lägga till nya kommuner/plattformar:

1. Skapa nytt scrape-script baserat på mall (t.ex. `template_scrape.ts`)
2. Uppdatera importlogiken om nya fält behövs
3. Lägg till plattformsspecifika parsers i importer.ts vid behov

För detaljerade scraping-instruktioner, se `docs/CRM_SCRAPING_INSTRUCTIONS_V.1.1.md`.