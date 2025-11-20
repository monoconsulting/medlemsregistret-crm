Jag börjar med slutsatsen i klartext:

- **Nej, soft delete-designen är inte konsekvent än**, varken för föreningar eller kontakter.
- **Felet när du skapar kontakter är nästan säkert kopplat till den nya Contact.deletedAt-kolumnen / SQL i `api/contacts.php`**, i kombination med att du kör mot Loopia-databasen från både Docker och Loopia-PHP.
- **Du har dessutom ett par strukturella risker**: dubbla API-versioner, incheckade DB-credentials, otydlig separation mellan Docker-backend och Loopia-frontend.

Nedan går jag igenom:

1. Hur flödet ser ut nu (Docker ↔ Loopia ↔ DB).
2. Vad jag ser kring soft delete för Association/Contact.
3. Specifika problem, prioriterade.
4. En konkret plan för att:
   - få kontakter att fungera stabilt
   - städa upp soft delete
   - säkra Loopia-kopplingen
   - koppla på AI-tjänster enligt dokumentationen.

------

## 1. Översikt – hur saker hänger ihop nu

### 1.1 Miljöer och arkitektur

Ur kodbasen/dokumentationen ser jag:

- **Frontend** (Next.js app router) i `crm-app/`.
  - Är tänkt att byggas statiskt och laddas upp på Loopia enligt `docs/DEPLOYMENT_LOOPIA_v.1.1.md`.
- **PHP-API på Loopia** i `/api/`:
  - `api/associations.php` – CRUD/listning för föreningar.
  - `api/contacts.php` – CRUD/listning för kontakter + soft delete.
  - `api/association_notes.php`, `api/contact_notes.php`, `api/contact_social_lookup.php`, `api/health_contacts.php` m.fl.
  - `api/bootstrap.php` hanterar DB-koppling, session, CSRF.
- **Docker-miljö lokalt**:
  - Kör fortfarande Node/Express/tRPC + Prisma mot **samma MariaDB på Loopia** (via `DATABASE_URL`).
  - Har scraping, import, mm.
- **Databas-schema** definierat i `crm-app/prisma/schema.prisma`.

Det här innebär i praktiken:

> **En och samma Loopia-databas skrivs av två olika backender:**
>
> - Node/Prisma (Docker)
> - PHP-API (Loopia)

…och båda har **egna idéer om soft delete**. Det är här mycket av mis-matchen kommer ifrån.

------

## 2. Soft delete – hur det faktiskt ser ut

### 2.1 Föreningar (Association)

I `crm-app/prisma/schema.prisma`:

```prisma
model Association {
  id            String   @id @default(cuid())
  ...
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  importBatchId String?
  deletedAt     DateTime?
  isDeleted     Boolean  @default(false)
  ...
}
```

Alltså:

- **Två softdelete-signaler**:
  - `deletedAt` (timestamp)
  - `isDeleted` (bool)

I **PHP-API:t** (`api/associations.php`) filtrerar man med:

```php
$whereParts = ['a.deletedAt IS NULL'];
```

Inga kontroller på `isDeleted` där. Node/Prisma-kod (tRPC-lagret) använder däremot på flera ställen `where: { isDeleted: false }` (enligt tidigare design i backend-delen och den gamla planen).

Konsekvens:

- Om Node-koden sätter `isDeleted = true` men **inte** rör `deletedAt` →
  - PHP-API visar fortfarande posten (för den tittar bara på `deletedAt`).
- Om PHP-API uppdaterar `deletedAt` men **inte** sätter `isDeleted` →
  - Node-koden kan fortfarande råka hämta posten om den bara tittar på `isDeleted`.

Det här är en klassisk källa till “var tog min förening vägen?” / “varför ser jag raderade saker?”-buggar.

### 2.2 Kontakter (Contact)

I samma schema:

```prisma
model Contact {
  id            String   @id @default(cuid())
  associationId String
  ...
  isPrimary     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
  ...
}
```

Här är det bättre – **endast `deletedAt`**, ingen `isDeleted`. Migrations:

- `20251024_add_contacts_and_sections` – tom (ändringen låg redan i schema).

- `20251117144500_add_contact_soft_delete/migration.sql`:

  ```sql
  ALTER TABLE `Contact`
    ADD COLUMN `deletedAt` DATETIME(3) NULL;
  ```

I **PHP-API:t** (`api/contacts.php`) används `deletedAt` konsekvent:

- Listning per förening:

  ```php
  WHERE c.associationId = ?
    AND (c.deletedAt IS NULL)
  ```

- Global listning:

  ```php
  WHERE (c.deletedAt IS NULL)
  ```

- Soft delete:

  ```php
  UPDATE Contact
  SET deletedAt = NOW(), updatedAt = NOW()
  WHERE id = ? AND deletedAt IS NULL
  ```

Så **modellen** för soft delete på Contact är egentligen ren: timestamp-baserad.

**Men**:

- Node/Prisma-delen har tidigare inte haft `deletedAt`, utan bara live-kontakter. Viss backend-logik kan fortfarande utgå från att “kontakt som finns i tabellen = aktiv”, vilket krockar om PHP stänger dem med `deletedAt`.
- `docs/bugs/contacts_errors.md` beskriver (kortversionen i filen) att du tidigare hade SQL-fel på Loopia kopplat till Contact.soft delete och att endpointen `/api/contacts.php` gav 500 just pga SQL-miss.

------

## 3. Konkreta problem jag ser (inkl. varför du troligen inte kan skapa kontakter)

### P0 – Kritiska saker

#### 3.1 Kontakter: schema/API-mismatch + 500-fel

Det jag kan se:

- **Frontend** (kontakt-UI) använder PHP-API:t direkt via `api.createContact()` i `crm-app/components/modals/add-contact-modal.tsx`.

  - Den skickar fält i **snake_case**:

    ```ts
    await api.createContact({
      association_id: associationId,
      name: ...,
      role: ...,
      email: ...,
      ...
    })
    ```

- **Validatorn** `crm-app/lib/validators/contact.ts` jobbar däremot i camelCase (`associationId` etc). Den används för andra delar / Node-flöden, men inte nödvändigtvis i just den modalen.

- **PHP-API** (`api/contacts.php`) läser kroppen som:

  ```php
  $associationId = normalize_nullable_string($body['association_id'] ?? null, 36);
  ...
  ```

  → matchar snake_case-payloaden = bra.

- Soft delete-kolumnen `deletedAt` finns nu (migration körd).

När du får 500 vid “lägga till kontakt” pekar allt mot att **SQL-statementet i `handle_create_contact()` fortfarande refererar till någon kolumn som inte finns eller har fel typ i Loopia-DB:n**. Exempel på sådant som (tidigare) orsakat 500 enligt `docs/bugs/contacts_errors.md`:

- Felaktiga kolumnnamn (t.ex. `is_primary` vs `isPrimary`, `linkedin_url` vs `linkedinUrl`).
- Filtrering på kolumn som saknas (`deletedAt` innan migrationen).
- Längre `VARCHAR` än index tillåter i Loopia (utf8mb4 + långa index).

Här är det avgörande:

> **Loopia-DB kan ha ett schema som inte fullt ut matchar din lokala Prisma-definition**, om migrationerna inte blivit körda exakt likadant där.

Så även om koden *ser* rätt ut nu, är det mycket troligt att:

- antingen `Contact`-tabellen på Loopia saknar `deletedAt` eller har annan kolumnuppsättning, eller
- `INSERT`-statementet i `contacts.php` har fler kolumner än som faktiskt finns i tabellen.

#### 3.2 Dubbla soft delete-fält på Association (deletedAt + isDeleted)

Som sagt:

- PHP tittar bara på `deletedAt`.
- Node/Prisma (och ev. tRPC) tittar ofta bara på `isDeleted`.

Det är väldigt lätt att skapa en förening i ett flöde och “radera” den i ett annat – och få helt olika bild beroende på vilket API UI:t pratar med.

#### 3.3 Incheckade DB-credentials (`api/config.php`)

I `api/config.php` ligger dina Loopia-credentials i klartext. De används som fallback i `temp/local_webroot/api/bootstrap.php` om miljövariabler saknas.

Det här är:

- en **säkerhetsrisk** (credentials i repo),
- en **risk för fel miljö**: lokala scripts kan råka skriva mot produktion, och tvärtom, om du kör från fel katalog.

### P1 – Stora men inte akut blockerande saker

#### 3.4 Dubbla API-träd (`api/` vs `temp/local_webroot/api/`)

Du har:

- `api/` – “riktiga” PHP-API:t.
- `temp/local_webroot/api/` – en spegling som används i lokala tester / deploy scripts.

Båda har `bootstrap.php`, `config.php`, osv. Den variant som faktiskt laddas upp till Loopia beror på dina deploy-skript (`scripts/deploy_loopia_frontend.bat`, `docs/DEPLOYMENT_LOOPIA_v.1.1.md`).

Risk:

- Det är lätt att fixa buggar i `api/` men glömma `temp/local_webroot/api/` (eller tvärtom) och därmed deploya fel version.
- I synnerhet för soft delete och contacts där du har gjort sena ändringar.

#### 3.5 Otydlig separation: Docker-backend vs Loopia-frontend

Av dokumentationen framgår:

- All scraping och tunga grejer ska gå via Docker/Node.
- Offentlig frontend (`crm.medlemsregistret.se`) ska gå via PHP-API:t på Loopia.

Men i praktiken:

- Next-appen och auth-flödet (enligt `LOGIN_PROCESS_DEFINITION.md`) är fortfarande beskrivet med Express/JWT/tRPC.
- MCRM-simplified-planen flyttar dock datalagret till PHP-endpoints (`lib/api.ts`→`/api/*.php`).

Det ser ut som att du är mitt i migreringen, vilket ökar risken att vissa views fortfarande pekar mot Node-backend istället för PHP, och då använder *andra* soft delete-regler.

### P2 – AI-tjänster & taggar

- Du har en ganska avancerad plan för AI-driven tagg-generering (`scripts/populate_tags_v2.php`, `docs/TAGS_IMPLEMENTATION_PLAN.md`) och loggning (`api/lib/tag_generation_logger.php`).
- Du har `api/contact_social_lookup.php` som “lägger kontakt i kö” för AI-driven social media-lookup (den loggar ett payload med namn, förening, kommun, email, telefon osv i en audit/queue-tabell).
- Dock ser jag ännu ingen **färdig worker** som:
  - läser kö-n, ropar på Ollama / GPT-OSS:20B (se `docs/OLLAMA_API_DOCUMENTATION.md`),
  - uppdaterar `Contact.linkedinUrl` etc,
  - markerar jobbet som klart/misslyckat.

Så AI-delen är **påbörjad** men inte fullt implementerad i flöde.

------

## 4. Plan – steg för steg

### Fas 0 – Säkra felsökning på kontakter (akut för dig)

1. **Slå på tydligare fel i dev/lokalt**:
   - I `api/contacts.php` loggas redan SQL-fel via `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);` och `catch (mysqli_sql_exception $e)`.
   - Se till att loggningen i catch-blocket faktiskt skriver **`$e->getMessage()`** till en fil (t.ex. `/logs/api_contacts_error.log`) men **inte** skickar det rått till klienten i produktion.
2. **Verifiera Loopia-schema för `Contact`**:
   - Via Adminer/phpMyAdmin: kontrollera att kolumnerna exakt matchar Prisma-definitionen (inkl. `deletedAt`).
   - Om de inte gör det: korrigera med ett rent `ALTER TABLE` (samma som i migrationen).
3. **Testa `INSERT`-statementet manuellt**:
   - Kopiera SQL från `handle_create_contact()` i `contacts.php`.
   - Kör det med dummy-data direkt i Loopia mot `Contact`.
   - Justera kolumnlista/typer tills det går igenom utan fel.
4. **Kör hela flödet från frontend**:
   - Öppna “Kontakter” → lägg till kontakt → kontrollera att:
     - 200 OK från `/api/contacts.php` (POST),
     - posten syns i `/api/contacts.php?association_id=...`,
     - posten syns i globala listan `/api/contacts.php?page=1&pageSize=50`.

> När detta fungerar är kontakt-skapa-flödet på banan, oavsett soft delete-problematik.

------

### Fas 1 – Standardisera soft delete

#### 4.1 Beslut: vilken flagga gäller?

- **För Association**:
  - Sätt **`deletedAt` till “source of truth”**.
  - `isDeleted` får vara en *derived/legacy* flagg.
- **För Contact**:
  - Fortsätt använda **endast `deletedAt`**.

#### 4.2 Anpassa alla queries

1. **PHP-API**:
   - `api/associations.php`: säkerställ att **alla SELECT** har `WHERE a.deletedAt IS NULL`.
   - `api/contacts.php`: detta ser redan rätt ut (filterar på `deletedAt IS NULL`).
   - `api/health_contacts.php`: se till att hälsokontrollen också tar hänsyn till `deletedAt` (så du inte larmar på soft-deleted kontaktdata).
2. **Node/Prisma (Docker)**:
   - Sök i backend efter `isDeleted` i Association-queries.
   - Ändra så att de alltid filtrerar på `deletedAt: null` (och ev. sätter `isDeleted = true` endast för bakåtkompatibilitet).
   - För Contact: se till att alla queries filtrerar på `deletedAt: null` om det är tänkt att visa “aktiva” kontakter.
3. **Skriv en liten “data-reparerare”** (engångsscript):
   - Kör mot Loopia, t.ex. Node/Prisma eller ren SQL:
   - För Association:
     - Sätt `isDeleted = 1` där `deletedAt IS NOT NULL`.
     - Sätt `isDeleted = 0` där `deletedAt IS NULL`.
   - Efter detta är `isDeleted` alltid konsistent med `deletedAt`.

------

### Fas 2 – Rensa & fixera API-ytan mot Loopia

1. **Bestäm “sanningens API” för frontend**:
   - För publik CRM-UI (`crm.medlemsregistret.se`) → **endast PHP-API** ska användas.
   - I `crm-app/lib/api.ts` (enligt simplified-planen) säkerställ att alla datakällor pekar på `/api/*.php` och att `NEXT_PUBLIC_API_BASE_URL` i Loopia-bygget är `""` (same origin).
2. **Städa dubbla API-träd**:
   - Välj **en** källa (`api/` som “sanning”).
   - Se till att deploy-skripten (`scripts/deploy_loopia_frontend.bat`) **enbart** synkar `api/` till Loopia, inte `temp/local_webroot/api/`.
   - `temp/local_webroot/api/` kan finnas kvar som test-area, men den får inte användas i deploy.
3. **Säkra DB-credentials**:
   - Ta bort hemliga värden ur `api/config.php` i repo.
   - Gör så här:
     - Låt `bootstrap.php` först läsa miljövariabler (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).
     - **Endast lokalt** kan `config.php` användas (ignoreras när `.env` finns i Docker + Loopia).
   - På Loopia: sätt DB-uppgifterna via kontrollpanelen (`.user.ini` eller motsvarande) så de inte ligger i repo.

------

### Fas 3 – Färdigställ kontaktflödena

När soft delete och API-ytan är stabil:

1. **Kontakthubben** (ContactHubModal):
   - Säkerställ att:
     - GET `/api/contacts.php?association_id=...` hämtar alla icke-soft-deleted kontakter för föreningen.
     - POST/PUT/DELETE i modalen går mot rätt endpoint och uppdaterar listorna efter svar.
2. **Primär kontakt**:
   - `handle_create_contact()` nollställer `isPrimary` på övriga kontakter för samma `associationId` om `isPrimary` är true.
   - Verifiera detta flöde genom:
     - Skapa flera kontakter, markera olika som primär,
     - Kontrollera i DB att exakt en har `isPrimary = 1` per förening (eller 0 om ingen ska vara primär).
3. **Health-check**:
   - `api/health_contacts.php` används för att testa att det går att läsa/skriva mot Contact.
   - Kör den som en del av deployment-checklistan för Loopia.

------

### Fas 4 – AI-tjänster enligt dokumentationen

Här utgår jag från befintlig design i:

- `docs/TAGS_IMPLEMENTATION_PLAN.md`
- `scripts/populate_tags_v2.php`
- `api/lib/tag_generation_logger.php`
- `api/contact_social_lookup.php`
- `docs/OLLAMA_API_DOCUMENTATION.md` m.fl.

#### 4.1 AI-driven tagg-generering

**Mål:** Ta föreningsdata (namn, beskrivning, kategori, mm), skicka till AI, få tillbaka lista med taggar, spara i `Tag` + relations-tabell.

**Steg:**

1. **Databastabeller** (om de inte redan finns, enligt TAGS-planen):
   - `Tag` (id, name, color, createdAt, updatedAt, …).
   - `AssociationTag` (associationId, tagId, källa, etc.).
   - Logg/queue-tabeller för taggeneration (`tag_generation_log`, `tag_generation_job` eller liknande – finns beskrivet i `scripts/populate_tags_v2.php`).
2. **Server-side worker (Docker)**:
   - Körs i Docker-miljön, inte på Loopia.
   - Läser batchar från “todo”-tabellen (t.ex. föreningar utan AI-taggar eller med gammal version).
   - Använder `docs/OLLAMA_API_DOCUMENTATION.md` för att ringa Ollama (`gpt-oss:20b` eller motsvarande embed/LLM) och generera taggar.
   - Normaliserar taggar (lowercase, trim, dedup) och **upsert:ar** i DB.
   - Loggar allt via `TagGenerationLogger` så du kan följa upp per job.
3. **Koppling till UI**:
   - I föreningsvyn: visa AI-taggarna som vanliga taggar, men markera gärna källa (AI vs manuella).
   - Lägg ev. en knapp “Regenerera taggar” som bara lägger ett nytt jobb i kön – själva AI-anropet görs i Docker-workern.

#### 4.2 AI-driven kontakt-enrichment (social lookup)

Du har redan endpointen:

- `api/contact_social_lookup.php`:
  - POST: tar `contact_id`, slår upp contact+association+kommun i DB.
  - Skriver ett payload till logg/kö för senare AI-processning.

För att göra detta “på riktigt”:

1. **Definiera kö-tabell** om det inte redan finns:
   - `contact_enrichment_job` med fält:
     - id, contactId, status (PENDING/RUNNING/DONE/FAILED),
     - payload (JSON med namn, association, kommunenamn, email, telefon),
     - provider (`ollama`, `openai`, etc.), timestamps.
2. **Skapa worker i Docker**:
   - Läser `PENDING`-jobb, ropar Ollama/LLM med prompt “hitta LinkedIn/Facebook/Twitter baserat på detta”.
   - Parsar svar → uppdaterar `Contact.linkedinUrl`, `facebookUrl`, etc.
   - Sätter jobbstatus `DONE` eller `FAILED` + logg.
3. **UI**:
   - I ContactHubModal: lägg en “Hämta sociala profiler”-knapp som:
     - POST:ar mot `/api/contact_social_lookup.php`,
     - visar “jobb är köat”,
     - vid reload/hämta kontakt visas enriched-fält om jobben är klara.

#### 4.3 AI-funktioner för kvitto/FirstCard/systemet i övrigt

De kvitto/FirstCard-flödena du pratat om i andra trådar (AI-pipeline med AI1–AI7) är i en **separat del av systemet (Mind2)**, men principen är samma:

- All AI-logik körs i Docker/serversidan.
- Loopia/CRM pratar bara med DB/enkla APIs (ingen direkt AI-körning från Loopia).
- Viktigt: soft delete måste respekteras även där (AI ska jobba på aktuella, ej soft-deleted föreningar/kontakter).

------

## 5. Sammanfattning

**Direktkopplat till ditt problem “kan inte lägga till kontakter”:**

- Fokusera först på:
  - Att Loopia-DB:s `Contact`-schema matchar `schema.prisma` (inkl. `deletedAt`).
  - Att `handle_create_contact()` i `api/contacts.php` kan köra sitt `INSERT` utan SQL-fel.
- När det är fixat, går du vidare med:

1. **Standardisera soft delete**:
   - Association: `deletedAt` som sanning, `isDeleted` derived.
   - Contact: endast `deletedAt`.
2. **Städa API/deploy**:
   - En enda sann `/api/`-mapp för Loopia.
   - DB-credentials ur koden, in i miljövariabler.
3. **Implementera AI-tjänster** enligt redan påbörjad design:
   - Tagg-worker i Docker (läser från DB, använder Ollama/API, skriver taggar).
   - Kontakt-enrichment-worker (social lookup) kopplad till `contact_social_lookup.php`.

När du vill ta nästa steg kan vi gå ned på filnivå (t.ex. skriva om hela `api/contacts.php` eller workers) enligt dina kodregler – men jag ville först ge den här helhetsbilden och en tydlig prioriteringslista.