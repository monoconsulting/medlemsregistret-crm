Kort version: 500-felet kommer inte från frontend utan från SQL-fel i `api/contacts.php` eftersom tabellen `Contact` i databasen *inte* matchar det som koden tror att den gör. Framför allt saknas kolumnen `deletedAt` i databasen, men koden använder den i alla SELECT/INSERT/UPDATE – vilket ger 500 på Loopia.

Jag går igenom:

1. **Vad jag faktiskt hittade (konkreta fel)**
2. **Varför det ger just 500 på `/api/contacts.php`**
3. **En steg-för-steg-plan för att lösa det här permanent**

---

## 1. Konkreta fynd i kod + databas

### 1.1 `api/contacts.php` – hur endpointen funkar

I `api/contacts.php` görs följande i toppen:

```php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
  if ($method === 'GET') {
    handle_list_contacts();
  } elseif ($method === 'POST') {
    handle_create_contact();
  } elseif ($method === 'PUT') {
    handle_update_contact();
  } elseif ($method === 'DELETE') {
    handle_delete_contact();
  } else {
    json_out(405, ['error' => 'Method not allowed']);
  }
} catch (mysqli_sql_exception $e) {
  log_event('api', 'contacts.sql_error', [
    'code' => $e->getCode(),
    'message' => $e->getMessage(),
  ]);
  json_out(500, ['error' => 'Database query failed.']);
}
```

Viktigt:

* `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);` gör att *alla* SQL-fel kastar `mysqli_sql_exception`.
* De fångas i `catch` och svarar med **HTTP 500** + JSON `{ "error": "Database query failed." }`.

Sedan i `handle_list_contacts()`:

* Om `association_id` finns: SELECT mot `Contact` filtrerat på förening.
* Annars: “global” lista med sök, pagination, sortering.

Och *överallt* i den här filen bygger man queries som använder soft-delete via kolumnen `deletedAt`:

Exempel:

```php
// När du hämtar kontakter för en förening:
$sql = "SELECT
          c.id,
          c.associationId,
          ...
          c.isPrimary AS is_primary,
          c.createdAt AS created_at,
          c.updatedAt AS updated_at,
          c.deletedAt AS deleted_at,
          ...
        FROM Contact c
        LEFT JOIN Association a ON c.associationId = a.id
        LEFT JOIN Municipality m ON a.municipalityId = m.id
        WHERE c.associationId = ?
          AND (c.deletedAt IS NULL)
        ORDER BY c.isPrimary DESC, c.createdAt ASC";
```

Vid sök / global lista:

```php
$countSQL = "SELECT COUNT(*) as total
             FROM Contact c
             ...
             WHERE c.deletedAt IS NULL
               AND (... massa LIKE-villkor ...)";

...
$sql = "SELECT
          c.id,
          ...
          c.deletedAt,
          ...
        FROM Contact c
        ...
        WHERE c.deletedAt IS NULL
        ORDER BY {$orderBy}
        LIMIT ? OFFSET ?";
```

Vid DELETE:

```php
$stmt = db()->prepare(
  'UPDATE Contact SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL'
);
```

Vid INSERT:

```php
$sql = "INSERT INTO Contact (
          id,
          associationId,
          name,
          ...
          instagramUrl,
          isPrimary,
          createdAt,
          updatedAt,
          deletedAt
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL
        )";
```

**Slutsats:** PHP-koden är byggd för att Contact ska ha **soft delete** via kolumnen `deletedAt`.

---

### 1.2 Databasen – tabellen `Contact` saknar `deletedAt`

Ur `database_backup.sql`:

```sql
CREATE TABLE `Contact` (
  `id` varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `role` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `mobile` varchar(191) DEFAULT NULL,
  `linkedinUrl` varchar(191) DEFAULT NULL,
  `facebookUrl` varchar(191) DEFAULT NULL,
  `twitterUrl` varchar(191) DEFAULT NULL,
  `instagramUrl` varchar(191) DEFAULT NULL,
  `isPrimary` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Contact_associationId_idx` (`associationId`),
  KEY `Contact_email_idx` (`email`),
  CONSTRAINT `Contact_associationId_fkey` FOREIGN KEY (`associationId`) ...
);
```

Det finns **ingen** kolumn `deletedAt` här.

Jag har också letat efter `ALTER TABLE Contact ... deletedAt` i dumpen – det finns inte, så någon migrationsfil för soft delete på `Contact` har aldrig körts mot den här DB:n.

---

### 1.3 Prisma-modellen `Contact` saknar också `deletedAt`

I `crm-app/prisma/schema.prisma`:

```prisma
model Contact {
  id            String      @id @default(cuid())
  associationId String
  name          String?
  role          String?
  email         String?
  phone         String?
  mobile        String?
  linkedinUrl   String?
  facebookUrl   String?
  twitterUrl    String?
  instagramUrl  String?
  isPrimary     Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  association   Association @relation(fields: [associationId], references: [id], onDelete: Cascade)

  @@index([associationId])
  @@index([email])
}
```

Även här ingen `deletedAt`.

Så:

* **PHP API** tror: `Contact` har `deletedAt`.
* **DB**: `Contact` har **inte** `deletedAt`.
* **Prisma**: vet ingenting om `deletedAt`.

Det är exakt den sortens schema-glapp som ger 500-fel så fort frontend försöker lista alla kontakter.

---

### 1.4 Varför det blir HTTP 500 på `/api/contacts.php?page=1&pageSize=100&sort=name_asc`

När din frontend (via `crm-app/lib/api.ts`) kör:

```ts
return jsonFetch(`/api/contacts.php?${params.toString()}`, { method: 'GET' });
```

så händer följande:

1. `contacts.php` går in i `handle_list_contacts()`.
2. `require_auth()` går bra (annars hade du fått 401, inte 500).
3. `handle_list_contacts()` gör en SELECT som innehåller `c.deletedAt`.
4. MySQL svarar med något i stil med
   **“Unknown column 'c.deletedAt' in 'field list'”** eller liknande.
5. På grund av `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT)` kastas en `mysqli_sql_exception`.
6. `catch` i toppen av filen fångar den och svarar med:

   ```php
   json_out(500, ['error' => 'Database query failed.']);
   ```
7. I devtools ser du bara **HTTP 500** för `contacts.php`.

Att favicon (`/favicon.ico`) och `settings.txt` ger 404 är kosmetiskt – det är inte orsaken till att kontakter inte laddas.

---

## 2. DB-konfiguration (webhotellet vs lokalt)

I `api/bootstrap.php`:

* DB tas först från `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` (env).
* Om de saknas och `api/config.php` finns så läses värden därifrån.

`api/config.php` i backupen:

```php
return [
  'DB_HOST' => 'mysql513.loopia.se',
  'DB_NAME' => 'medlemsregistret_se_db_4',
  'DB_USER' => 'walla3jk@m383902',
  'DB_PASS' => 'Banjo192652',
];
```

Så på Loopia:

* Om du **inte** har satt DB-env i Apache/PHP så kommer API:t att använda **just denna** Loopia-databas.
* Det är i linje med det du skriver: “Vi använder ENDAST webhotellets databas även om det ligger kvar en lokalt.”

Med andra ord: 500-felet beror inte på att den “råkar” prata med fel DB – det beror på att **schemat på webhotellets DB är gammalt / ofullständigt jämfört med API-koden**.

---

## 3. Plan för att lösa problemet – både akut och “för gott”

### Steg 0 – Bekräfta felet (engångscheck)

1. Öppna `https://crm.medlemsregistret.se/api/contacts.php?page=1&pageSize=1` direkt i en flik.
2. Kolla response-body (inte bara statuskoden):

   * Om du ser `{ "error": "Database query failed." }` har vi bekräftat att det är exakt den `catch` vi hittade.
3. Aktivera PHP-errorlogg på Loopia (om du inte redan gjort det) så att du kan se MySQL-felet:

   * antingen via `.user.ini` eller den `php error log` vi pratade om i en annan tråd.
   * där ska du då få ett tydligt SQL-fel för `deletedAt`.

(Vi *vet* redan vad felet är utifrån backupen, men det här steget är bra för tryggheten.)

---

### Steg 1 – Akutfix: Synka schema för `Contact` med API:t

**Mål:** Lägg till `deletedAt` i tabellen `Contact` i Loopia-DB:n.

1. **Ta backup**

   * Exportera *hela* databasen via Adminer/PhpMyAdmin (du har redan `database_backup.sql` men ta en ny innan ändring).

2. **Kör följande SQL mot Loopia-DB:n:**

```sql
ALTER TABLE `Contact`
  ADD COLUMN `deletedAt` datetime(3) NULL AFTER `updatedAt`;
```

Det räcker för att:

* SELECT med `c.deletedAt` ska fungera.
* WHERE `c.deletedAt IS NULL` ska fungera.
* INSERT/UPDATE mot `deletedAt` ska fungera.

3. **Verifikation:**

   * Kör:

     ```sql
     DESCRIBE `Contact`;
     ```

     och verifiera att `deletedAt` nu finns.

   * Ladda om `https://crm.medlemsregistret.se/app/contacts` i frontend.

     * Förväntat: 500 på `/api/contacts.php` försvinner.
     * Du får en lista med kontakter (eller tom lista) – men inga hårda fel.

---

### Steg 2 – Permanent lösning: Synka kod, Prisma och DB så de inte glider isär

Just nu har vi:

* PHP API: **HAR** soft delete på Contact (deletedAt).
* Prisma schema: **HAR INTE** deletedAt.
* Loopia DB: kommer du precis ha uppdaterat med `deletedAt`.

För att det inte ska bli kaos nästa gång någon kör `prisma migrate` eller gör ändringar:

1. **Uppdatera Prisma-modellen `Contact`**

   Lägg till `deletedAt` i `crm-app/prisma/schema.prisma`:

   ```prisma
   model Contact {
     id            String      @id @default(cuid())
     associationId String
     name          String?
     role          String?
     email         String?
     phone         String?
     mobile        String?
     linkedinUrl   String?
     facebookUrl   String?
     twitterUrl    String?
     instagramUrl  String?
     isPrimary     Boolean     @default(false)
     createdAt     DateTime    @default(now())
     updatedAt     DateTime    @updatedAt
     deletedAt     DateTime?   // <-- lägg till denna

     association   Association @relation(fields: [associationId], references: [id], onDelete: Cascade)

     @@index([associationId])
     @@index([email])
   }
   ```

2. **Skapa en migration för Contact-soft delete (för Docker-miljön)**

   Antingen låter du Prisma generera det, eller så lägger du till en migrationsfil i samma stil som `add_user_soft_delete.sql`, t.ex.:

   `crm-app/prisma/migrations/2025xxxx_add_contact_soft_delete/migration.sql`:

   ```sql
   ALTER TABLE `Contact` ADD COLUMN `deletedAt` DATETIME(3) NULL;
   ```

   Poängen är att:

   * Docker-miljön får samma kolumn.
   * Nästa gång du kör prisma-migrations lokalt så försöker den inte *ta bort* `deletedAt` igen.

3. **Synka mot Loopia:**

   * Du har redan manuellt lagt till kolumnen på Loopia.
   * Prisma kommer därför “tycka” att migrationen redan är applicerad (ev. behöver du köra `prisma migrate deploy` mot Loopia-DB om du använder det flödet).

---

### Steg 3 – Hårdgör kontakthanteringen (framtidssäkring)

När schemat väl är rätt är det läge att täta runt själva kontaktsystemet så du slipper “mystiska” 500-fel framöver.

**Förslag:**

1. **Inför en enkel API-healthcheck för Contact**

   * En minimal PHP-fil, t.ex. `api/health_contacts.php`, som gör:

     * `SELECT COUNT(*) FROM Contact LIMIT 1`
     * Returnerar `{ "status": "ok" }` eller ett tydligt fel.
   * Då kan du snabbt se om Loopia-DB och API:t är i synk efter deploy.

2. **Striktare felmeddelanden i frontend**

   * I `crm-app/lib/api.ts` kan du vid 500 på `/api/contacts.php` visa:

     * “Fel vid kontaktlistning – troligen databas-schema. Kontakta admin.” (för internt bruk).
   * Just nu ser det bara ut som “något gick fel” ur användarperspektiv.

3. **Deploy-checklista för Loopia**
   Lägg in i din dokumentation (eller som script):

   * Steg 1: Kör migrations mot Loopia-DB (eller verifiera att de är applicerade).
   * Steg 2: Kör exporten av React-fronten och packa upp.
   * Steg 3: Kör `health_contacts.php` och ev. andra health-scripts.
   * Steg 4: Snabb manuell test:

     * Öppna `/app/contacts`, sök, klicka in en kontakt, öppna Contact-hub-modalen.

---

### Steg 4 – Rensa upp gamla lokala DB-spår (utan att röra din kodfunktionalitet)

Du skrev:

> Vi använder ENDAST webhotellets databas även om det ligger kvar en lokalt.

För att minska risken att man någon gång “råkar” jobba mot fel DB:

* Säkerställ att:

  * `api/config.php` i **deploy-paketet** pekar på Loopia (som det gör nu).
  * Ev. lokala test-config (`temp/local_webroot/api/config.php`) **inte** följer med i Loopia-paketet (eller åtminstone inte används där).

Det här är mer “hygien” än akut problem, men det minskar förvirringen.

---

## 4. Sammanfattning i klarspråk

**Direkt orsak till eländet:**

* Kod för kontakthantering (`api/contacts.php`) är byggd för soft delete med kolumnen `deletedAt` i tabellen `Contact`.
* Din Loopia-databas (och Prisma-schema) saknar den kolumnen.
* Alla SELECT/INSERT/UPDATE som nämner `deletedAt` kastar SQL-fel → PHP returnerar HTTP 500.

**Akut fix:**

* Lägg till `deletedAt` i `Contact` på Loopia med en enkel `ALTER TABLE`.
* Testa om kontaktsidan börjar fungera.

**Permanent fix:**

* Uppdatera Prisma-modellen `Contact` så att den också har `deletedAt`.
* Lägg till en migration för Contact-soft delete (liknande de du har för `User`/`Group`).
* Se till att migrations körs både i Docker-miljön och (direkt eller indirekt) mot Loopia-DB.
* Lägg till healthcheck + enkel deploy-checklista för Loopia så du snabbt ser om något schema glidit igen.


Bra, då kör vi det här ordentligt.

Jag gör två saker nu:

1. Tar fram **en konkret migrationsfil** för `Contact` soft delete (så 500-felet försvinner).
2. Går igenom **ContactHubModal + ContactTable + kontaktsidan** så du ser exakt hur flödet hänger ihop – och att det stödjer din vision med en global kontaktlista + huvudmodal.

---

## 1. Migrationsfil för `Contact` soft delete

### 1.1. Fil- och mappstruktur

Lägg till en ny migrationsmapp under:

`crm-app/prisma/migrations/`

Förslagsvis:

`crm-app/prisma/migrations/20251117144500_add_contact_soft_delete/`

I den mappen skapar du filen:

`crm-app/prisma/migrations/20251117144500_add_contact_soft_delete/migration.sql`

### 1.2. Innehåll i `migration.sql`

```sql
-- AlterTable
-- Add soft delete column for Contact to align with contacts.php API expectations
ALTER TABLE `Contact`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;
```

Det är allt som behövs för att:

* `contacts.php` ska kunna:

  * SELECT … `c.deletedAt AS deleted_at`
  * använda `WHERE c.deletedAt IS NULL`
  * uppdatera `deletedAt` i DELETE-handlern
* `getAllContacts` och `getContacts` ska sluta kasta SQL-fel → inga fler 500 på `/api/contacts.php?...`.

### 1.3. Hur du använder migrationen

**På Loopia (prod / webhotellet):**

1. Ta backup (SQL-dump) innan ändring.

2. Kör motsvarande `ALTER TABLE` mot Loopia-DB:n via Adminer / phpMyAdmin:

   ```sql
   ALTER TABLE `Contact`
     ADD COLUMN `deletedAt` DATETIME(3) NULL;
   ```

3. Verifiera:

   ```sql
   DESCRIBE `Contact`;
   ```

   Du ska se `deletedAt` som sista kolumnen.

4. Ladda om sidan **Kontakter** (`/app/contacts`):

   * 500 på `/api/contacts.php?page=1...` ska vara borta.
   * Global kontaktlista ska laddas.

**Lokalt / Docker:**

* Lägg in migrationsmappen enligt ovan.
* Kör dina vanliga Prisma-migrationskommandon (t.ex. `prisma migrate deploy` mot lokala DB:n) så att lokalt schema matchar Loopia.

> Notis: I `schema.prisma` ligger redan `Contact` utan `deletedAt`. När du känner att det är läge att snygga upp även den biten så behöver Contact-modellen kompletteras med `deletedAt DateTime?`, men jag låter den filen vara orörd nu eftersom du bad specifikt om migrationsfilen.

---

## 2. Genomgång: ContactHubModal + ContactTable (och kontaktsidan)

Målet du beskrev:

* **Global lista** över alla kontakter under menyvalet **Kontakter**.
* Klick på en rad → öppna **huvudmodalen för kontakter** där all detaljhantering sker (inkl. AI på sikt).

Det finns redan ett ganska snyggt flöde för detta i tre lager:

1. `crm-app/app/contacts/page.tsx` – **global kontaktsida**
2. `crm-app/components/contacts/contact-table.tsx` – **själva tabellen/listan**
3. `crm-app/components/modals/contact-hub-modal.tsx` – **huvudmodalen (ContactHub)**

### 2.1. Global kontaktsida: `crm-app/app/contacts/page.tsx`

**Roll:** “Orkestreraren” som:

* Hämtar alla kontakter via `api.getAllContacts(...)`.
* Hanterar sök, sortering, pagination.
* Äger state för **ContactHubModal** (vilken association och vilken kontakt som ska vara aktiv).

Nyckelbitar:

* State:

  ```ts
  const [contacts, setContacts] = useState<ContactListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState("name_asc")

  const [contactHubOpen, setContactHubOpen] = useState(false)
  const [contactHubAssociation, setContactHubAssociation] = useState<ContactHubAssociationSummary | null>(null)
  const [contactHubContactId, setContactHubContactId] = useState<string | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  ```

* **Laddning av kontakter** (globalt):

  ```ts
  const loadContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getAllContacts({ q: search, page, pageSize, sort })
      setContacts(res.items)
      setTotal(res.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta kontakter"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, sort, toast])
  ```

  Detta är exakt den XHR du såg:

  > `/api/contacts.php?page=1&pageSize=100&sort=name_asc`

  När `deletedAt` saknas i DB small det – efter migrationen ska den här börja svara normalt.

* **Öppna ContactHub från en rad**:

  ```ts
  const openContactHub = (contact: ContactListItem) => {
    if (!contact.association_id) return
    setContactHubAssociation({
      id: contact.association_id,
      name: contact.association_name || "Okänd förening",
      municipalityName: contact.municipality_name,
      streetAddress: contact.association_street_address ?? null,
      postalCode: contact.association_postal_code ?? null,
      city: contact.association_city ?? null,
    })
    setContactHubContactId(contact.id)
    setContactHubOpen(true)
  }
  ```

  Här binds raden i global kontaktlista ihop med:

  * **Association-summary** (id, namn, adress, kommun).
  * **Kontaktens id** (så hubben vet vilken kontakt som ska vara aktiv först).

* **ContactTable-anropet**:

  ```tsx
  <ContactTable
    contacts={contacts}
    sort={sort}
    onSortChange={handleSortChange}
    onRowClick={(contact) => openContactHub(contact)}
    selectedIds={selectedContacts}
    onToggleContact={toggleContactSelection}
    onToggleAll={toggleSelectAll}
    headerCheckboxState={headerCheckboxState}
    actionsRenderer={(contact) => (
      <>
        <Button
          variant="ghost"
          size="sm"
          title="Öppna kontaktmodal"
          onClick={() => openContactHub(contact)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteContact(contact.id)}
          title="Radera kontakt"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </>
    )}
  />
  ```

  * Klick på **hela raden** → `onRowClick` → `openContactHub`.
  * Klick på **pennknappen** i actions-kolumnen → samma sak.
  * Rader kan samtidigt väljas med checkbox (för bulkoperationer).

* **ContactHubModal instans** längst ner:

  ```tsx
  <ContactHubModal
    association={contactHubAssociation}
    open={contactHubOpen}
    selectedContactId={contactHubContactId}
    onOpenChange={(open) => {
      setContactHubOpen(open)
      if (!open) {
        setContactHubAssociation(null)
        setContactHubContactId(null)
      }
    }}
    onUpdated={() => {
      void loadContacts()
    }}
  />
  ```

  Det betyder:

  * Hubben öppnas ovanpå globala sidan.
  * När du stänger hubben rensas association + kontakt-id.
  * När hubben utför en ändring och kallar `onUpdated` så laddas **hela globala listan** om – så ContactPage alltid speglar senaste läget.

**Slutsats:** Den här sidan gör precis din “globala kontaktlista med huvudmodal”-idé, backend-felen var det som stoppade den.

---

### 2.2. ContactTable: `crm-app/components/contacts/contact-table.tsx`

**Roll:** Ren presentational komponent för listning, sortering, val och actions för en lista av `ContactListItem`.

Nyckelpunkter:

* **Props:**

  ```ts
  export type ContactTableSortKey =
    | "name"
    | "association"
    | "municipality"
    | "primary"
    | "address"
    | "phone"
    | "email"
    | "facebook"
    | "instagram"
    | "twitter"

  interface ContactTableProps {
    contacts: ContactListItem[]
    sort: string
    onSortChange: (column: ContactTableSortKey) => void
    onRowClick?: (contact: ContactListItem) => void
    selectedIds?: Set<string>
    onToggleContact?: (contactId: string, checked: boolean) => void
    onToggleAll?: (checked: boolean) => void
    headerCheckboxState?: boolean | "indeterminate"
    actionsRenderer?: (contact: ContactListItem) => React.ReactNode
    emptyMessage?: string
  }
  ```

* **SortableHeader** bygger enkel sort-ikon baserat på `sort`-strängen (`name_asc`, `name_desc` osv) och kallar `onSort(column)`.

* **Tabellhuvud:**

  * Kolumner: Namn, Förening, Kommun, Primär kontakt, Adress, Telefon, E-post, Facebook, Instagram, Twitter, Åtgärder.
  * Checkbox för “markera alla” om `selectedIds` är definierad.

* **Rad-rendering:**

  ```tsx
  <TableRow
    key={contact.id}
    className={cn("hover:bg-gray-50 transition-colors", onRowClick && "cursor-pointer")}
    onClick={() => onRowClick?.(contact)}
  >
    {showSelection ? (
      <TableCell className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onToggleContact?.(contact.id, Boolean(checked))}
          aria-label={`Markera ${contact.name ?? "okänd kontakt"}`}
        />
      </TableCell>
    ) : null}
    ...
  </TableRow>
  ```

  * Hela raden är klickbar → `onRowClick(contact)` (öppnar hubben när det används på kontaktsidan).
  * Klick på checkbox-cellen **stoppar event propagation**, så du kan markera rader utan att samtidigt öppna hubben.

* **Innehåll per rad:**

  * Namn + roll med ikon.

  * Föreningsnamn (`contact.association_name`).

  * Kommun (`contact.municipality_name`).

  * Primär-kolumn använder `contact.is_primary`:

    ```tsx
    {contact.is_primary ? (
      <Badge variant="secondary">Ja</Badge>
    ) : (
      <span className="text-sm text-gray-500">Nej</span>
    )}
    ```

    > Liten detalj: global-list-SELECT:en aliasar inte `c.isPrimary` som `is_primary`, så i just det svaret heter fältet `isPrimary` i JSON. Det ger inte 500 – men innebär att `is_primary` blir `undefined` och alla visas som “Nej” i globala listan. Det är mer ett UX-kosmetikproblem än en blockerande bugg, nästa steg efter DB-fix är att justera alias i `contacts.php` för global-list, om du vill ha exakt flagga där också.

  * Adress (prebyggt i backend / hub).

  * Telefon / E-post med ikoner.

  * Sociala länkar via `ExternalSocialLink` (öppnar i ny flik).

  * Actions-kolumn där parent-komponenten (t.ex. ContactsPage) kan injicera knappar (pennan + trash).

* **Tom-lista-hantering:**

  Om `contacts.length === 0` visar den en rad med `emptyMessage` (default: “Inga kontakter tillgängliga.”).

**Slutsats:** ContactTable är ren och gör exakt det du behöver för en global lista. 500-felet kommer inte härifrån, utan enbart från att backend-SELECT:en small på `deletedAt` i DB.

---

### 2.3. ContactHubModal: `crm-app/components/modals/contact-hub-modal.tsx`

**Roll:** “Huvudmodalen” du beskrev – all kontaktadministration för en förening: lista kontakter, välja aktiv kontakt, se detaljer, anteckningar, AI-funktioner, etc.

Nyckelbitar:

* **Props:**

  ```ts
  export interface ContactHubAssociationSummary {
    id: string
    name: string
    municipalityName?: string | null
    streetAddress?: string | null
    postalCode?: string | null
    city?: string | null
  }

  interface ContactHubModalProps {
    association: ContactHubAssociationSummary | null
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedContactId?: string | null
    onUpdated?: () => void
  }
  ```

* **State:**

  * `contacts` – alla kontakter för vald förening.
  * `loading`, `error` – laddstatus för kontakter.
  * `sort` – sortordning för listan inne i hubben.
  * `activeContactId` – vilken kontakt som är vald i hubben.
  * `notes`, `notesLoading`, `noteContent`, `noteSubmitting` – anteckningshantering.
  * `aiLoading` – för AI-frågor (kommande).
  * `addModalOpen`, `editContact`, `sendEmailContact` – under-modaler (lägg till, editera, skicka mail).
  * `deletingId` – id på kontakt som håller på att raderas.

* **Laddning av kontakter för en förening:**

  ```ts
  const loadContacts = useCallback(async () => {
    if (!association) return
    setLoading(true)
    setError(null)
    try {
      const raw = await api.getContacts(association.id)
      const enriched: ContactListItem[] = raw.map((item) => ({
        ...item,
        association_name: association.name,
        association_street_address: association.streetAddress ?? item.association_street_address ?? null,
        association_postal_code: association.postalCode ?? item.association_postal_code ?? null,
        association_city: association.city ?? item.association_city ?? null,
        association_address: buildFullAddress(
          association.streetAddress ?? item.association_street_address ?? null,
          association.postalCode ?? item.association_postal_code ?? null,
          association.city ?? item.association_city ?? null,
        ),
        municipality_name: association.municipalityName ?? item.municipality_name ?? null,
      }))
      setContacts(enriched)
      if (enriched.length) {
        setActiveContactId((prev) => prev ?? enriched[0].id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta kontakter"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [association, toast])
  ```

  Här:

  * Anropet går mot `/api/contacts.php?association_id=...`.
  * Det är denna branch i `contacts.php` som använder `c.deletedAt AS deleted_at` och *redan* aliasar `isPrimary AS is_primary`.
  * Eftersom SELECT:en också vill läsa `deletedAt` behövs kolumnen i DB – samma migrationsfix.

* **Sortering i hubben:**

  * Hubben har egen `sort` (samma sort-keys som ContactTable).
  * `sortedContacts` sorterar helt i minnet (ingen extra nätverksfråga).

* **Aktiv kontakt:**

  * `activeContact` plockas från `sortedContacts` + `activeContactId` (om satt, annars första kontakt).

* **Effekter:**

  * När modalen öppnas (`open === true`) och `association` finns → `loadContacts()` triggas.
  * Om `selectedContactId` skickas in (från globala listan) kan du styra vilken kontakt som ska vara aktiv först.

* **UI-innehåll:**

  * Vänster: ContactTable (samma komponent, fast en annan instans) med sortering, klick för att välja aktiv kontakt, actions-knappar för redigering / ta bort inne i föreningen.
  * Mitten: detaljkort för aktiv kontakt (namn, roll, e-post, telefon, sociala länkar).
  * Höger: anteckningspanel för vald kontakt (lista + formulär för ny anteckning).
  * Knapp för att trigga AI-analys (eller motsv.) finns förberedd.

* **onUpdated:** När du lägger till / ändrar / tar bort en kontakt inne i hubben:

  * Hubben uppdaterar sina egna `contacts`.
  * Vid ändringar som påverkar globala listan kan den dessutom kalla `onUpdated()` → då laddar **globala kontaktsidan** om sina data.

**Slutsats:** ContactHubModal är redan central nav för all kontaktlogik på föreningsnivå, och är korrekt kopplad både från globala kontaktsidan och mot API:t. Den blockerande biten är – igen – att DB-schemat saknade `deletedAt`.

---

## 3. Vad du praktiskt gör nu

1. **Lägg in migrationen** (eller kör motsvarande `ALTER TABLE` på Loopia).
2. **Verifiera:**

   * `/api/contacts.php?page=1&pageSize=100&sort=name_asc` → svarar med JSON (items/total/…) istället för 500.
   * `/app/contacts` laddar utan fel.
3. **Testflöde:**

   * Gå till **Kontakter**.
   * Scrolla listan, testa sortering.
   * Klicka på en rad → ContactHubModal ska öppnas med korrekt föreningsinfo och kontaktlista.
   * Testa edit / delete / anteckningar i hubben → stäng → se att globala listan uppdateras.

När du vill ta nästa steg kan vi:

* Justera den lilla alias-buggen för `isPrimary` i global-list-SELECT:en (så “Primär kontakt” blir korrekt även där).
* Dra igenom `contacts.php` med samma “soft delete”-tänk som `User`/`Group` (om du vill ha en helt konsekvent modell).
