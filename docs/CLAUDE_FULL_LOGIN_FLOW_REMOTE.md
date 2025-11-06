# Complete Login Flow Documentation - Loopia Remote (crm.medlemsregistret.se)

**Dokumenterad**: 2025-11-04
**Syfte**: Fullständig spårning av inloggningsflödet från URL-inmatning till dashboard och föreningssida.

---

## Översikt

Detta dokument spårar **varje steg** från att en användare skriver `crm.medlemsregistret.se` till att de är inloggade och navigerat till föreningssidan. Dokumentationen inkluderar:
- Filsökvägar och radnummer
- Cookies och session-hantering
- Token-flöden
- API-anrop
- Datahantering

---

## STEG 1: Initial Browser Request

### 1.1 Användarens Åtgärd
```
Användare skriver: crm.medlemsregistret.se
Browser gör HTTP request till: https://crm.medlemsregistret.se/
```

### 1.2 Vad Händer på Servern
- Next.js static export serveras (HTML, CSS, JS bundles)
- Ingen server-side rendering (SSR är disabled för static export)
- Browser laddar ned:
  - `index.html`
  - React bundles
  - CSS
  - Next.js runtime

---

## STEG 2: React Application Initialisering

### 2.1 Root Layout Laddar (crm-app/app/layout.tsx)

**Fil**: `E:\projects\CRM\crm-app\app\layout.tsx`

```tsx
// Rad 11-26
export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Viktiga punkter**:
- Hela applikationen wrappas i `<AuthProvider>`
- Detta är det första steget i autentiseringsflödet
- Ingen middleware körs (finns ingen middleware.ts i projektet)

---

## STEG 3: AuthProvider Initialisering

### 3.1 AuthProvider Monteras (crm-app/lib/providers/auth-provider.tsx)

**Fil**: `E:\projects\CRM\crm-app\lib\providers\auth-provider.tsx`

#### 3.1.1 Initial State Setup (rad 69-70)
```tsx
const [session, setSession] = useState<AuthSession | null>(null)
const [status, setStatus] = useState<AuthStatus>("loading")
```

**Status**: `loading` (användare är varken autentiserad eller ej ännu)

#### 3.1.2 Storage Key Konstant (rad 41)
```tsx
const STORAGE_KEY = "crm-auth-user"
```

**Kritisk information**: Auth-data lagras i `localStorage` under nyckeln `"crm-auth-user"`

#### 3.1.3 useEffect Hook Körs Vid Mount (rad 97-103)
```tsx
useEffect(() => {
  const stored = readStoredUser()  // Läser från localStorage
  if (stored) {
    setSession({ user: stored })   // Om data finns, sätt session
  }
  void refresh()                   // Kör alltid refresh för verifiering
}, [refresh])
```

**Händelseförlopp**:
1. Försöker läsa `localStorage.getItem("crm-auth-user")`
2. Om det finns data där, sätter provisorisk session
3. Anropar `refresh()` för att verifiera mot backend

### 3.2 localStorage Läsning (rad 43-55)

```tsx
function readStoredUser(): AuthSessionUser | null {
  if (typeof window === "undefined") return null  // SSR-skydd
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)  // Läser "crm-auth-user"
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSessionUser
    if (!parsed || typeof parsed.id !== "string") return null
    return parsed
  } catch (error) {
    console.warn("Failed to parse stored auth user", error)
    return null
  }
}
```

**På första besöket**: `localStorage` är tom → returnerar `null`

### 3.3 Refresh Function (rad 72-95)

**Kritisk funktion**: Denna verifierar om sessionen är giltig genom att göra ett test-API-anrop.

```tsx
const refresh = useCallback(async () => {
  setStatus("loading")
  try {
    // GÖR ETT TEST-ANROP FÖR ATT VERIFIERA SESSION
    await api.getAssociations({ page: 1, pageSize: 1 })

    const stored = readStoredUser()
    if (stored) {
      setSession({ user: stored })
    } else {
      setSession(null)
    }
    setStatus("authenticated")  // Om anropet lyckas → autentiserad
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.toLowerCase().includes("not authenticated") || message.toLowerCase().includes("unauth")) {
      setSession(null)
      writeStoredUser(null)     // Rensa localStorage
      setStatus("unauthenticated")  // Markera som ej autentiserad
    } else {
      console.error("Failed to refresh auth status", error)
      setSession(null)
      setStatus("unauthenticated")
    }
  }
}, [])
```

**Viktigt**:
- Gör ett **test-API-anrop** till `/api/associations.php?page=1&pageSize=1`
- Om anropet **lyckas**: status → `"authenticated"`
- Om anropet **misslyckas** med auth-fel: status → `"unauthenticated"`
- **Detta är backend-verifieringen av sessionen**

---

## STEG 4: Root Page Rendering (crm-app/app/page.tsx)

**Fil**: `E:\projects\CRM\crm-app\app\page.tsx`

### 4.1 Auth Status Check (rad 8-16)

```tsx
export default function IndexPage() {
  const router = useRouter()
  const { status } = useAuth()  // Hämtar status från AuthProvider

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/associations")  // Redirect om inloggad
    }
  }, [status, router])
```

**På första besöket**:
- `status` börjar som `"loading"`
- När `refresh()` är klar och användaren INTE är autentiserad → `status` blir `"unauthenticated"`

### 4.2 Render Logic Baserat på Status (rad 18-42)

```tsx
if (status === "loading") {
  return <div>Laddar…</div>
}

if (status === "unauthenticated") {
  return (
    <main>
      <h1>Välkommen!</h1>
      <p>Logga in för att komma åt CRM-portalen.</p>
      <Link href="/login">Gå till inloggning</Link>
    </main>
  )
}

return <div>Omdirigerar…</div>
```

**För en ej inloggad användare**:
- Visar välkomstskärm med "Gå till inloggning"-länk
- Användaren klickar på länken → navigerar till `/login`

---

## STEG 5: Login Page (crm-app/app/login/page.tsx)

**Fil**: `E:\projects\CRM\crm-app\app\login\page.tsx`

### 5.1 Form Setup (rad 15-34)

```tsx
const loginSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(4, "Lösenordet måste vara minst 4 tecken"),
})

const form = useForm<LoginSchema>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: "",
    password: "",
  },
})
```

**Form fields**:
- Email (valideras som email)
- Password (minimum 4 tecken)

### 5.2 Form Submit Handler (rad 36-47)

```tsx
const onSubmit = async (values: LoginSchema, event?: BaseSyntheticEvent) => {
  event?.preventDefault()
  setError(null)
  setIsSubmitting(true)

  // ANROPAR LOGIN-FUNKTIONEN FRÅN AUTH-PROVIDER
  const result = await login(values.email, values.password)

  setIsSubmitting(false)
  if (!result.ok) {
    setError(result.error ?? "Felaktig e-post eller lösenord")
    return
  }

  // VID LYCKAD LOGIN: REDIRECT TILL ASSOCIATIONS
  router.replace("/associations")
}
```

**När användaren skickar formuläret**:
1. Client-side validering (Zod)
2. Anropar `login()` från AuthProvider
3. Vid success: redirect till `/associations`
4. Vid fel: visar felmeddelande

---

## STEG 6: Login Function i AuthProvider

**Fil**: `E:\projects\CRM\crm-app\lib\providers\auth-provider.tsx` (rad 105-124)

### 6.1 Login-funktionen

```tsx
const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
  try {
    // GÖR API-ANROP TILL BACKEND
    await api.login(email, password)

    // SKAPA USER-OBJEKT (endast frontend-data)
    const user: AuthSessionUser = {
      id: "user",
      email,
      name: email ? email.split("@")[0] ?? null : null,
      role: "ADMIN",
    }

    // SPARA I LOCALSTORAGE
    writeStoredUser(user)

    // UPPDATERA STATE
    setSession({ user })
    setStatus("authenticated")

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inloggningen misslyckades"
    setSession(null)
    setStatus("unauthenticated")
    return { ok: false, error: message }
  }
}, [])
```

**Kritiska punkter**:
- Anropar `api.login(email, password)`
- **Autentisering sker på backend via session cookies**
- User-data lagras lokalt endast för UI (inte för auth)
- `localStorage` används för att komma ihåg användaren mellan besök

### 6.2 writeStoredUser Function (rad 57-64)

```tsx
function writeStoredUser(user: AuthSessionUser | null) {
  if (typeof window === "undefined") return
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}
```

**Sparar**:
```json
{
  "id": "user",
  "email": "admin@example.com",
  "name": "admin",
  "role": "ADMIN"
}
```

i `localStorage` under nyckeln `"crm-auth-user"`.

---

## STEG 7: API Login Call

**Fil**: `E:\projects\CRM\crm-app\lib\api.ts` (rad 180-183)

### 7.1 api.login() Function

```tsx
async login(email: string, password: string): Promise<{ ok: boolean }> {
  const body = { email, password };
  return jsonFetch('/api/login.php', { method: 'POST', body }, true);
}
```

**Parameters**:
- `email`: användarens email
- `password`: användarens lösenord (klartext från formulär)
- `needsCsrf`: `true` (tredje parametern)

### 7.2 Backend URL Resolution

**Fil**: `E:\projects\CRM\crm-app\lib\backend-base.ts` (rad 45-65)

```tsx
export function getBackendBaseUrl(): string {
  if (cachedBaseUrl !== undefined) {
    return cachedBaseUrl
  }

  const envBase = pickEnvBase()  // Försöker läsa från env-variabler
  if (envBase) {
    cachedBaseUrl = envBase
    return envBase
  }

  if (typeof window === "undefined") {
    // Server-side: använd localhost eller VERCEL_URL
    const serverBase = defaultServerBase()
    cachedBaseUrl = serverBase
    return serverBase
  }

  // Client-side: använd window.location.origin
  const clientBase = window.location.origin
  cachedBaseUrl = clientBase
  return clientBase
}
```

**På Loopia (crm.medlemsregistret.se)**:
- Kör i browser (client-side)
- `typeof window !== "undefined"`
- Returnerar: `window.location.origin` = `"https://crm.medlemsregistret.se"`

**Environment Variables** (från .env):
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.crm.medlemsregistret.se
```

Men eftersom static export kör i browser används `window.location.origin` istället.

**Resultat**: API-URL blir `https://crm.medlemsregistret.se/api/login.php`

---

## STEG 8: CSRF Token Handling

**Fil**: `E:\projects\CRM\crm-app\lib\api.ts` (rad 96-102)

### 8.1 ensureCsrf() Function

```tsx
async function ensureCsrf(): Promise<void> {
  if (getCsrfFromCookie()) return;  // Om token redan finns, gör inget

  // Annars: hämta token från backend
  const res = await fetch(resolveBackendUrl('/api/csrf.php'), {
    method: 'GET',
    credentials: 'include'  // VIKTIGT: skicka cookies
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain CSRF: ${res.status}`);
  }
}
```

**På första besöket**:
1. Ingen `csrf` cookie finns
2. Gör GET request till: `https://crm.medlemsregistret.se/api/csrf.php`
3. Backend sätter `csrf` cookie
4. Frontend kan nu läsa token från cookie

### 8.2 getCsrfFromCookie() Function (rad 84-87)

```tsx
function getCsrfFromCookie(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
```

**Läser**: `document.cookie` och söker efter `csrf=<value>`

---

## STEG 9: Backend CSRF Endpoint

**Fil**: `E:\projects\CRM\api\csrf.php`

### 9.1 CSRF Token Generation (rad 1-29)

```php
<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// Genererar eller hämtar existerande token från session
$token = get_csrf_token();

// Sätter cookie (NON-HttpOnly så frontend kan läsa den)
$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
setcookie('csrf', $token, [
  'expires' => 0,           // Session cookie
  'path' => '/',
  'domain' => '',           // Same-origin
  'secure' => $cookieSecure, // true på HTTPS
  'httponly' => false,      // Frontend kan läsa!
  'samesite' => 'Lax',
]);

log_event('api', 'csrf.issued');

json_out(200, ['token' => $token, 'ok' => true]);
```

**Bootstrap get_csrf_token()** (bootstrap.php rad 180-185):
```php
function get_csrf_token(): string {
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));  // 64 hex tecken
  }
  return $_SESSION['csrf'];
}
```

**Cookies som sätts**:
1. **PHP Session Cookie** (namn: `PHPSESSID`, HttpOnly: true, Secure: true på HTTPS)
2. **CSRF Cookie** (namn: `csrf`, HttpOnly: false, Secure: true på HTTPS)

**Session Storage Location** (bootstrap.php rad 23-29):
```php
$sessionPath = __DIR__ . '/storage/sessions';
if (!is_dir($sessionPath)) {
  @mkdir($sessionPath, 0775, true);
}
if (is_dir($sessionPath)) {
  session_save_path($sessionPath);
}
```

**Session lagras**: `/api/storage/sessions/sess_<session_id>`

---

## STEG 10: jsonFetch Request Construction

**Fil**: `E:\projects\CRM\crm-app\lib\api.ts` (rad 115-167)

### 10.1 jsonFetch Function

```tsx
async function jsonFetch(url: string, options: JsonRequestInit = {}, needsCsrf = false): Promise<any> {
  const target = resolveBackendUrl(url);  // https://crm.medlemsregistret.se/api/login.php
  const { body: rawBody, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders as HeadersInit | undefined);

  const init: RequestInit = {
    ...rest,
    credentials: 'include',  // KRITISKT: skicka cookies med varje request
  };

  // Om CSRF behövs (POST/PUT/DELETE)
  if (needsCsrf) {
    await ensureCsrf();          // Hämta CSRF token om den saknas
    const token = getCsrfFromCookie();
    if (!token) throw new Error('Missing CSRF token after ensureCsrf()');
    headers.set('X-CSRF-Token', token);  // Lägg till header
  }

  // JSON body handling
  if (body !== undefined && !isSpecialBody) {
    if (!hasCustomContentType) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
    }
    init.body = JSON.stringify(body);  // Serialisera till JSON
  }

  init.headers = headers;

  // GÖR REQUEST
  const res = await fetch(target, init);
  const text = await res.text();

  // Parsa JSON response
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text?.slice(0, 200)}`);
  }

  // Error handling
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
```

**För login-anropet skapas följande request**:

```http
POST https://crm.medlemsregistret.se/api/login.php HTTP/1.1
Content-Type: application/json; charset=utf-8
X-CSRF-Token: <64-char-hex-token>
Cookie: PHPSESSID=<session-id>; csrf=<csrf-token>

{"email":"admin@example.com","password":"userpassword"}
```

---

## STEG 11: Backend Login Processing

**Fil**: `E:\projects\CRM\api\login.php`

### 11.1 Bootstrap Initialization (rad 13)

```php
require __DIR__ . '/bootstrap.php';
```

**bootstrap.php gör följande**:
1. Sätter headers (Content-Type: application/json, Cache-Control)
2. Konfigurerar och startar PHP session
3. Etablerar databaskoppling

**Session Configuration** (bootstrap.php rad 22-41):
```php
$sessionPath = __DIR__ . '/storage/sessions';
if (!is_dir($sessionPath)) {
  @mkdir($sessionPath, 0775, true);
}
session_save_path($sessionPath);

$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
  'lifetime' => 0,          // Session cookie (tills browser stängs)
  'path' => '/',
  'domain' => '',           // Same-origin only
  'secure' => $cookieSecure, // true på HTTPS
  'httponly' => true,       // JavaScript kan INTE läsa denna
  'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}
```

**Cookies efter bootstrap**:
- `PHPSESSID=<random-id>` (HttpOnly, Secure på HTTPS, SameSite=Lax)

### 11.2 CSRF Validation (rad 15)

```php
require_csrf(); // defend even login
```

**require_csrf() function** (bootstrap.php rad 193-205):
```php
function require_csrf(): void {
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if (in_array($method, ['POST','PUT','PATCH','DELETE'], true)) {
    $hdr = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $valid = hash_equals($_SESSION['csrf'] ?? '', $hdr);
    if (!$valid) {
      log_event('api', 'csrf.invalid', [
        'path' => $_SERVER['REQUEST_URI'] ?? '',
      ]);
      json_out(403, ['error' => 'Invalid CSRF token']);
    }
  }
}
```

**Validering**:
- Läser `X-CSRF-Token` header från request
- Jämför med `$_SESSION['csrf']` (token i session)
- Om de **inte matchar**: returnerar HTTP 403 Forbidden
- Om de **matchar**: fortsätt

### 11.3 Method Check (rad 17-19)

```php
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}
```

### 11.4 Rate Limiting (rad 21-23)

```php
$rateWindowSeconds = 60;
$maxAttemptsPerWindow = 5;
rate_limit('login', $maxAttemptsPerWindow, $rateWindowSeconds);
```

**rate_limit() function** (bootstrap.php rad 251-271):
- Lagrar tidsstämplar i `$_SESSION['_rate']['login|<ip>']`
- Max 5 försök per 60 sekunder per IP
- Vid överskridning: HTTP 429 Too Many Requests

### 11.5 Input Parsing (rad 25-32)

```php
$body = read_json();  // Läser raw JSON från php://input
$email = isset($body['email']) ? trim((string)$body['email']) : '';
$pass  = isset($body['password']) ? (string)$body['password'] : '';

if ($email === '' || $pass === '') {
  log_event('api', 'login.missing_credentials');
  json_out(400, ['error' => 'Missing email or password']);
}
```

### 11.6 Database Query (rad 36-42)

```php
$sql = 'SELECT id, passwordHash FROM User WHERE email = ? LIMIT 1';
$stmt = db()->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  log_event('api', 'login.failed', ['reason' => 'user_not_found', 'email' => $email]);
  json_out(401, ['error' => 'Invalid credentials']);
}
```

**Database Connection** (bootstrap.php rad 53-89):
```php
function db(): mysqli {
  static $conn = null;
  if ($conn instanceof mysqli) {
    return $conn;
  }

  // Läser från environment variables eller config.php
  $host = getenv('DB_HOST');
  $name = getenv('DB_NAME');
  $user = getenv('DB_USER');
  $pass = getenv('DB_PASS');

  // Fallback till config.php
  if ((!$host || !$name || !$user) && file_exists(__DIR__ . '/config.php')) {
    $cfg = require __DIR__ . '/config.php';
    if (is_array($cfg)) {
      $host = $host ?: ($cfg['DB_HOST'] ?? null);
      $name = $name ?: ($cfg['DB_NAME'] ?? null);
      $user = $user ?: ($cfg['DB_USER'] ?? null);
      $pass = $pass ?: ($cfg['DB_PASS'] ?? null);
    }
  }

  $conn = @new mysqli($host, $user, $pass ?? '', $name);
  if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
  }
  $conn->set_charset('utf8mb4');
  return $conn;
}
```

**På Loopia**:
- Database credentials kommer från `api/config.php` eller miljövariabler
- MariaDB: `mysql513.loopia.se`
- Database: `medlemsregistret_se_db_4`

### 11.7 Password Verification (rad 48-51)

```php
if (!password_verify($pass, $row['passwordHash'])) {
  log_event('api', 'login.failed', ['reason' => 'invalid_password', 'email' => $email]);
  json_out(401, ['error' => 'Invalid credentials']);
}
```

**Password Hashing**:
- Använder PHP's `password_verify()`
- Stödjer bcrypt hashes (format: `$2y$10$...`)
- Password i database är **ALDRIG** klartext

### 11.8 Session Creation (rad 53-55)

```php
$_SESSION['uid'] = $row['id'];  // SPARAR USER ID I SESSION
log_event('api', 'login.success', ['userId' => $row['id']]);
json_out(200, ['ok' => true]);
```

**Kritiskt**:
- `$_SESSION['uid']` sätts till användarens ID från databasen
- Detta är **autentiseringsnyckeln** för alla framtida requests
- Sessionen sparas i: `/api/storage/sessions/sess_<PHPSESSID>`

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Set-Cookie: PHPSESSID=<session-id>; Path=/; Secure; HttpOnly; SameSite=Lax

{"ok":true}
```

---

## STEG 12: Frontend Efter Lyckad Login

**Tillbaka till**: `E:\projects\CRM\crm-app\lib\providers\auth-provider.tsx` (rad 105-124)

```tsx
const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
  try {
    await api.login(email, password)  // ✅ Lyckades - backend satte session

    // Skapa user-objekt för frontend
    const user: AuthSessionUser = {
      id: "user",
      email,
      name: email ? email.split("@")[0] ?? null : null,
      role: "ADMIN",
    }

    // Spara i localStorage
    writeStoredUser(user)

    // Uppdatera React state
    setSession({ user })
    setStatus("authenticated")

    return { ok: true }
  } catch (error) {
    // ...error handling
  }
}, [])
```

**Efter lyckad login**:
1. `localStorage["crm-auth-user"]` = user-objekt (JSON)
2. React state: `status = "authenticated"`
3. React state: `session.user` = user-objekt

**Tillbaka till**: `E:\projects\CRM\crm-app\app\login\page.tsx` (rad 46)

```tsx
router.replace("/associations")  // Navigerar till föreningssidan
```

---

## STEG 13: Associations Page Load

**Fil**: `E:\projects\CRM\crm-app\app\associations\page.tsx`

### 13.1 Auth Check (rad 179-182)

```tsx
useEffect(() => {
  if (status === "unauthenticated") {
    router.replace("/login")  // Om ej autentiserad: tillbaka till login
  }
}, [router, status])
```

**Om användaren är autentiserad**: fortsätt rendera sidan

### 13.2 Initial Data Load (rad 172-176)

```tsx
useEffect(() => {
  if (status === "authenticated") {
    void loadAssociations()  // Hämta föreningar från backend
  }
}, [loadAssociations, status])
```

### 13.3 loadAssociations Function (rad 144-170)

```tsx
const loadAssociations = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    // API-ANROP
    const result = await api.getAssociations(filters)

    // Hantera data
    const mapped: AssociationRecord[] = result.items.map((item) => ({
      ...item,
      tags: item.tags ?? [],
    }))
    setAssociations(mapped)
    setTotal(result.total)

    // Extrahera types och statuses för filter-dropdowns
    const types = Array.from(new Set(mapped.map((item) => item.type).filter(Boolean)))
    const statuses = Array.from(new Set(mapped.map((item) => item.status).filter(Boolean)))
    setAvailableTypes(types)
    setAvailableStatuses(statuses)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kunde inte hämta föreningar"
    if (message.toLowerCase().includes("not authenticated")) {
      await refresh()  // Om session har gått ut: försök refresh
    } else {
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    }
  } finally {
    setLoading(false)
  }
}, [filters, refresh, toast])
```

---

## STEG 14: API Call till Associations Endpoint

**Fil**: `E:\projects\CRM\crm-app\lib\api.ts` (rad 204-216)

### 14.1 api.getAssociations()

```tsx
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
}
```

**Initial request** (default filters):
```
GET https://crm.medlemsregistret.se/api/associations.php?page=1&pageSize=20&sort=updated_desc
```

**Request headers**:
```http
GET /api/associations.php?page=1&pageSize=20&sort=updated_desc HTTP/1.1
Host: crm.medlemsregistret.se
Cookie: PHPSESSID=<session-id>; csrf=<csrf-token>
```

**INGEN CSRF-header behövs** för GET-requests.

---

## STEG 15: Backend Associations Query

**Fil**: `E:\projects\CRM\api\associations.php`

### 15.1 Bootstrap & Auth Check (rad 28 & 53-54)

```php
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  require_auth();  // VERIFIERAR ATT ANVÄNDAREN ÄR INLOGGAD
  // ...
}
```

**require_auth() function** (bootstrap.php rad 165-172):
```php
function require_auth(): void {
  if (empty($_SESSION['uid'])) {  // Kollar om 'uid' finns i session
    log_event('api', 'auth.required_failed', [
      'path' => $_SERVER['REQUEST_URI'] ?? '',
    ]);
    json_out(401, ['error' => 'Not authenticated']);
  }
}
```

**Autentisering**:
1. PHP läser `PHPSESSID` cookie från request
2. Laddar session-data från `/api/storage/sessions/sess_<PHPSESSID>`
3. Kollar om `$_SESSION['uid']` är satt
4. Om **INTE satt**: HTTP 401 Unauthorized
5. Om **satt**: fortsätt med query

### 15.2 Filter Parsing (rad 55-86)

```php
$q            = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
$municipality = isset($_GET['municipality']) ? trim((string)$_GET['municipality']) : '';
$type         = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
$status       = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
$tagsRaw      = $_GET['tags'] ?? [];
$tags         = [];
if (is_array($tagsRaw)) {
  $tags = $tagsRaw;
} elseif ($tagsRaw !== '') {
  $tags = [$tagsRaw];
}

$page     = max(1, (int)($_GET['page'] ?? 1));
$pageSize = (int)($_GET['pageSize'] ?? 20);
if ($pageSize <= 0) $pageSize = 20;
if ($pageSize > 100) $pageSize = 100;
$offset = ($page - 1) * $pageSize;

$sortSql = order_by($_GET['sort'] ?? null);

log_event('api', 'associations.request', [
  'page' => $page,
  'pageSize' => $pageSize,
  'filters' => [
    'q' => $q !== '' ? $q : null,
    'municipality' => $municipality !== '' ? $municipality : null,
    'type' => $type !== '' ? $type : null,
    'status' => $status !== '' ? $status : null,
    'tags' => $tags,
  ],
]);
```

### 15.3 Database Query Construction (rad 88-141)

```php
$where = ['a.deletedAt IS NULL'];
$params = [];
$types = '';

// Text search filter
if ($q !== '') {
  $where[] = '(a.name LIKE CONCAT("%", ?, "%") OR a.description LIKE CONCAT("%", ?, "%"))';
  $params[] = $q; $types .= 's';
  $params[] = $q; $types .= 's';
}

// Municipality filter
if ($municipality !== '') {
  if (ctype_digit($municipality)) {
    $where[] = 'a.municipalityId = ?';
    $params[] = (int)$municipality; $types .= 'i';
  } else {
    $where[] = 'a.municipalityId IN (SELECT id FROM Municipality WHERE name = ?)';
    $params[] = $municipality; $types .= 's';
  }
}

// Type filter
if ($type !== '') {
  $where[] = 'a.types LIKE CONCAT("%", ?, "%")';
  $params[] = $type; $types .= 's';
}

// Status filter
if ($status !== '') {
  $where[] = 'a.crmStatus = ?';
  $params[] = $status; $types .= 's';
}

// Tags filter (join)
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
      $placeholders[] = '(SELECT id FROM Tag WHERE name = ?)';
      $tagTypes .= 's';
      $tagParams[] = (string)$t;
    }
  }
  $tagJoin = 'INNER JOIN _AssociationTags at ON at.A = a.id';
  $where[] = 'at.B IN (' . implode(',', $placeholders) . ')';
  $types .= $tagTypes;
  $params = array_merge($params, $tagParams);
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
```

### 15.4 Count Query (rad 143-154)

```php
$countSql = "SELECT COUNT(DISTINCT a.id) AS cnt
             FROM Association a
             $tagJoin
             $whereSql";
$stmt = db()->prepare($countSql);
if ($types !== '') {
  bind_all($stmt, $types, $params);
}
$stmt->execute();
$cntRes = $stmt->get_result()->fetch_assoc();
$total = (int)($cntRes['cnt'] ?? 0);
```

### 15.5 Items Query (rad 156-200)

```php
$sql = "SELECT a.id, a.name, a.municipalityId AS municipality_id, m.name AS municipality_name,
               a.types AS type, a.crmStatus AS status, a.email, a.phone,
               a.streetAddress AS address, a.homepageUrl AS website, a.description,
               a.createdAt AS created_at, a.updatedAt AS updated_at, a.deletedAt AS deleted_at
        FROM Association a
        LEFT JOIN Municipality m ON m.id = a.municipalityId
        $tagJoin
        $whereSql
        $sortSql
        LIMIT ? OFFSET ?";

$stmt2 = db()->prepare($sql);
$params2 = $params;
$types2 = $types . 'ii';
$params2[] = $pageSize;
$params2[] = $offset;
bind_all($stmt2, $types2, $params2);
$stmt2->execute();
$res = $stmt2->get_result();

$items = [];
$assocIds = [];
while ($row = $res->fetch_assoc()) {
  $id = (int)$row['id'];
  $assocIds[] = $id;
  $items[$id] = [
    'id' => $id,
    'name' => $row['name'],
    'municipality_id' => $row['municipality_id'] !== null ? (int)$row['municipality_id'] : null,
    'municipality_name' => $row['municipality_name'],
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
    'tags' => [],
  ];
}
```

### 15.6 Tags Query (rad 202-224)

```php
if (count($assocIds) > 0) {
  $placeholders = implode(',', array_fill(0, count($assocIds), '?'));
  $tagSql = "SELECT at.A AS association_id, t.id, t.name
             FROM _AssociationTags at
             INNER JOIN Tag t ON t.id = at.B
             WHERE at.A IN ($placeholders)
             ORDER BY t.name ASC";
  $stmtTags = db()->prepare($tagSql);
  $typesTags = str_repeat('i', count($assocIds));
  bind_all($stmtTags, $typesTags, $assocIds);
  $stmtTags->execute();
  $tagRes = $stmtTags->get_result();
  while ($tagRow = $tagRes->fetch_assoc()) {
    $aid = (int)$tagRow['association_id'];
    if (!isset($items[$aid])) {
      continue;
    }
    $items[$aid]['tags'][] = [
      'id' => (int)$tagRow['id'],
      'name' => $tagRow['name'],
    ];
  }
}
```

### 15.7 Response (rad 226-240)

```php
$items = array_values($items);

log_event('api', 'associations.response', [
  'page' => $page,
  'pageSize' => $pageSize,
  'returned' => count($items),
  'total' => $total,
]);

json_out(200, [
  'items' => $items,
  'total' => $total,
  'page' => $page,
  'pageSize' => $pageSize,
]);
```

**Response structure**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Fotbollsklubben",
      "municipality_id": 5,
      "municipality_name": "Stockholm",
      "type": "Idrottsförening",
      "status": "MEMBER",
      "email": "info@fotboll.se",
      "phone": "08-123456",
      "address": "Idrottsvägen 1",
      "website": "https://fotboll.se",
      "description": "...",
      "created_at": "2025-01-01 10:00:00",
      "updated_at": "2025-11-04 12:00:00",
      "deleted_at": null,
      "tags": [
        {"id": 1, "name": "Sport"},
        {"id": 2, "name": "Medlemsskap"}
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

---

## STEG 16: Frontend Rendering av Data

**Tillbaka till**: `E:\projects\CRM\crm-app\app\associations\page.tsx` (rad 148-154)

```tsx
const result = await api.getAssociations(filters)
const mapped: AssociationRecord[] = result.items.map((item) => ({
  ...item,
  tags: item.tags ?? [],
}))
setAssociations(mapped)
setTotal(result.total)
```

**UI uppdateras**:
- Lista med föreningar renderas i tabell (rad 543-604)
- Pagination controls (rad 608-630)
- Filter controls (rad 411-532)

---

## SAMMANFATTNING AV HELA FLÖDET

### Cookies som Används

| Cookie Name | Syfte | HttpOnly | Secure | SameSite | Set By |
|------------|-------|----------|--------|----------|--------|
| `PHPSESSID` | PHP session ID | ✅ true | ✅ true (på HTTPS) | Lax | bootstrap.php |
| `csrf` | CSRF token (läsbar av JS) | ❌ false | ✅ true (på HTTPS) | Lax | csrf.php |

### Session Storage

**Location**: `/api/storage/sessions/sess_<PHPSESSID>`

**Session innehåll**:
```php
[
  'uid' => 1,                    // User ID (sätts vid login)
  'csrf' => '64-char-hex-token', // CSRF token
  '_rate' => [                   // Rate limiting data
    'login|<ip>' => [timestamp1, timestamp2, ...]
  ]
]
```

### LocalStorage

**Key**: `"crm-auth-user"`

**Value** (JSON):
```json
{
  "id": "user",
  "email": "admin@example.com",
  "name": "admin",
  "role": "ADMIN"
}
```

**Syfte**:
- Endast för UI (visa användarens namn, email)
- **INTE för autentisering** (backend använder `$_SESSION['uid']`)

### Autentiseringsflöde (Step by Step)

1. **Användare besöker** `crm.medlemsregistret.se`
2. **React app laddar**, AuthProvider initialiserar
3. **AuthProvider läser** `localStorage["crm-auth-user"]` (tom vid första besök)
4. **AuthProvider kör refresh()** → anropar `api.getAssociations()` för session-verifiering
5. **Backend returnerar 401** (ingen session finns) → status = `"unauthenticated"`
6. **Root page visar** välkomstskärm med "Gå till inloggning"-länk
7. **Användare navigerar** till `/login`
8. **Användare fyller i** email + password
9. **Frontend anropar** `api.login(email, password)`
10. **Frontend hämtar CSRF token** (om den saknas) via `GET /api/csrf.php`
11. **Frontend gör POST** till `/api/login.php` med CSRF header
12. **Backend verifierar** CSRF token
13. **Backend verifierar** rate limiting
14. **Backend querier** database för användare med given email
15. **Backend verifierar** lösenord med `password_verify()`
16. **Backend sätter** `$_SESSION['uid']` = user ID
17. **Backend returnerar** `{"ok": true}`
18. **Frontend sparar** user-data i `localStorage`
19. **Frontend sätter** status = `"authenticated"`
20. **Frontend redirectar** till `/associations`
21. **Associations page laddar**, kör `api.getAssociations()`
22. **Backend verifierar** `$_SESSION['uid']` finns (autentiserad)
23. **Backend querier** associations från database
24. **Backend returnerar** data
25. **Frontend renderar** tabellen med föreningar

### Kritiska Säkerhetsmekanismer

1. **Session-baserad autentisering**
   - `PHPSESSID` cookie (HttpOnly, Secure, SameSite=Lax)
   - Session data lagras server-side
   - `$_SESSION['uid']` används för auth

2. **CSRF-skydd**
   - Token genereras i session
   - Token kopieras till non-HttpOnly cookie (så JS kan läsa)
   - Token skickas som `X-CSRF-Token` header vid POST/PUT/DELETE
   - Backend verifierar att header matchar session

3. **Rate limiting**
   - Max 5 login-försök per 60 sekunder per IP
   - Lagras i session

4. **Password hashing**
   - bcrypt hashes i database
   - `password_verify()` för verifiering

5. **HTTPS enforced**
   - Cookies endast säkra på HTTPS
   - `Secure` flag på alla cookies

### API Endpoints

| Endpoint | Method | Auth Required | CSRF Required | Syfte |
|----------|--------|---------------|---------------|-------|
| `/api/csrf.php` | GET | ❌ No | ❌ No | Hämta CSRF token |
| `/api/login.php` | POST | ❌ No | ✅ Yes | Logga in användare |
| `/api/logout.php` | POST | ✅ Yes | ✅ Yes | Logga ut användare |
| `/api/associations.php` | GET | ✅ Yes | ❌ No | Lista föreningar |
| `/api/associations.php` | POST | ✅ Yes | ✅ Yes | Skapa förening |
| `/api/associations.php` | PUT | ✅ Yes | ✅ Yes | Uppdatera förening |
| `/api/associations.php` | DELETE | ✅ Yes | ✅ Yes | Ta bort förening |
| `/api/tags.php` | GET | ✅ Yes | ❌ No | Lista taggar |
| `/api/tags.php` | POST | ✅ Yes | ✅ Yes | Skapa/koppla tagg |
| `/api/municipalities.php` | GET | ✅ Yes | ❌ No | Lista kommuner |
| `/api/association_notes.php` | GET | ✅ Yes | ❌ No | Lista anteckningar |
| `/api/association_notes.php` | POST | ✅ Yes | ✅ Yes | Skapa anteckning |

### Loggning

**Log file**: `/api/logs/remote-login.log`

**Log format**: JSON lines (JSONL)

**Exempel entries**:
```json
{"timestamp":"2025-11-04T10:30:00Z","source":"api","stage":"csrf.issued","sessionId":"abc123...","userId":null,"ip":"123.45.67.89","path":"/api/csrf.php","context":{}}
{"timestamp":"2025-11-04T10:30:05Z","source":"api","stage":"login.attempt","sessionId":"abc123...","userId":null,"ip":"123.45.67.89","path":"/api/login.php","context":{"email":"admin@example.com"}}
{"timestamp":"2025-11-04T10:30:05Z","source":"api","stage":"login.success","sessionId":"abc123...","userId":1,"ip":"123.45.67.89","path":"/api/login.php","context":{"userId":1}}
{"timestamp":"2025-11-04T10:30:10Z","source":"api","stage":"associations.request","sessionId":"abc123...","userId":1,"ip":"123.45.67.89","path":"/api/associations.php","context":{"page":1,"pageSize":20,"filters":{"q":null,"municipality":null,"type":null,"status":null,"tags":[]}}}
```

---

## POTENTIELLA PROBLEM OCH DEBUGGING

### Problem 1: 401 Unauthorized på associations.php

**Möjliga orsaker**:
1. **Session cookie inte skickad**
   - Kontrollera att `credentials: 'include'` finns i fetch
   - Kontrollera att cookies inte blockeras av browser
   - Kontrollera SameSite-policy

2. **Session har gått ut**
   - PHP session timeout (standard: 24 min)
   - Session files rensade

3. **Session domain mismatch**
   - Cookie domain settings
   - CORS-problem

### Problem 2: 403 CSRF Invalid

**Möjliga orsaker**:
1. **CSRF cookie inte läsbar**
   - Kontrollera `httponly: false` i csrf.php
   - Kontrollera `document.cookie` innehåller `csrf=...`

2. **CSRF token mismatch**
   - Session och cookie har olika tokens
   - Token har regenererats

3. **CSRF header saknas**
   - Kontrollera `X-CSRF-Token` header skickas
   - Kontrollera `needsCsrf: true` parametern

### Problem 3: Session persistence

**Möjliga orsaker**:
1. **Session path inte writable**
   - Kontrollera permissions på `/api/storage/sessions/`
   - Kontrollera disk space

2. **Session garbage collection**
   - PHP kan rensa gamla sessions
   - Kontrollera `session.gc_maxlifetime`

### Debug Checklist

När något går fel:

1. **Kontrollera browser cookies**:
   - F12 → Application → Cookies → crm.medlemsregistret.se
   - Verifiera: `PHPSESSID` och `csrf` finns

2. **Kontrollera localStorage**:
   - F12 → Application → Local Storage → crm.medlemsregistret.se
   - Verifiera: `crm-auth-user` finns och innehåller användardata

3. **Kontrollera Network requests**:
   - F12 → Network → filter på "login" eller "associations"
   - Kolla Request Headers (Cookie, X-CSRF-Token)
   - Kolla Response status och body

4. **Kontrollera backend logs**:
   - Läs `/api/logs/remote-login.log`
   - Leta efter fel-stadier: `login.failed`, `auth.required_failed`, `csrf.invalid`

5. **Kontrollera PHP session files**:
   - Lista filer i `/api/storage/sessions/`
   - Verifiera att session-filer skapas och innehåller `uid`

6. **Kontrollera database**:
   - Verifiera att User-tabellen innehåller korrekt email
   - Verifiera att passwordHash är bcrypt-format
   - Testa lösenord manuellt: `password_verify("password", $hash)`

---

## APPENDIX: Relevanta Filsökvägar

### Frontend
- `crm-app/app/layout.tsx` - Root layout med AuthProvider
- `crm-app/app/page.tsx` - Index page (redirect logic)
- `crm-app/app/login/page.tsx` - Login form
- `crm-app/app/associations/page.tsx` - Associations list
- `crm-app/lib/providers/auth-provider.tsx` - Auth state management
- `crm-app/lib/api.ts` - API client wrapper
- `crm-app/lib/backend-base.ts` - Backend URL resolution

### Backend
- `api/bootstrap.php` - Session, DB, helpers
- `api/csrf.php` - CSRF token endpoint
- `api/login.php` - Login endpoint
- `api/logout.php` - Logout endpoint
- `api/associations.php` - Associations CRUD
- `api/tags.php` - Tags management
- `api/municipalities.php` - Municipalities list
- `api/association_notes.php` - Notes management

### Config
- `.env` - Environment variables
- `.env.prod` - Production config
- `api/config.php` - Database credentials (generated)

### Logs & Sessions
- `api/logs/remote-login.log` - All login events
- `api/storage/sessions/` - PHP session files

---

**Dokumentet avslutat**. Detta täcker hela inloggningsflödet från start till slut.
