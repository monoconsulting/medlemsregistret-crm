# Standalone Frontend – Implementation Plan (Phases 0–2)

> Goal: Ship a dramatically simplified, **standalone** frontend that runs identically on **Loopia (remote)** and **local** environments, using a **same-origin PHP API** and the **existing MySQL/MariaDB**. No Node/Express/Prisma/tRPC at runtime. Scraping/Playwright/etc. remain in the repo but are **not** deployed to Loopia.

------

## 📦 Scope for this document

- **Included:** Phases **0–2** (backups/baseline → PHP API → frontend data layer & auth swap).
- **Not included here:** Later phases (build/deploy, verification, performance hardening). They will be delivered in a separate doc.

## **[P1-A]** – the complete Fetch-based client that replaces tRPC.

## `crm-app/lib/api.ts` 

```
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



## **[P1-B]** `/api/.htaccess` – security headers & folder hardening.

### `/api/.htaccess`

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



## **[P1-C]** – session setup, DB connect, `json_out()`, `read_json()`, `require_auth()`, CSRF helpers, `order_by()`

### `/api/bootstrap.php` 

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



## **[P1-D]**  – issues CSRF token (cookie + JSON).

### `/api/csrf.php`

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

## **[P1-E]** – POST login (bcrypt), sets session.

### `/api/login.php`

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

## **[P1-F]**  – POST logout, destroys session.

### `/api/logout.php`

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

## **[P1-G]**  – GET municipalities list.

### `/api/municipalities.php`

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



# **[P1-H]** – GET tags, POST create, attach/detach to association.

### `/api/tags.php`

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

# **[P1-I]** – GET/POST notes per association.

## `/api/association_notes.php`

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

# **[P1-J]** `/api/associations.php` – GET (filters + paging + sort), POST create, PUT/PATCH update, DELETE soft-delete.

### `/api/associations.php`

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



> If your PART1 file uses slightly different filenames or section titles, match by content (functionality). Keep identical behavior.

------

## 🧭 Phase 0 — Backups, Baseline, and Safe Parking (½ day)

> **Outcome:** Clean, reversible starting point. All legacy backend code is preserved (not deleted) under `/legacy/`.

### Sprint 0.1 — Backups & Inventory

**Task 0.1.1 — Database snapshot (Loopia + local)**

- Export full SQL dumps (schema + data). Save under `backups/` with timestamp.
- Verify restores locally on a throwaway DB.

**Task 0.1.2 — Current site backup**

- Download all currently published web files from Loopia to `backups/web-live-<date>/`.

**Task 0.1.3 — Inventory SSR/tRPC usage**

- In `crm-app/`, list all files that:
  - use **tRPC** client/hooks, or import from `@/server/*`.
  - rely on **SSR/Server Components** for data fetching.
- Save the list to `docs/inventory_trpc_ssr.md`.

**Task 0.1.4 — Park legacy runtime**

- Create `/legacy/` in repo.
- Move these into `/legacy/` (keep tree structure + add a `README.md` explaining why parked):
  - Node/Express/tRPC backend code
  - Prisma schema/migrations
  - Docker compose for backend runtime
  - Playwright, scraping, AI widgets
- Replace any imports that referenced them (frontend) with the new client in Phase 2.

### Sprint 0.2 — Config contract & env notes

**Task 0.2.1 — PHP DB env contract**

- Document required PHP-side variables: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` in `docs/runtime_env.md`.
- Add `api/config.sample.php` with `getenv()` fallback and comments (do **not** commit secrets). See **Supplement S-1** below.

**Task 0.2.2 — API path contract**

- Decide **same-origin** base: `/api/…` (no CORS). Document in `docs/api_contract.md`.
- Remove any assumption of subdomains (e.g., `api.example.com`) for this standalone.

------

## ⚙️ Phase 1 — Minimal Same‑Origin PHP API (1–2 days)

> **Outcome:** Fully functional PHP API under `/api/` mirroring all data operations previously served by Node/tRPC.

### Sprint 1.1 — API folder skeleton

**Task 1.1.1 — Create `/api/` with security**

- **Paste from PART1:** **[P1-B]** `/api/.htaccess`.
- Ensure `Options -Indexes` and security headers are active on Loopia.

**Task 1.1.2 — Bootstrap/include**

- **Paste from PART1:** **[P1-C]** `/api/bootstrap.php`.
- Adjust include path if needed (relative to `/api/`).
- Ensure session cookie uses `SameSite=Lax`, HttpOnly, and `Secure` on HTTPS.

**Task 1.1.3 — CSRF issuance**

- **Paste from PART1:** **[P1-D]** `/api/csrf.php`.
- Verify it sets a **readable** `csrf` cookie (not HttpOnly) and returns `{ token }` JSON.

### Sprint 1.2 — Auth endpoints

**Task 1.2.1 — Login**

- **Paste from PART1:** **[P1-E]** `/api/login.php`.
- Validate bcrypt with `password_verify()`, then set `$_SESSION['uid']`.
- Enforce CSRF on login (defense-in-depth) as in PART1.

**Task 1.2.2 — Logout**

- **Paste from PART1:** **[P1-F]** `/api/logout.php`.
- Destroy session + clear cookie.

### Sprint 1.3 — Data endpoints (CRUD, filters, notes, tags)

**Task 1.3.1 — Municipalities**

- **Paste from PART1:** **[P1-G]** `/api/municipalities.php` (GET list).

**Task 1.3.2 — Tags**

- **Paste from PART1:** **[P1-H]** `/api/tags.php` (GET list; POST create/attach/detach).

**Task 1.3.3 — Notes**

- **Paste from PART1:** **[P1-I]** `/api/association_notes.php` (GET by association; POST create).

**Task 1.3.4 — Associations**

- **Paste from PART1:** **[P1-J]** `/api/associations.php` supporting:
  - **GET**: `q`, `municipality`, `type`, `status`, `tags[]`, `page`, `pageSize≤100`, `sort`
  - **POST/PUT/PATCH/DELETE**: auth + CSRF; soft-delete on DELETE.

### Sprint 1.4 — Indexes & SQL hygiene

**Task 1.4.1 — Add/verify indexes** (run in both local and Loopia DB):

- `associations(name)`, `associations(municipality_id)`, `associations(type)`, `associations(status)`
- `association_tags(association_id)`, `association_tags(tag_id)`
- (Optional) `FULLTEXT(name, description)` if supported
- Save SQL in `db/extra_indexes.sql`.

**Task 1.4.2 — Query caps & validation**

- Enforce `pageSize` ≤ 100 and whitelist `sort` keys (already in **[P1-C]** `order_by()`).

------

## 🖥️ Phase 2 — Frontend Data Layer & Auth Swap (1–2 days)

> **Outcome:** UI is unchanged; all tRPC calls are replaced by `fetch` via `lib/api.ts`. SSR data-fetching is moved client-side so `next export` works.

### Sprint 2.1 — Client API module & CSRF bootstrap

**Task 2.1.1 — Install the client module**

- **Paste from PART1:** **[P1-A]** `crm-app/lib/api.ts` (complete file).
- Ensure it:
  - uses `credentials: 'include'` for requests,
  - calls `/api/csrf.php` on demand (`ensureCsrf()`),
  - adds `X-CSRF-Token` on write operations,
  - throws on non-2xx with useful messages.

**Task 2.1.2 — Centralized error UX**

- If the app has a toast/alert system, wire `api.ts` consumers to display friendly errors.

### Sprint 2.2 — Replace all tRPC usages

**Task 2.2.1 — Mechanical swap**

- From `docs/inventory_trpc_ssr.md`, for each file using tRPC:
  - Replace queries/mutations with `api.getAssociations() / create / update / delete`, `api.getMunicipalities()`, `api.getTags()`, `api.attachTag()/detachTag()`, `api.getNotes()/addNote()`, `api.login()/logout()`.
  - Keep UI & state flows identical.
- Commit with message: `feat(frontend): switch data layer to fetch/PHP (tRPC removed)`.

**Task 2.2.2 — Remove unused imports**

- Drop any `@/server/*` imports, tRPC hooks, and Node-only utilities from components.
- If a provider existed solely for tRPC, remove or stub appropriately.

### Sprint 2.3 — SSR → Client fetch (export-safe)

**Task 2.3.1 — Identify SSR pages**

- Any page using `getServerSideProps`/RSC data calls must be shifted to client fetch using `api.ts`.
- Ensure initial render is resilient (loading states) and hydration is correct.

**Task 2.3.2 — Export sanity**

- Confirm `next export` can produce static output for all routes used post-login (the app is client-rendered after auth). Document caveats in `docs/static_export_notes.md`.

### Sprint 2.4 — Auth UX wiring

**Task 2.4.1 — Login form**

- Wire to `api.login(email, password)`; on success, route to main view.
- On 401, show inline error.

**Task 2.4.2 — Logout action**

- Wire to `api.logout()`; then route to `/login`.

**Task 2.4.3 — 401 handling**

- Any 401 from data calls should redirect to `/login` (or show a re-login prompt), without page crash.

------

## ✅ Deliverables for Phases 0–2

- `docs/inventory_trpc_ssr.md` (list of files changed)
- `/api/` with files **[P1-B]…[P1-J]** copied from PART1
- `crm-app/lib/api.ts` **[P1-A]** copied from PART1
- `db/extra_indexes.sql` for the added/verified indexes
- `docs/api_contract.md`, `docs/runtime_env.md`, `docs/static_export_notes.md`
- `/legacy/README.md` explaining what was parked and why

------

## 🧩 Supplements (added by this plan)

### S-1. `api/config.sample.php` (developer-facing example)

```php
<?php
// Copy to api/config.php on each environment and fill real values OR
// use hosting env vars; bootstrap.php should prefer getenv() and only
// fallback to include config.php if needed.

// Example only; do NOT commit real secrets.
$CFG = [
  'DB_HOST' => 'mysqlXX.loopia.se',
  'DB_NAME' => 'YOUR_DB_NAME',
  'DB_USER' => 'YOUR_DB_USER',
  'DB_PASS' => 'YOUR_DB_PASS',
];
```

### S-2. `db/extra_indexes.sql` (template)

```sql
-- Run this in BOTH local and Loopia databases (adjust names if needed)
CREATE INDEX IF NOT EXISTS idx_assoc_name           ON associations(name);
CREATE INDEX IF NOT EXISTS idx_assoc_municipality   ON associations(municipality_id);
CREATE INDEX IF NOT EXISTS idx_assoc_type           ON associations(type);
CREATE INDEX IF NOT EXISTS idx_assoc_status         ON associations(status);
CREATE INDEX IF NOT EXISTS idx_at_assoc             ON association_tags(association_id);
CREATE INDEX IF NOT EXISTS idx_at_tag               ON association_tags(tag_id);
-- Optional fulltext (if supported)
-- ALTER TABLE associations ADD FULLTEXT ft_assoc_name_desc (name, description);
```

------

## 🧑‍💻 Agent System Prompt (for Phases 0–2 only)

```
You are the implementation agent for the Standalone CRM Frontend (Phases 0–2).

OBJECTIVES
1) Keep UI/UX identical; replace data layer with same-origin PHP API.
2) Make local and Loopia run the exact same static build + /api/.
3) Preserve all functionality: login/logout, CSRF, associations list/search/filter (municipality/type/status/tags), CRUD with soft delete, notes, tags, pagination, sorting.
4) Do NOT delete code – move retired runtime into /legacy/ with README.

GROUND TRUTH (copy from MCRM_SIMPLIFIED_FRONTEND_PART1.md)
- [P1-A] crm-app/lib/api.ts
- [P1-B] /api/.htaccess
- [P1-C] /api/bootstrap.php
- [P1-D] /api/csrf.php
- [P1-E] /api/login.php
- [P1-F] /api/logout.php
- [P1-G] /api/municipalities.php
- [P1-H] /api/tags.php
- [P1-I] /api/association_notes.php
- [P1-J] /api/associations.php

CONSTRAINTS
- Same-origin only. No CORS.
- Session cookie SameSite=Lax; CSRF cookie readable by JS; write ops require X-CSRF-Token.
- pageSize ≤ 100; whitelist sort keys.
- Parameterized SQL only; soft delete on associations.

OUTPUTS
- All files pasted or created as specified in Phases 0–2 deliverables.
- Inventory doc of every file changed.
- Index SQL stored in db/extra_indexes.sql.
```

------

## 📋 Quick Acceptance Checklist (Phases 0–2)

| #    | Checkpoint                        | Criteria                                                     |
| ---- | --------------------------------- | ------------------------------------------------------------ |
| 1    | **API endpoints operational**     | `/api/*.php` returns valid JSON; CRUD + filters function; proper 401/403 for unauthorized or missing CSRF. |
| 2    | **Frontend data layer migrated**  | All tRPC imports removed; `lib/api.ts` used across UI; identical UX and state. |
| 3    | **CSRF and session verified**     | Session cookie is `SameSite=Lax`; CSRF token exchange works (GET /api/csrf.php then POST with X-CSRF-Token). |
| 4    | **Login/Logout flow functional**  | Successful login establishes PHP session; logout clears it; unauthorized fetch returns 401; redirect to login implemented. |
| 5    | **SSR to client fetch migration** | No remaining `getServerSideProps`; all data loaded via client fetch from `api.ts`. `next export` succeeds. |
| 6    | **Database indexes validated**    | All indexes created per `db/extra_indexes.sql`; sample queries execute < 300ms on Loopia DB. |
| 7    | **Legacy code archived**          | `/legacy/` contains all old Node/tRPC backend, Prisma, Docker; README explains reason and recovery path. |
| 8    | **Docs updated**                  | `api_contract.md`, `runtime_env.md`, `inventory_trpc_ssr.md`, `static_export_notes.md` exist and match new architecture. |
| 9    | **Error UX confirmed**            | API errors surfaced as clear toasts/messages; no unhandled promise rejections or console errors. |
| 10   | **Environment parity**            | Local and Loopia instances behave identically; same codebase; no environment-specific hacks. |