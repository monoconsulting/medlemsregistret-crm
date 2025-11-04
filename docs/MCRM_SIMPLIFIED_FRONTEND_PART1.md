# 1) Vad som finns idag (relevant för målet)

- **Frontend:** Next.js (app router) i `crm-app/` med UI för föreningar, filter, taggar, anteckningar m.m. Klienten skickar anrop via en tRPC-klient och förväntar sig en CSRF-cookie.
- **Backend (ska bort):** Express + tRPC + Prisma mot MySQL, inloggning/sessions, CSRF, rutter för associations, notes, import m.m.
- **Databas:** MySQL/MariaDB-schema definierat via Prisma.
- **Övrigt (kan tas bort):** scraping, Playwright-tester, AI-widgets, Docker-compose, dev-skript, importverktyg.

Målet du beskriver: **en användare, redigera data, behålla sök & UI, köras på Loopia (MySQL + PHP)**. Det innebär att Node-servern ersätts med **mycket tunn PHP-API** på samma domän.

------

# 2) Målarkitektur (enkel och Loopia-vänlig)

**A. Frontend (oförändrat visuellt):**

- Behåll din Next.js-app och exportera den statiskt (eller bygg som vanliga Next-pages utan serverfunktioner).
- Byt datalagret: en liten klientmodul ersätter tRPC-anrop med `fetch()` mot **PHP-endpoints** på samma origin, t.ex. `/api/associations.php`.
- CSRF förenklas: PHP sätter en enkel CSRF-cookie på GET `/api/csrf.php`; klienten skickar den som header vid POST/PUT/DELETE.

**B. Minimal PHP-API (på Loopia):**

- **/api/login.php**  (POST: email+password) → skapar PHP-session och sätter `sid`. (En användare räcker.)
- **/api/logout.php** (POST) → avslutar session.
- **/api/csrf.php**   (GET) → sätter `csrf`-cookie, returnerar token (speglas i header från klient).
- **/api/associations.php**
  - GET: lista/sök/paginera (query-parametrar: `q`, `municipality`, `type`, `status`, `tags[]`, `page`, `pageSize`, `sort`).
  - POST: skapa (kräver inlogg + CSRF).
  - PUT/PATCH: uppdatera (id i body eller `?id=`).
  - DELETE: mjuk-radering (flagga).
- **/api/association_notes.php**
  - POST: lägg anteckning till förening.
  - GET: lista anteckningar per `associationId`.
- **/api/tags.php**
  - GET: lista taggar; POST: skapa tagg; relationsendpoints för att koppla taggar till föreningar.
- **/api/municipalities.php**
  - GET: lista (för filter/dropdowns).

> Allt körs **same-origin** → ingen CORS-strul. En enkel `require_auth()` + CSRF-kontroll skyddar POST/PUT/DELETE.

**C. Databas**

- Återanvänd dina tabeller i Loopia MariaDB (de delar du behöver: `Association`, rel. tabell för taggar, `Note`, `Municipality`, `User`).
- Lägg till **index** för snabba sökningar: t.ex. `name`, `municipality`, `type`, `status`, samt FULLTEXT på `name/description` om Loopia tillåter.

**D. Autentisering (singel-user)**

- En rad i `User` (e-post + bcrypt-hash) och PHP-session. Ingen extern OAuth. Inloggning från en enkel `/login`-ruta.

------

# 3) Vad vi tar bort (rensning för enkelhet)

- Hela **Node/Express/tRPC**-backend (server, middleware, csurf, trpc).
- Alla **scraping/import/Playwright**-skript och test-artefakter.
- **Docker/compose** för backend.
- **AI-assistant-widgetar** och allt som kräver tredjeparts-nycklar/server.
- Allt som rör **multi-user/roller**, e-postflöden, bakgrundsjobb.

> UI och sök-/filterpaneler är kvar, men deras datakällor pekar nu på PHP-API.

------

# 4) Minimal SQL (riktlinje)

*(Behåll dina befintliga tabeller om de redan finns; detta är en komprimerad riktning — ingen data fylls i.)*

- `associations` (id, name, municipality_id, type, status, email, phone, address, website, description, deleted_at, updated_at, created_at, …)
- `municipalities` (id, name, code, …)
- `tags` (id, name, …)
- `association_tags` (association_id, tag_id, unik kombination)
- `notes` (id, association_id, content, author, created_at)
- `users` (id, email unique, password_hash, created_at)

**Indexering (viktigt för fart på delat webbhotell):**

- `associations(name)`, `associations(municipality_id)`, `associations(type)`, `associations(status)`
- Ev. `FULLTEXT(name, description)` om möjligt.
- `association_tags(association_id)`, `association_tags(tag_id)`

------

# 5) Migreringsplan (steg-för-steg, kort och säker)

### Fas 0 – Backup & kontroll

1. **Backup DB** (dump via Loopia/skript).
2. **Backup web** (nuvarande frontend).
3. Dokumentera aktuell `schema.prisma` → jämför med faktiska tabeller i Loopia (vi använder de som behövs).

### Fas 1 – PHP-API på plats

1. Skapa `/api/` på Loopia med följande filer:
   - `bootstrap.php` (DB-anslutning via `mysqli`/PDO, `require_auth()`, CSRF-hjälp, JSON-svar).
   - `login.php`, `logout.php`, `csrf.php`.
   - `associations.php`, `association_notes.php`, `tags.php`, `municipalities.php`.
2. Lägg in **.htaccess** för att tvinga `application/json; charset=utf-8` och hindra listning.
3. Skapa **env-fil** (PHP-konstanta) med DB-host, user, db-name (ingen hemlis i repo).

### Fas 2 – Frontend → PHP-läge

1. I `crm-app/` skapa en liten modul `lib/api.ts` som ersätter tRPC:
   - `getAssociations(params)`, `updateAssociation(id, patch)`, `createAssociation(data)`, `deleteAssociation(id)`, `getTags()`, `addNote(associationId, content)`, `getMunicipalities()`, `login()`, `logout()`.
   - Alla metoder använder `fetch('/api/...')` och lägger till CSRF-headern från `csrf`-cookien (du har redan `lib/csrf.ts` – återanvänd).
2. Uppdatera sidor/komponenter som idag gör “tomma” `fetch()`-anrop till att anropa `lib/api.ts`.
   - **Behåll UI** oförändrat.
   - Rör inte styling/design; byt bara datalagret till den nya modulen.
3. **Ta bort tRPC-klienten** och allt som refererar till `@/server/*`.
4. **Bygg statiskt** (Next export) eller vanlig Next-build för statiskt innehåll, ladda upp till Loopia.

### Fas 3 – Index och prestanda

1. Lägg till de nämnda **indexen** på tabellerna (Loopia phpMyAdmin/Adminer).
2. Verifiera att vanliga sökfrågor (q + filter) svarar < ~300 ms.

### Fas 4 – Verifiering (checklista)

1. **Login** fungerar (sessioncookie sätts).
2. **CSRF**: GET `/api/csrf.php` sätter cookie; POST/PUT/DELETE fungerar endast om `X-CSRF-Token` skickas.
3. **Lista & filter** för föreningar: text-sök, kommun, typ, status, taggar.
4. **CRUD:** skapa/uppdatera/radera (mjuk) förening.
5. **Taggar:** lista, skapa, koppla/avkoppla.
6. **Anteckningar:** lägg till & lista per förening.
7. **Paginering & sortering** returnerar “total”, “page”, “pageSize” i JSON.
8. **Ingen CORS/CSRF-varning** i konsolen; 200-svar på alla vägar.

### Fas 5 – Städning

1. Ta bort/arkivera:

- `backend/` (Express/tRPC/Prisma), `compose.yml`, scraping & Playwright-mappar, AI-widgetkod.

1. Lämna kvar scripts som rör **backup** och **Loopia-deploy** om du använder dem.

------

# 6) Minimal PHP-logik (princip)

- **Autentisering:** `login.php` validerar e-post+lösen (bcrypt-hash i DB), sätter `$_SESSION['uid']`. `require_auth()` skyddar skrivande endpoints.
- **CSRF:** `csrf.php` genererar token, lagrar server-side (t.ex. i session) och skickar även i cookie `csrf`. Klienten lägger header `X-CSRF-Token`.
- **Sök:** konstruera WHERE från query-parametrar; whitelistade kolumner för sort; begränsad `pageSize` (t.ex. max 100) för att skydda delat webbhotell.
- **Mjuk radering:** `deleted_at` sätts; GET filtrerar bort där `deleted_at IS NOT NULL`.

------

# 7) Vad du behåller i UI (ingen ny design krävs)

- Hela associations-listan, filterfält, chip/taggar, anteckningspanelen, edit-drawer, sortering, paginering.
- “Alla kommuner”/“Föreningstyper”/“Taggar”-filter laddas från respektive endpoint.
- Eventuella AI-knappar kan **döljas** bakom en feature-flag (default OFF).

------

# 8) Risker & skydd

- **Loopia tidsgränser:** Håll queries lätta, indexera rätt, och paginera.
- **Säkerhet:** Same-origin, PHP-session, CSRF-skydd, strikt input-validering (server-side), parametriserade SQL-frågor.
- **Underhåll:** All logik ligger nu i en liten, överskådlig `/api/`-mapp.

------

Vill du att jag skriver **den kompletta `lib/api.ts` (frontend)** och **samtliga PHP-endpoints** som fullständiga filer (med Google-style Docstrings i kodkommentarer och utan att röra något annat än just detta), så levererar jag hela filerna på en gång i nästa steg.

------

# `crm-app/lib/api.ts`  *(ersätter tRPC-anrop med fetch → PHP-API)*

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @fileoverview Minimal client wrapper for the Loopia-compatible PHP API.
 * Replaces previous tRPC/Express calls with same-origin fetch requests.
 * All methods include Google-style docstrings and basic error handling.
 */

type AssocID = number;

export interface Pagination {
  page?: number;
  pageSize?: number;
  sort?: 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc';
}

export interface AssocFilters extends Pagination {
  q?: string;
  municipality?: string;
  type?: string;
  status?: string;
  tags?: string[]; // tag names or IDs (backend accepts both, see PHP)
}

export interface Association {
  id: AssocID;
  name: string;
  municipality_id: number | null;
  type: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Note {
  id: number;
  association_id: AssocID;
  content: string;
  author: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Municipality {
  id: number;
  name: string;
  code: string | null;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Reads the CSRF token from the `csrf` cookie.
 *
 * Returns:
 *   string | null: The CSRF token value if present, otherwise null.
 */
function getCsrfFromCookie(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Ensures CSRF cookie exists by calling the CSRF endpoint when missing.
 * This avoids 403 on first write request in a fresh session.
 *
 * Returns:
 *   Promise<void>
 */
async function ensureCsrf(): Promise<void> {
  if (getCsrfFromCookie()) return;
  const res = await fetch('/api/csrf.php', { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Failed to obtain CSRF: ${res.status}`);
  }
}

/**
 * Performs a JSON fetch to the given endpoint with optional body.
 *
 * Args:
 *   url: string - API path (same-origin), e.g., '/api/associations.php'
 *   options: RequestInit - fetch options (method, body, etc.)
 *   needsCsrf: boolean - whether to attach X-CSRF-Token header.
 *
 * Returns:
 *   Promise<any>: Parsed JSON response.
 */
async function jsonFetch(url: string, options: RequestInit = {}, needsCsrf = false): Promise<any> {
  const init: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(options.headers || {}),
    },
    ...options,
  };

  if (needsCsrf) {
    await ensureCsrf();
    const token = getCsrfFromCookie();
    if (!token) throw new Error('Missing CSRF token after ensureCsrf()');
    (init.headers as Record<string, string>)['X-CSRF-Token'] = token;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text for debugging
    throw new Error(`Invalid JSON from ${url}: ${text?.slice(0, 200)}`);
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  /**
   * Logs in the single user.
   *
   * Args:
   *   email: string - user email.
   *   password: string - user password (bcrypt-hashed on server).
   *
   * Returns:
   *   Promise<{ok: boolean}>: ok true if login succeeded.
   */
  async login(email: string, password: string): Promise<{ ok: boolean }> {
    const body = { email, password };
    return jsonFetch('/api/login.php', { method: 'POST', body: JSON.stringify(body) }, true);
  },

  /**
   * Logs out the current session.
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async logout(): Promise<{ ok: boolean }> {
    return jsonFetch('/api/logout.php', { method: 'POST', body: JSON.stringify({}) }, true);
  },

  /**
   * Fetches a paginated list of associations with filters.
   *
   * Args:
   *   filters: AssocFilters - search and filter parameters.
   *
   * Returns:
   *   Promise<ListResponse<Association>>
   */
  async getAssociations(filters: AssocFilters = {}): Promise<ListResponse<Association>> {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.municipality) params.set('municipality', filters.municipality);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.tags?.length) filters.tags.forEach(t => params.append('tags[]', t));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sort) params.set('sort', filters.sort);

    return jsonFetch(`/api/associations.php?${params.toString()}`, { method: 'GET' });
  },

  /**
   * Creates a new association.
   *
   * Args:
   *   data: Partial<Association> - fields to set at creation.
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async createAssociation(data: Partial<Association>): Promise<{ id: number }> {
    return jsonFetch('/api/associations.php', { method: 'POST', body: JSON.stringify(data) }, true);
  },

  /**
   * Updates an existing association by ID.
   *
   * Args:
   *   id: number - association ID
   *   patch: Partial<Association> - fields to update
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async updateAssociation(id: number, patch: Partial<Association>): Promise<{ ok: boolean }> {
    const body = { id, ...patch };
    return jsonFetch('/api/associations.php', { method: 'PUT', body: JSON.stringify(body) }, true);
  },

  /**
   * Soft-deletes an association (sets deleted_at).
   *
   * Args:
   *   id: number - association ID
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async deleteAssociation(id: number): Promise<{ ok: boolean }> {
    return jsonFetch(`/api/associations.php?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' }, true);
  },

  /**
   * Lists tags.
   *
   * Returns:
   *   Promise<Tag[]>
   */
  async getTags(): Promise<Tag[]> {
    const res = await jsonFetch('/api/tags.php', { method: 'GET' });
    return res.items as Tag[];
  },

  /**
   * Creates a tag.
   *
   * Args:
   *   name: string - tag name
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async createTag(name: string): Promise<{ id: number }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: JSON.stringify({ name }) }, true);
  },

  /**
   * Attaches a tag to an association.
   *
   * Args:
   *   associationId: number
   *   tagId: number
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async attachTag(associationId: number, tagId: number): Promise<{ ok: boolean }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: JSON.stringify({ action: 'attach', associationId, tagId }) }, true);
  },

  /**
   * Detaches a tag from an association.
   *
   * Args:
   *   associationId: number
   *   tagId: number
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async detachTag(associationId: number, tagId: number): Promise<{ ok: boolean }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: JSON.stringify({ action: 'detach', associationId, tagId }) }, true);
  },

  /**
   * Lists municipalities for filter dropdowns.
   *
   * Returns:
   *   Promise<Municipality[]>
   */
  async getMunicipalities(): Promise<Municipality[]> {
    const res = await jsonFetch('/api/municipalities.php', { method: 'GET' });
    return res.items as Municipality[];
  },

  /**
   * Lists notes for an association.
   *
   * Args:
   *   associationId: number
   *
   * Returns:
   *   Promise<Note[]>
   */
  async getNotes(associationId: number): Promise<Note[]> {
    const res = await jsonFetch(`/api/association_notes.php?association_id=${encodeURIComponent(String(associationId))}`, { method: 'GET' });
    return res.items as Note[];
  },

  /**
   * Adds a note to an association.
   *
   * Args:
   *   associationId: number
   *   content: string
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async addNote(associationId: number, content: string): Promise<{ id: number }> {
    return jsonFetch('/api/association_notes.php', { method: 'POST', body: JSON.stringify({ association_id: associationId, content }) }, true);
  },
};
```

------

# `/api/.htaccess`

```apache
# Security & JSON defaults for the API folder
Options -Indexes

<IfModule mod_headers.c>
  Header always set Content-Type "application/json; charset=utf-8"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# Deny direct access to helper files
<FilesMatch "^(bootstrap|README)\.php$">
  Require all denied
</FilesMatch>
```

------

# `/api/bootstrap.php`

```php
<?php
/**
 * Bootstrap: DB connection, session, CSRF, helpers.
 *
 * Environment:
 *   DB_HOST, DB_NAME, DB_USER, DB_PASS must be provided by hosting env.
 *
 * Security:
 *   - Same-origin only; session cookie is configured as HttpOnly, Secure (if HTTPS).
 *   - CSRF token stored in session; client sends X-CSRF-Token for write ops.
 *
 * @package API
 */

declare(strict_types=1);

// ---------- Headers ----------
header('Content-Type: application/json; charset=utf-8');

// ---------- Session settings ----------
$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'domain' => '',       // same host
  'secure' => $cookieSecure,
  'httponly' => true,
  'samesite' => 'Lax',
]);
if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

// ---------- DB connection ----------
/**
 * Returns a mysqli connection using environment variables.
 *
 * Returns:
 *   mysqli: Active connection.
 *
 * Throws:
 *   Exception: When env vars are missing or connection fails.
 */
function db(): mysqli {
  static $conn = null;
  if ($conn instanceof mysqli) {
    return $conn;
  }

  $host = getenv('DB_HOST');
  $name = getenv('DB_NAME');
  $user = getenv('DB_USER');
  $pass = getenv('DB_PASS');

  if (!$host || !$name || !$user) {
    http_response_code(500);
    echo json_encode(['error' => 'Database environment variables are not set (DB_HOST, DB_NAME, DB_USER, DB_PASS).']);
    exit;
  }

  $conn = @new mysqli($host, $user, $pass, $name);
  if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
  }
  $conn->set_charset('utf8mb4');
  return $conn;
}

/**
 * Sends a JSON response and exits.
 *
 * Args:
 *   int $status - HTTP status code
 *   mixed $payload - Serializable payload
 *
 * Returns:
 *   void
 */
function json_out(int $status, $payload): void {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

/**
 * Reads the raw JSON request body.
 *
 * Returns:
 *   array: Decoded JSON object or empty array.
 */
function read_json(): array {
  $raw = file_get_contents('php://input') ?: '';
  if ($raw === '') return [];
  $data = json_decode($raw, true);
  if (!is_array($data)) return [];
  return $data;
}

/**
 * Ensures the user is authenticated by checking session.
 *
 * Returns:
 *   void
 */
function require_auth(): void {
  if (empty($_SESSION['uid'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }
}

/**
 * Generates or returns existing CSRF token from session.
 *
 * Returns:
 *   string: CSRF token
 */
function get_csrf_token(): string {
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf'];
}

/**
 * Validates CSRF header for state-changing requests.
 *
 * Returns:
 *   void
 */
function require_csrf(): void {
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if (in_array($method, ['POST','PUT','PATCH','DELETE'], true)) {
    $hdr = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $valid = hash_equals($_SESSION['csrf'] ?? '', $hdr);
    if (!$valid) {
      json_out(403, ['error' => 'Invalid CSRF token']);
    }
  }
}

/**
 * Sanitizes and whitelists order by tokens to prevent SQL injection.
 *
 * Args:
 *   string|null $sort - sort key from client
 *
 * Returns:
 *   string: ORDER BY clause fragment.
 */
function order_by(?string $sort): string {
  switch ($sort) {
    case 'name_asc': return 'ORDER BY a.name ASC';
    case 'name_desc': return 'ORDER BY a.name DESC';
    case 'updated_asc': return 'ORDER BY a.updated_at ASC';
    case 'updated_desc': return 'ORDER BY a.updated_at DESC';
    default: return 'ORDER BY a.updated_at DESC';
  }
}
```

------

# `/api/csrf.php`

```php
<?php
/**
 * CSRF endpoint
 *
 * GET: Issues a CSRF cookie and returns the token in JSON.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$token = get_csrf_token();

// Mirror CSRF in a non-HttpOnly cookie (so frontend can read it)
// This cookie only holds a random token, not a session ID.
$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
setcookie('csrf', $token, [
  'expires' => 0,
  'path' => '/',
  'domain' => '',
  'secure' => $cookieSecure,
  'httponly' => false,
  'samesite' => 'Lax',
]);

json_out(200, ['token' => $token, 'ok' => true]);
```

------

# `/api/login.php`

```php
<?php
/**
 * Login endpoint
 *
 * POST {email, password}
 *   - Verifies user by email and password (bcrypt hash in DB).
 *   - On success, sets session uid.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

require_csrf(); // defend even login

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

$body = read_json();
$email = isset($body['email']) ? trim((string)$body['email']) : '';
$pass  = isset($body['password']) ? (string)$body['password'] : '';

if ($email === '' || $pass === '') {
  json_out(400, ['error' => 'Missing email or password']);
}

$sql = 'SELECT id, password_hash FROM users WHERE email = ? LIMIT 1';
$stmt = db()->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  json_out(401, ['error' => 'Invalid credentials']);
}

if (!password_verify($pass, $row['password_hash'])) {
  json_out(401, ['error' => 'Invalid credentials']);
}

$_SESSION['uid'] = (int)$row['id'];
json_out(200, ['ok' => true]);
```

------

# `/api/logout.php`

```php
<?php
/**
 * Logout endpoint
 *
 * POST: Destroys session.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

require_auth();
require_csrf();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $params = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

json_out(200, ['ok' => true]);
```

------

# `/api/municipalities.php`

```php
<?php
/**
 * Municipalities endpoint
 *
 * GET: Returns list of municipalities (id, name, code).
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

$sql = 'SELECT id, name, code FROM municipalities ORDER BY name ASC';
$res = db()->query($sql);
$items = [];
while ($row = $res->fetch_assoc()) {
  $items[] = [
    'id' => (int)$row['id'],
    'name' => $row['name'],
    'code' => $row['code'],
  ];
}

json_out(200, ['items' => $items]);
```

------

# `/api/tags.php`

```php
<?php
/**
 * Tags endpoint
 *
 * GET:
 *   - List tags.
 * POST:
 *   - Create tag: { name }
 *   - Attach: { action: "attach", associationId, tagId }
 *   - Detach: { action: "detach", associationId, tagId }
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $res = db()->query('SELECT id, name FROM tags ORDER BY name ASC');
  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = ['id' => (int)$row['id'], 'name' => $row['name']];
  }
  json_out(200, ['items' => $items]);
}

require_auth();
require_csrf();

$body = read_json();
$action = isset($body['action']) ? (string)$body['action'] : '';

if ($method === 'POST' && $action === '') {
  $name = isset($body['name']) ? trim((string)$body['name']) : '';
  if ($name === '') json_out(400, ['error' => 'Missing tag name']);
  $stmt = db()->prepare('INSERT INTO tags (name) VALUES (?)');
  $stmt->bind_param('s', $name);
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

if ($method === 'POST' && ($action === 'attach' || $action === 'detach')) {
  $assocId = isset($body['associationId']) ? (int)$body['associationId'] : 0;
  $tagId   = isset($body['tagId']) ? (int)$body['tagId'] : 0;
  if ($assocId <= 0 || $tagId <= 0) json_out(400, ['error' => 'associationId and tagId are required']);

  if ($action === 'attach') {
    $stmt = db()->prepare('INSERT IGNORE INTO association_tags (association_id, tag_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $assocId, $tagId);
    $stmt->execute();
    json_out(200, ['ok' => true]);
  }

  if ($action === 'detach') {
    $stmt = db()->prepare('DELETE FROM association_tags WHERE association_id = ? AND tag_id = ?');
    $stmt->bind_param('ii', $assocId, $tagId);
    $stmt->execute();
    json_out(200, ['ok' => true]);
  }
}

json_out(405, ['error' => 'Method not allowed']);
```

------

# `/api/association_notes.php`

```php
<?php
/**
 * Association notes endpoint
 *
 * GET ?association_id=: Lists notes for the given association.
 * POST {association_id, content}: Creates a note for the association.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $aid = isset($_GET['association_id']) ? (int)$_GET['association_id'] : 0;
  if ($aid <= 0) json_out(400, ['error' => 'association_id is required']);
  $stmt = db()->prepare('SELECT id, association_id, content, author, created_at FROM notes WHERE association_id = ? ORDER BY created_at DESC');
  $stmt->bind_param('i', $aid);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (int)$row['id'],
      'association_id' => (int)$row['association_id'],
      'content' => $row['content'],
      'author' => $row['author'],
      'created_at' => $row['created_at'],
    ];
  }
  json_out(200, ['items' => $items]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  $body = read_json();
  $aid = isset($body['association_id']) ? (int)$body['association_id'] : 0;
  $content = isset($body['content']) ? trim((string)$body['content']) : '';
  if ($aid <= 0 || $content === '') json_out(400, ['error' => 'association_id and content are required']);

  $author = 'user'; // Single-user system; change if you later store display name
  $stmt = db()->prepare('INSERT INTO notes (association_id, content, author, created_at) VALUES (?, ?, ?, NOW())');
  $stmt->bind_param('iss', $aid, $content, $author);
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

json_out(405, ['error' => 'Method not allowed']);
```

------

# `/api/associations.php`

```php
<?php
/**
 * Associations endpoint
 *
 * GET:
 *   - List associations with filters and pagination.
 *   - Query params:
 *       q: string (search in name/description)
 *       municipality: string (either ID or name)
 *       type: string
 *       status: string
 *       tags[]: repeated (tag names or IDs)
 *       page: number (default 1)
 *       pageSize: number (default 20, max 100)
 *       sort: name_asc|name_desc|updated_asc|updated_desc
 *
 * POST:
 *   - Create association (requires auth + CSRF).
 * PUT/PATCH:
 *   - Update association by id in body (requires auth + CSRF).
 * DELETE ?id=:
 *   - Soft-delete association (requires auth + CSRF).
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  // ---------- Filters ----------
  $q            = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $municipality = isset($_GET['municipality']) ? trim((string)$_GET['municipality']) : '';
  $type         = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
  $status       = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
  $tags         = isset($_GET['tags']) ? $_GET['tags'] : (isset($_GET['tags']) ? [$_GET['tags']] : []);
  if (!is_array($tags)) $tags = [];

  $page     = max(1, (int)($_GET['page'] ?? 1));
  $pageSize = (int)($_GET['pageSize'] ?? 20);
  if ($pageSize <= 0) $pageSize = 20;
  if ($pageSize > 100) $pageSize = 100;
  $offset = ($page - 1) * $pageSize;

  $sortSql = order_by($_GET['sort'] ?? null);

  // ---------- Base query ----------
  $where = ['a.deleted_at IS NULL'];
  $params = [];
  $types = '';

  if ($q !== '') {
    $where[] = '(a.name LIKE CONCAT("%", ?, "%") OR a.description LIKE CONCAT("%", ?, "%"))';
    $params[] = $q; $types .= 's';
    $params[] = $q; $types .= 's';
  }

  if ($municipality !== '') {
    if (ctype_digit($municipality)) {
      $where[] = 'a.municipality_id = ?';
      $params[] = (int)$municipality; $types .= 'i';
    } else {
      $where[] = 'a.municipality_id IN (SELECT id FROM municipalities WHERE name = ?)';
      $params[] = $municipality; $types .= 's';
    }
  }

  if ($type !== '') {
    $where[] = 'a.type = ?';
    $params[] = $type; $types .= 's';
  }

  if ($status !== '') {
    $where[] = 'a.status = ?';
    $params[] = $status; $types .= 's';
  }

  $tagJoin = '';
  if (count($tags) > 0) {
    $placeholders = [];
    $tagTypes = '';
    $tagParams = [];
    foreach ($tags as $t) {
      if (ctype_digit((string)$t)) {
        $placeholders[] = '?';
        $tagTypes .= 'i';
        $tagParams[] = (int)$t;
      } else {
        // allow tag by name
        $placeholders[] = '(SELECT id FROM tags WHERE name = ?)';
        $tagTypes .= 's';
        $tagParams[] = (string)$t;
      }
    }
    // enforce that association has all provided tags (inner join filtered subquery)
    // simplest approach: association must have at least one of the tags (OR)
    // If you require ALL tags: use group by & having count = n.
    $tagJoin = 'INNER JOIN association_tags at ON at.association_id = a.id';
    $where[] = 'at.tag_id IN (' . implode(',', $placeholders) . ')';
    $types .= $tagTypes;
    $params = array_merge($params, $tagParams);
  }

  $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

  // ---------- Count ----------
  $countSql = "SELECT COUNT(DISTINCT a.id) AS cnt
               FROM associations a
               $tagJoin
               $whereSql";
  $stmt = db()->prepare($countSql);
  if ($types !== '') $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $cntRes = $stmt->get_result()->fetch_assoc();
  $total = (int)($cntRes['cnt'] ?? 0);

  // ---------- Items ----------
  $sql = "SELECT a.id, a.name, a.municipality_id, a.type, a.status, a.email, a.phone,
                 a.address, a.website, a.description, a.created_at, a.updated_at, a.deleted_at
          FROM associations a
          $tagJoin
          $whereSql
          $sortSql
          LIMIT ? OFFSET ?";
  $types2 = $types . 'ii';
  $params2 = $params;
  $params2[] = $pageSize;
  $params2[] = $offset;

  $stmt2 = db()->prepare($sql);
  if ($types !== '') {
    $stmt2->bind_param($types2, ...$params2);
  } else {
    $stmt2->bind_param('ii', $pageSize, $offset);
  }
  $stmt2->execute();
  $res = $stmt2->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (int)$row['id'],
      'name' => $row['name'],
      'municipality_id' => $row['municipality_id'] !== null ? (int)$row['municipality_id'] : null,
      'type' => $row['type'],
      'status' => $row['status'],
      'email' => $row['email'],
      'phone' => $row['phone'],
      'address' => $row['address'],
      'website' => $row['website'],
      'description' => $row['description'],
      'created_at' => $row['created_at'],
      'updated_at' => $row['updated_at'],
      'deleted_at' => $row['deleted_at'],
    ];
  }

  json_out(200, [
    'items' => $items,
    'total' => $total,
    'page' => $page,
    'pageSize' => $pageSize,
  ]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  $b = read_json();

  $name = trim((string)($b['name'] ?? ''));
  if ($name === '') json_out(400, ['error' => 'name is required']);

  $municipality_id = isset($b['municipality_id']) ? (int)$b['municipality_id'] : null;
  $type  = isset($b['type']) ? trim((string)$b['type']) : null;
  $status= isset($b['status']) ? trim((string)$b['status']) : null;
  $email = isset($b['email']) ? trim((string)$b['email']) : null;
  $phone = isset($b['phone']) ? trim((string)$b['phone']) : null;
  $address = isset($b['address']) ? trim((string)$b['address']) : null;
  $website = isset($b['website']) ? trim((string)$b['website']) : null;
  $description = isset($b['description']) ? trim((string)$b['description']) : null;

  $sql = 'INSERT INTO associations
          (name, municipality_id, type, status, email, phone, address, website, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
  $stmt = db()->prepare($sql);
  $stmt->bind_param(
    'sisssssss',
    $name,
    $municipality_id,
    $type,
    $status,
    $email,
    $phone,
    $address,
    $website,
    $description
  );
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

if ($method === 'PUT' || $method === 'PATCH') {
  require_auth();
  require_csrf();
  $b = read_json();
  $id = isset($b['id']) ? (int)$b['id'] : 0;
  if ($id <= 0) json_out(400, ['error' => 'id is required']);

  // Build dynamic update set
  $fields = [
    'name' => null, 'municipality_id' => null, 'type' => null, 'status' => null,
    'email' => null, 'phone' => null, 'address' => null, 'website' => null, 'description' => null
  ];

  $set = [];
  $types = '';
  $vals = [];

  foreach ($fields as $k => $_) {
    if (array_key_exists($k, $b)) {
      $set[] = "$k = ?";
      if ($k === 'municipality_id') {
        $types .= 'i';
        $vals[] = is_null($b[$k]) ? null : (int)$b[$k];
      } else {
        $types .= 's';
        $vals[] = is_null($b[$k]) ? null : trim((string)$b[$k]);
      }
    }
  }

  if (count($set) === 0) {
    json_out(400, ['error' => 'No fields to update']);
  }

  $sql = 'UPDATE associations SET ' . implode(', ', $set) . ', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL';
  $types .= 'i';
  $vals[] = $id;

  $stmt = db()->prepare($sql);
  // For nullable parameters, we need to use appropriate binding; use ...$vals but ensure correct types.
  // mysqli binds nulls as null if using "s" or "i" with null in PHP 8.1+, the value will be converted.
  $stmt->bind_param($types, ...$vals);
  $stmt->execute();

  json_out(200, ['ok' => true]);
}

if ($method === 'DELETE') {
  require_auth();
  require_csrf();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) json_out(400, ['error' => 'id is required']);

  $stmt = db()->prepare('UPDATE associations SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL');
  $stmt->bind_param('i', $id);
  $stmt->execute();

  json_out(200, ['ok' => true]);
}

json_out(405, ['error' => 'Method not allowed']);
```

------

## Hur du tar detta i drift på Loopia (kort):

1. Lägg upp **/api/** med filerna ovan + `.htaccess`.
2. Sätt miljövariabler i Loopia-miljön: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.
3. Skapa en användare i `users` med `password_hash = password_hash('dittLösen', PASSWORD_BCRYPT)`.
4. I frontend, byt tidigare tRPC-anrop till modulen `lib/api.ts` (filen ovan).
5. Bygg statiskt och ladda upp din Next.js-webb (ingen Node-server behövs).
6. Logga in via din befintliga login-vy → systemet använder PHP-sessioner + CSRF.

Vill du att jag även lägger med **SQL-DDL** för de tabeller som behövs (kommenterad, utan att fylla några värden), säg till så skriver jag en komplett `schema.sql` med index för snabb sökning på delat webbhotell.