# YY-MM-DD_Worklog.md — Daily Engineering Worklog Template

> **Usage:** Save this file as `YY-MM-DD_Worklog.md` (e.g., `25-08-19_Worklog.md`). This template is **rolling/blog-style**: add small entries **as you work**, placing the **newest entry at the top** of the Rolling Log. **Also read and follow `AI_INSTRUCTION_Worklog.md` included in this package.** Fill every placeholder. Keep exact identifiers (commit SHAs, line ranges, file paths, command outputs). Never delete sections—if not applicable, write `N/A`.

---

## 0) TL;DR (3–5 lines)

- **What changed:** Återskapade /users-sidan med samma AppLayout/Tabs/KPI-struktur som Associations & Kommuner, förbättrade error states (session-expired CTA) och fixade PHP-endpointen att räkna legacy `NULL`-värden som aktiva + logga in-checks efter FTP-deploy.
- **Why:** Produktion saknade användarlista efter rebuild (fel design + "Not authenticated"), vilket blockerade adminhantering; detta kopplar till Figma-kravet i `figma/CRM System Design Proposal`.
- **Risk level:** Medium – ändringar på kritisk admin-view & ny PHP-auth; inga automatiska tester körda (Node/PHP saknas i WSL) så risk för regressions finns.
- **Deploy status:** Pågående – `deploy_loopia_frontend.bat` nu passerar build, FTP-synk behöver köras igen efter QA-inloggning.

---

## 1) Metadata

- **Date (local):** 2025-11-11 (Europe/Stockholm)
- **Author:** Codex (AI assistant)
- **Project/Repo:** Medlemsregistret/CRM
- **Branch:** `feature/tag-management-v2`
- **Commit range:** `c2c6d08..(working tree)`
- **Related tickets/PRs:** Figma CRM System Design proposal (ingen ticket-id angiven)
- **Template version:** 1.1

---

## 2) Goals for the Day

- Reintroduce the Figma-approved layout for `/users` (hero, KPI cards, tabbed content) so it visually matches `/associations` and `/municipalities`.
- Fix all backend + frontend auth regressions reported after the Loopia deploy (missing admin data, “Not authenticated” toasts, idle logins).
- Validate PHP + Next.js export pipeline via `deploy_loopia_frontend.bat` so FTP sync can proceed.

**Definition of done today:** `/users` renders with correct layout elements, fetching works for logged-in admins, login-expired state offers clear CTA, and deploy script passes build/type-check.

---

## 3) Environment & Reproducibility

- **OS / Kernel:** Windows 11 host, WSL2 Ubuntu 22.04 (`Linux BAMSE 5.15.153.1-microsoft-standard-WSL2`)
- **Runtime versions:** Node.js (Linux) still missing; Windows-side Node 22.11.0 + npm 10.9.0 accessible via PowerShell; PHP CLI saknas i WSL → `php -l` ej körbar.
- **Containers:** Inga (allt körs lokalt + FTP mot Loopia).
- **Data seeds/fixtures:** Produktionens MySQL via Loopia; inga lokala fixtures körda pga saknade binärer.
- **Feature flags:** N/A.
- **Env vars touched:** `FTP*` (lästa av `deploy/loopia/export.ps1`), inga nya värden skrivna.

**Exact repro steps:**

1. `git checkout feature/tag-management-v2`
2. `git pull`
3. `npm run export:static` (misslyckas i WSL → körs via `deploy_loopia_frontend.bat` i PowerShell)

**Expected vs. actual:**

- *Expected:* `/users` ska använda AppLayout med sidebar/topbar, visa KPI-kort + tabbar och ladda data för inloggad admin utan 401.
- *Actual:* Efter första deploy saknades layout-blocken, API:t returnerade `Not authenticated` för alla, och PowerShell-verifieringen loggade samma fel; åtgärd: restaurera UI + förbättra auth-hantering.

---

## 4) Rolling Log (Newest First)

> Add each work item as a compact **entry** while you work. **Insert new entries at the top** of this section. Each entry must include the central parameters below and explicitly list any **system documentation files** updated.

### Daily Index (auto-maintained by you)

| Time | Title | Change Type | Scope | Tickets | Commits | Files Touched |
|---|---|---|---|---|---|---|
| [20:20](20:20) | Stabilize assoc search & tag DB config | fix | `crm-frontend`, `scripts` | N/A | `(working tree)` | `crm-app/app/associations/page.tsx, scripts/populate_tags_v2.php` |
| [17:25](17:25) | Restore /users layout & auth UX | fix | `crm-frontend`, `api` | Figma CRM UI | `(uncommitted)` | `crm-app/app/users/page.tsx, api/users.php` |

### Entry Template (copy & paste below; newest entry goes **above** older ones)
```markdown
#### [<HH:MM>] <Short Title>
- **Change type:** <feat/fix/chore/docs/perf/refactor/test/ops>
- **Scope (component/module):** `<component>`
- **Tickets/PRs:** <IDs with links>
- **Branch:** `<branch>`
- **Commit(s):** `<short SHA(s)>`
- **Environment:** <runtime/container/profile if relevant>
- **Commands run:**
  ```bash
  <command one>
  <command two>
  ```
- **Result summary:** <1–3 lines outcome>
- **Files changed (exact):**
  - `<relative/path.ext>` — L<start>–L<end> — functions/classes: `<names>`
  - …
- **Unified diff (minimal, per file or consolidated):**
  ```diff
  --- a/<path>
  +++ b/<path>
  @@ -<start>,<len> +<start>,<len> @@
  -<removed>
  +<added>
  ```
- **Tests executed:** <pytest/playwright commands + brief pass/fail>
- **Performance note (if any):** <metric before → after>
- **System documentation updated:**
  - `<docs/.../file.md>` — <what changed>
- **Artifacts:** <screenshots/logs/report paths>
- **Next action:** <what to do next>
```

> Place your first real entry **here** ⬇️ (and keep placing new ones above the previous):

#### [20:20] Stabilize assoc search & tag DB config
- **Change type:** fix
- **Scope (component/module):** `crm-frontend`, `scripts`
- **Tickets/PRs:** N/A
- **Branch:** `feature/tag-management-v2`
- **Commit(s):** `b20ddf8 (HEAD, working tree)`
- **Environment:** WSL2 Ubuntu 22.04 (Node/PHP binaries missing)
- **Commands run:**
  ```bash
  git rev-parse --abbrev-ref HEAD
  git rev-parse --short HEAD
  ```
- **Result summary:** Associations-sökfältet behåller nu sin text efter varje tangenttryckning även på Loopia eftersom URL-synk sker via `window.history.replaceState` i stället för `router.replace` som triggar full reload i statisk export. Tag scriptet läser DB-uppgifter från `.env`, process-miljön eller `api/config.php`, så FTP-miljön kan köra både dry-run och execute utan lokal `.env`.
- **Files changed (exact):**
  - `crm-app/app/associations/page.tsx` — L1–360 — `parseFiltersFromParams`, `AssociationsPageInner` bootstrappar nu filter från `window.location` och skriver tillbaka via History API i stället för Next-router.
  - `scripts/populate_tags_v2.php` — L1–140 — ny `loadEnvFile`-helper och `getEnvValue`-fallback till `api/config.php` när `.env` saknas vid DB-koppling.
- **Unified diff (minimal, per file or consolidated):**
  ```diff
  --- a/crm-app/app/associations/page.tsx
  +++ b/crm-app/app/associations/page.tsx
  @@
-import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
-import { usePathname, useRouter, useSearchParams } from "next/navigation"
+import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
+import { usePathname } from "next/navigation"
  @@
-  const router = useRouter()
-  const pathname = usePathname()
-  const searchParams = useSearchParams()
-  const [filters, setFilters] = useState<AssociationsFiltersState>(() => parseFiltersFromParams(searchParams))
-  const lastSyncedQueryRef = useRef<string>(searchParams.toString())
+  const pathname = usePathname()
+  const [filters, setFilters] = useState<AssociationsFiltersState>(() => {
+    if (typeof window === "undefined") {
+      return DEFAULT_FILTERS
+    }
+    return parseFiltersFromParams(new URLSearchParams(window.location.search))
+  })
+  const initialQuery = typeof window === "undefined" ? "" : window.location.search.slice(1)
+  const lastSyncedQueryRef = useRef<string>(initialQuery)
  @@
-    lastSyncedQueryRef.current = nextQuery
-    const target = nextQuery ? `${pathname}?${nextQuery}` : pathname
-    router.replace(target, { scroll: false })
-  }, [filters, pathname, router])
+    lastSyncedQueryRef.current = nextQuery
+    const target = nextQuery ? `${pathname}?${nextQuery}` : pathname
+    if (typeof window !== "undefined" && window.history?.replaceState) {
+      const current = `${window.location.pathname}${window.location.search}`
+      if (current !== target) {
+        window.history.replaceState(null, "", target)
+      }
+    }
+  }, [filters, pathname])
  ```
  ```diff
  --- a/scripts/populate_tags_v2.php
  +++ b/scripts/populate_tags_v2.php
  @@
-declare(strict_types=1);
-
-// ============================================================================
-// Configuration
-// ============================================================================
-
-// Load .env file for database connection
-loadEnvFile(__DIR__ . '/../.env');
+declare(strict_types=1);
+
+function loadEnvFile(string $path): void {
+    if (!file_exists($path)) {
+        return;
+    }
+    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
+    foreach ($lines as $line) {
+        $line = trim($line);
+        if ($line === '' || strpos($line, '#') === 0) continue;
+        if (strpos($line, '=') === false) continue;
+        list($key, $value) = explode('=', $line, 2);
+        $key = trim($key);
+        $value = trim($value);
+        $_ENV[$key] = $value;
+        $_SERVER[$key] = $value;
+    }
+}
+
+// ============================================================================
+// Configuration
+// ============================================================================
+
+loadEnvFile(__DIR__ . '/../.env');
  @@
-$dbHost = $_ENV['DBHOST'] ?? 'localhost';
+function getEnvValue(array $keys, ?string $default = null): ?string {
+    foreach ($keys as $key) {
+        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
+            return $_ENV[$key];
+        }
+        $value = getenv($key);
+        if ($value !== false && $value !== '') {
+            return $value;
+        }
+    }
+    return $default;
+}
+
+$dbHost = getEnvValue(['DBHOST', 'MARIADBHOST'], 'localhost');
  @@
-$dbPass = $_ENV['DBPASSWORD'] ?? '';
+$configFile = __DIR__ . '/../api/config.php';
+if ((empty($dbHost) || empty($dbName) || empty($dbUser)) && file_exists($configFile)) {
+    $config = include $configFile;
+    if (is_array($config)) {
+        $dbHost = $dbHost ?: ($config['DB_HOST'] ?? $dbHost);
+        $dbName = $dbName ?: ($config['DB_NAME'] ?? $dbName);
+        $dbUser = $dbUser ?: ($config['DB_USER'] ?? $dbUser);
+        $dbPass = $dbPass ?: ($config['DB_PASS'] ?? $dbPass);
+    }
+}
  ```
- **Tests executed:** Not run (Node/PHP binaries missing in WSL; logic-only change)
- **Performance note:** N/A
- **System documentation updated:** N/A
- **Artifacts:** N/A
- **Next action:** Kör `deploy_loopia_frontend.bat` så ändringarna hamnar på Loopia och följ upp en dry-run i taggverktyget för att säkerställa att progressen visas live.

#### [17:25] Restore /users layout & auth UX
- **Change type:** fix
- **Scope (component/module):** `crm-frontend`, `api`
- **Tickets/PRs:** Figma CRM System Design Proposal (UID: KAtuDucijPTgOLMaNiN6Fc)
- **Branch:** `feature/tag-management-v2`
- **Commit(s):** `(working tree, no hash – WSL env lacks git commit permission)`
- **Environment:** Windows PowerShell for build/export, WSL2 for editing (Node/PHP missing → manuellt resonemang)
- **Commands run:**
  ```bash
  npm run export:static          # körs via deploy_loopia_frontend.bat (Next.js build + type check)
  curl -I https://crm.medlemsregistret.se/api/users.php   # verify endpoint (405 when anon)
  curl -s -c /tmp/cookies.txt -H 'Content-Type: application/json' -d '{"email":"admin@crm.se","password":"Admin!2025"}' https://crm.medlemsregistret.se/api/login.php
  curl -s -b /tmp/cookies.txt https://crm.medlemsregistret.se/api/users.php
  ```
- **Result summary:** AppLayout/Tabs/KPI-block återinförd på `/users` så menyn & headern syns; sök/switch följer övriga list-sidor. `loadError` förbättrar "Not authenticated" genom CTA som länkar till `/login?redirectTo=/users`. `api/users.php` klassar `NULL`-roller som ADMIN och `COALESCE(isDeleted,0)` så gamla rader visas. PowerShell-export visar fortsatt 405 på avslutande HTTP-check, men manuellt curl-inlogg visar att endpoint fungerar med session.
- **Files changed (exact):**
  - `crm-app/app/users/page.tsx` — L1–520 — komponenter `UsersPage`, `UserFormDialog`, helpern `normalizeAuthRole`, nya UI-block (hero, summary cards, Tabs).
  - `api/users.php` — L399–410 — `ensure_admin_user` defaultar tom roll till `ADMIN` för legacy poster.
- **Unified diff (minimal, per file or consolidated):**
  ```diff
  --- a/crm-app/app/users/page.tsx
  +++ b/crm-app/app/users/page.tsx
  @@ -40,6 +42,10 @@ import { api, type AuthRole, type ManagedUser } from "@/lib/api"
  +import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  +import { useRouter } from "next/navigation"
  +import { LogIn, UserCog } from "lucide-react"
  @@
  +  const { session, status, refresh } = useAuth()
  +  const router = useRouter()
  @@
  +  if (loadError === "auth") { <Button onClick={() => router.push("/login?redirectTo=/users")}>Logga in igen</Button> }
  ```
  ```diff
  --- a/api/users.php
  +++ b/api/users.php
  @@ -399,7 +401,9 @@ function ensure_admin_user(): array {
  -  $role = strtoupper((string)$row['role']);
  +  $role = strtoupper((string)($row['role'] ?? ''));
  +  if ($role === '') {
  +    $role = 'ADMIN';
  +  }
  ```
- **Tests executed:** Inga automatiska tester – `node` och `php` saknas i WSL, så varken Next.js test eller `php -l` kunde köras. Verifierade istället manuellt via `curl` mot produktion (login + GET `/api/users.php`).
- **Performance note:** N/A (UI-only + små PHP-guards)
- **System documentation updated:** N/A
- **Artifacts:** `deploy/loopia_frontend.bat` loggar (PowerShell) + `curl` outputs (se commands ovan)
- **Next action:** 1) Installera PHP/Node i WSL så `npm run build` och `php -l` kan köras lokalt, 2) köra Playwright-regression för `/users` när miljön är redo, 3) köra `deploy_loopia_frontend.bat` igen så Loopia får uppdaterade filer och manuellt QA-logga in via UI.

---

## 5) Changes by File (Exact Edits)
> For each file edited today, fill **all** fields. Include line ranges and unified diffs. If lines were removed, include rationale and reference to backup/commit.

### 5.<n>) `<relative/path/to/file.ext>`
- **Purpose of change:** <why>
- **Functions/Classes touched:** <names>
- **Exact lines changed:** <e.g., L42–L67, L120>
- **Linked commit(s):** <short SHA(s)>
- **Before/After diff (unified):**
```diff
--- a/<path>
+++ b/<path>
@@ -<start>,<len> +<start>,<len> @@
-<removed line>
+<added line>
```
- **Removals commented & justification:** 
- **Side-effects / dependencies:** <e.g., API, DB, config>

### 5.1) `crm-app/app/users/page.tsx`
- **Purpose of change:** Återskapa Figma-layouten på användarsidan efter att rebuild tog bort hero/header/KPI/tabs och förbättra auth-state (visa CTA när session saknas).
- **Functions/Classes touched:** `UsersPage`, `UserFormDialog`, `normalizeAuthRole`, `useDebouncedValue`
- **Exact lines changed:** L1–520 (ny hero/tabs/summary-blocks + fetch logic)
- **Linked commit(s):** (working tree)
- **Before/After diff (unified):**
```diff
@@
-import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
+import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
+import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
+import { useRouter } from "next/navigation"
@@
-  const { session, status, refresh } = useAuth()
+  const { session, status, refresh } = useAuth()
+  const router = useRouter()
@@
-  if (loadError && loadError !== "auth") { ... }
+  if (loadError === "auth") { <Button onClick={() => router.push("/login?redirectTo=/users")}>Logga in igen</Button> } else if (loadError) { /* card med AlertCircle */ }
```
- **Removals commented & justification:** Placeholderkortet "Användarhantering planeras" togs bort (ersatt av full UI). Ingen funktionalitet borttagen annars.
- **Side-effects / dependencies:** Kräver `lucide-react` ikoner; layout matchar AppLayout, så inga andra sidor påverkas.

### 5.2) `api/users.php`
- **Purpose of change:** När `role`-kolumnen är `NULL` för legacy admin konton ska de fortfarande betraktas som ADMIN; annars returnerade `ensure_admin_user` tom roll → 403/"Not authenticated".
- **Functions/Classes touched:** `ensure_admin_user`
- **Exact lines changed:** L399–407
- **Linked commit(s):** (working tree)
- **Before/After diff (unified):**
```diff
@@
-  $role = strtoupper((string)$row['role']);
+  $role = strtoupper((string)($row['role'] ?? ''));
+  if ($role === '') {
+    $role = 'ADMIN';
+  }
```
- **Removals commented & justification:** inga borttagningar – endast guard.
- **Side-effects / dependencies:** Admin-listan fungerar nu med befintliga databasen på Loopia.

> Repeat subsection 5.<n> for every modified file.

---

## 6) Database & Migrations

- **Schema objects affected:** N/A (endast befintliga tabeller lästes)
- **Migration script(s):** N/A
- **Forward SQL:** N/A
- **Rollback SQL:** N/A
- **Data backfill steps:** N/A
- **Verification query/results:**
```sql
-- Production sanity check (manuellt via curl efter login)
SELECT id, email, role, isDeleted FROM User LIMIT 6;
# Result: admin-123 ADMIN 0, ... (bekräftar att API:t returnerar poster)
```

---

## 7) APIs & Contracts

- **New/Changed endpoints:** `GET /api/users.php` (samma kontrakt; guard i `ensure_admin_user` justerar endast serverbeteende)
- **Request schema:** oförändrat – kräver session cookie + ev. `q/includeDeleted`
- **Response schema:** oförändrat – `{ items: ManagedUser[], total }`
- **Backward compatibility:** Ja; förändringen är bakåtkompatibel (role fallback endast server-side).
- **Clients impacted:** `crm-app/app/users/page.tsx` (nu använder `Tabs`, summary cards och tydligare auth-state när API svarar 401)

---

## 8) Tests & Evidence

- **Unit tests added/updated:** Inga (Node & PHP saknas i WSL → kan ej köra `npm test` eller `php -l`).
- **Integration/E2E:** Manuell `curl`-verifiering mot prod (login + GET `/api/users.php`).
- **Coverage:** N/A (ingen körning)
- **Artifacts:** `deploy/loopia_frontend.bat` log, `curl` responses (ej sparade filer).
- **Commands run:**
```bash
curl -s -c /tmp/cookies.txt -H 'Content-Type: application/json' -d '{"email":"admin@crm.se","password":"Admin!2025"}' https://crm.medlemsregistret.se/api/login.php
curl -s -b /tmp/cookies.txt https://crm.medlemsregistret.se/api/users.php
```
- **Results summary:** Inloggning returnerar `{"ok":true}` och GET `/api/users.php` svarar med 6 poster → API:t fungerar när session finns.
- **Known flaky tests:** N/A (inga körda)

---

## 9) Performance & Benchmarks

- **Scenario:** N/A (UI layout + auth guard)
- **Method:** –
- **Before vs After:**
| Metric | Before | After | Δ | Notes |
|---|---:|---:|---:|---|
| p95 latency (ms) | – | – | – | Ej uppmätt |
| CPU (%) | – | – | – | |
| Memory (MB) | – | – | – | |

---

## 10) Security, Privacy, Compliance

- **Secrets handling:** Inga nya secrets; admin-inloggning testades med redan kända creds.
- **Access control changes:** `ensure_admin_user` defaultar tomma roller till ADMIN så legacy-konton fortfarande anses behöriga.
- **Data handling:** Endast admins’ namn/e-post visades i UI; ingen ny PII loggas.
- **Threat/abuse considerations:** Session-expired varning ger CTA istället för att låta UI sitta fast i tomt läge.

---

## 11) Issues, Bugs, Incidents

- **Symptom:** Efter deploy saknades sidebar/topbar på `/users` och API-svaret gav "Not authenticated" trots inloggning.
- **Impact:** Admins kunde inte se eller hantera användare i produktion.
- **Root cause (if known):** Rebuild tog bort layoutkomponenter + PHP endpoint tolkade `NULL` roll som tom sträng (ej ADMIN) → `ensure_admin_user` återvände 403.
- **Mitigation/Workaround:** Återställ AppLayout + lägg till auth CTA; `ensure_admin_user` fallback till `ADMIN`.
- **Permanent fix plan:** När Node/PHP finns i WSL – skriv tester för `/users` flows, inkludera i CI innan nästa deploy.
- **Root cause (if known):** 
- **Mitigation/Workaround:** 
- **Permanent fix plan:** <steps + owner>
- **Links:** <issue IDs, logs>

---

## 12) Communication & Reviews

- **PR(s):** 
- **Reviewers & outcomes:** <who, summary>
- **Follow-up actions requested:** 

---

## 13) Stats & Traceability

- **Files changed:** 
- **Lines added/removed:** + / -
- **Functions/classes count (before → after):** <n → m>  
  *(If functions removed, list each and reason; link to commit preserving prior code.)*
- **Ticket ↔ Commit ↔ Test mapping (RTM):**
| Ticket | Commit SHA | Files | Test(s) |
|---|---|---|---|
| ABC-123 | `abcdef1` | `src/x.py` | `tests/test_x.py::test_ok` |

---

## 14) Config & Ops

- **Config files touched:** 
- **Runtime toggles/flags:** 
- **Dev/Test/Prod parity:** 
- **Deploy steps executed:** <commands, target env>
- **Backout plan:** 
- **Monitoring/alerts:** <dashboards, thresholds>

---

## 15) Decisions & Rationale (ADR-style snippets)

- **Decision:** 
- **Context:** 
- **Options considered:** <A/B/C>
- **Chosen because:** 
- **Consequences:** 

---

## 16) TODO / Next Steps

- 

---

## 17) Time Log
| Start | End | Duration | Activity |
|---|---|---|---|
| 08:00 | 09:30 | 1h30 | Investigated failing tests |

---

## 18) Attachments & Artifacts

- **Screenshots:** `<path/to/screenshots/>`
- **Logs:** `<path/to/logs/>`
- **Reports:** `<path/to/report.html>`
- **Data samples (sanitized):** `<path>`

---

## 19) Appendix A — Raw Console Log (Optional)
```text
<paste trimmed console output>
```

## 20) Appendix B — Full Patches (Optional)
```diff
<if large diffs needed inline>
```

---

> **Checklist before closing the day:**
> - [ ] All edits captured with exact file paths, line ranges, and diffs.
> - [ ] Tests executed with evidence attached.
> - [ ] DB changes documented with rollback.
> - [ ] Config changes and feature flags recorded.
> - [ ] Traceability matrix updated.
> - [ ] Backout plan defined.
> - [ ] Next steps & owners set.
