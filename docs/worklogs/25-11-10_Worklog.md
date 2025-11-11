# Worklog 2025-11-10

## 0) TL;DR (3–5 lines)

- **What changed:** Hardened the static export pipeline so `.rsc` payloads are copied beside every prerendered HTML file, ensured `/groups/detail` also emits `index.txt`, and drafted a Playwright regression spec that proves the bug once Node runs locally.
- **Why:** Production HARs show every `_rsc` request 404s, breaking SPA navigation; we need both tooling and test coverage before redeploying.
- **Risk level:** Medium – exporter touches every route and a failing script would break deliveries; tests still pending due to Node absence.
- **Deploy status:** Not started (awaiting Node install, export rerun, Playwright evidence, then redeploy via `deploy_loopia_frontend.bat`).

---

## 1) Metadata

- **Date (local):** 2025-11-10 (Europe/Stockholm)
- **Author:** Codex (AI assistant)
- **Project/Repo:** Medlemsregistret/CRM
- **Branch:** `dev`
- **Commit range:** `c2c6d08..(working tree)`
- **Related tickets/PRs:** N/A (untracked prod hotfix stream)
- **Template version:** 1.1

---

## 2) Goals for the Day

- Identify why statically exported Loopia build never serves `/groups/detail/index.txt` and fix exporter.
- Ensure post-export hook creates both HTML and RSC artifacts for the query-param detail route.
- Capture a regression Playwright scenario that fails today (missing RSC) so we can prove the fix later.

**Definition of done today:** Export scripts updated + regression spec authored + blockers documented for Node/test execution.

---

## 3) Environment & Reproducibility

- **OS / Kernel:** Windows 11 host + WSL2 Ubuntu 22.04 (`Linux BAMSE 5.15.153.1-microsoft-standard-WSL2`)
- **Runtime versions:** Node.js (Linux) = _missing_; Windows `npm` 10.9.0 + Node 22.11.0 accessible only via `/mnt/c`, but unusable from WSL because `npm` wrapper bails out with "WSL 1 is not supported" → exporter cannot run inside WSL.
- **Containers:** None (local filesystem only)
- **Data seeds/fixtures:** Current `.next` build + HAR captures under `logs/loopia_e2e.har`
- **Feature flags:** N/A
- **Env vars touched:** None (read-only)

**Exact repro steps:**

1. `git checkout dev`
2. `npm run export:static` (from `crm-app/` inside WSL)
3. Observe failure: `WSL 1 is not supported. Please upgrade to WSL 2 or above. Could not determine Node.js install directory.`

**Expected vs. actual:**

- *Expected:* `npm run export:static` produces `crm-app/out/**/index.html` + matching `index.txt` per route.
- *Actual:* Command fails before running `next build`, so no new export/test artifacts; direct `node scripts/create-static-out.mjs` also fails with `node: command not found` because Linux Node runtime is absent.

---

## 4) Rolling Log (Newest First)

### Daily Index (auto-maintained by you)

| Time | Title | Change Type | Scope | Tickets | Commits | Files Touched |
|---|---|---|---|---|---|---|
| [18:35](18:35) | Fix user endpoint to include legacy null isDeleted rows | fix | `api` | N/A | `(uncommitted)` | `api/users.php` |
| [17:59](17:59) | Admin UI & PHP API for userhantering | feat | `crm-frontend, api` | N/A | `(uncommitted)` | `api/users.php, crm-app/lib/api.ts, crm-app/app/users/page.tsx` |
| [15:40](15:40) | Exporter now copies .rsc + groups detail gets index.txt; added failing Playwright spec | fix | `build-tooling, e2e-tests` | N/A | `(uncommitted)` | `crm-app/scripts/create-static-out.mjs, crm-app/scripts/post-export.js, web/tests/groups-detail-navigation.spec.ts` |

#### [18:35] Fix: Visa även legacy-användare med NULL i isDeleted
- **Change type:** fix
- **Scope (component/module):** `api`
- **Tickets/PRs:** N/A
- **Branch:** `dev`
- **Commit(s):** working tree
- **Environment:** WSL2 (fortfarande utan php/node, ändring ej körd)
- **Commands run:**
  ```bash
  php -l api/users.php   # fortfarande: php: command not found
  ```
- **Result summary:** Orsaken till att listan var tom efter rebuild var att äldre poster i `User`-tabellen har `isDeleted = NULL`. Min ursprungliga fråga filtrerade med `WHERE isDeleted = 0`, vilket exkluderade samtliga befintliga användare. Uppdaterade SQL-selects och villkor (listning, get-by-id, admin-kontroll, soft delete/restore) till att behandla `NULL` som aktiv (via `COALESCE`/`... OR isDeleted IS NULL`). Nu returnerar endpointen även legacy-poster och hindrar inte adminkoll.
- **Files changed (exact):**
  - `api/users.php` — L67, L85-94, L99, L122, L201, L301, L315, L347-361, L434, L478 – alla ställen använder numera `COALESCE(isDeleted,0)` och villkoret `(isDeleted = 0 OR isDeleted IS NULL)`; också säkerhetskollen `ensure_other_admin_exists` räknar admin med `NULL`.
- **Unified diff (minimal):**
  ```diff
  -  if (!$includeDeleted) {
  -    $conditions[] = 'isDeleted = 0';
  +  if (!$includeDeleted) {
  +    $conditions[] = '(isDeleted = 0 OR isDeleted IS NULL)';
  +  }
  ...
  -            role,
  -            isDeleted,
  +            role,
  +            COALESCE(isDeleted, 0) AS isDeleted,
  ...
  -  $stmt = db()->prepare('SELECT id, ... , role, isDeleted, ... FROM User WHERE id = ?');
  +  $stmt = db()->prepare('SELECT id, ... , role, COALESCE(isDeleted,0) AS isDeleted, ...');
  ...
  -  if ((int)$row['isDeleted'] === 1) {
  +  if ((int)($row['isDeleted'] ?? 0) === 1) {
  ```
- **Tests executed:** Ej möjliga – `php` saknas i WSL (samma blocker som tidigare), så ingen lint eller integrationstest körd.
- **Next action:** När PHP-cli finns, kör `php -l api/users.php` och manuellt testa `/api/users.php` så att admin-listan returnerar minst standardanvändaren.

#### [17:59] Admin UI och PHP-endpoint för användarhantering
- **Change type:** feat
- **Scope (component/module):** `crm-frontend`, `api`
- **Tickets/PRs:** N/A (direkt användarönskemål)
- **Branch:** `dev`
- **Commit(s):** Arbete i working tree (ej committat)
- **Environment:** WSL2 (saknar både Node.js och PHP-cli lokalt → endast statisk kodgenomgång)
- **Commands run:**
  ```bash
  php -l api/users.php   # misslyckas: php: command not found
  node -v               # misslyckas: node: command not found
  ```
- **Result summary:** Implementerade ett nytt `api/users.php`-endpoint med listning, sökning, filter för soft delete, CRUD, lösenords-hashning och rollkontroller (kräver admin och förhindrar att sista admin tas bort). Uppdaterade `lib/api.ts` med Typed-funktioner (`getUsers`, `createUser`, `updateUser`, `deleteUser`, `restoreUser`) samt den nya `ManagedUser`-typen. Byggde hela sidan `app/users/page.tsx` med tabell (checkboxar, rollbadges, sök, visa raderade), modaler för lägg till/redigera inklusive lösenordsfält och confirm-dialog för soft delete/återställning.
- **Files changed (exact):**
  - `api/users.php` — L1–369 — nytt endpoint med `ensure_admin_user`, rollvalidering, CRUD-handlers, sökfilter, soft delete/restore och e-post-unikhet.
  - `crm-app/lib/api.ts` — L33–59, L450–517 — la till `ManagedUser`-typ + klientmetoder för user CRUD och export av nya funktioner.
  - `crm-app/app/users/page.tsx` — hela filen ersatt — skapade UI med tabell, sök, toggles, React Hook Form/zod-dialog, återställning och toasts.
- **Unified diff (minimal, per file):**
  ```diff
  +<?php
  +require __DIR__ . '/bootstrap.php';
  +$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
  +switch ($method) {
  +  case 'GET':
  +    if (isset($_GET['id']) && $_GET['id'] !== '') { handle_get_user(); } else { handle_list_users(); }
  +    break;
  +  ...
  +function handle_create_user(array $body): void {
  +  ensure_admin_user();
  +  require_csrf();
  +  $passwordHash = password_hash($password, PASSWORD_BCRYPT);
  +  $id = generate_id();
  +  $stmt = db()->prepare('INSERT INTO User (id, name, email, role, passwordHash, isDeleted, createdAt, updatedAt)
  +          VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())');
  +```
  ```diff
  +export interface ManagedUser {
  +  id: string;
  +  name: string | null;
  +  email: string | null;
  +  role: AuthRole;
  +  isDeleted: boolean;
  +  deletedAt: string | null;
  +  createdAt: string | null;
  +  updatedAt: string | null;
  +}
  +
  +  async getUsers(params: { q?: string; includeDeleted?: boolean } = {}): Promise<ManagedUser[]> { ... }
  +  async createUser(...): Promise<{ id: string }> { ... }
  +  async updateUser(...): Promise<{ success: boolean }> { ... }
  +  async deleteUser(id: string): Promise<{ success: boolean }> { ... }
  +  async restoreUser(id: string): Promise<{ success: boolean }> { ... }
  ```
  ```diff
  +"use client"
  +
  +import { useCallback, useEffect, useMemo, useState } from "react"
  +import { AppLayout } from "@/components/layout/app-layout"
  +import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  +import { api, type AuthRole, type ManagedUser } from "@/lib/api"
  +...
  +export default function UsersPage() {
  +  const { session, status } = useAuth()
  +  const [users, setUsers] = useState<ManagedUser[]>([])
  +  const [search, setSearch] = useState("")
  +  const [showDeleted, setShowDeleted] = useState(false)
  +  ...
  +  return (
  +    <AppLayout title="Användarhantering" description="Administrera åtkomst och roller" actions={...}>
  +      <Card>... tabell med checkboxar, rollbadges och åtgärdsknappar ...</Card>
  +      <UserFormDialog ... />
  +      <AlertDialog ... />
  +    </AppLayout>
  +  )
  +}
- **Tests executed:** Inga automatiserade tester – både `node` och `php` saknas i WSL-miljön (`node: command not found`, `php: command not found`), så varken Next.js build, Playwright eller `php -l` kan köras lokalt.
- **Performance note:** Ingen påverkan – endast nya API-querys och UI-state.
- **System documentation updated:** Ej ändrat i docs (UI förklaras via kod).
- **Artifacts:** N/A (ingen build/test kunde köras).
- **Next action:** Installera Linux-versioner av Node.js + PHP-cli i WSL, kör `npm run lint`/`npm run build` samt `php -l api/users.php`, därefter täcka user flows med Playwright enligt TEST_RULES och deploya via `deploy_loopia_frontend.bat`.

#### [15:40] Exporter now copies `.rsc` payloads and `/groups/detail` has a regression spec
- **Change type:** fix
- **Scope (component/module):** `build-tooling`, `e2e-tests`
- **Tickets/PRs:** N/A (prod hotfix follow-up)
- **Branch:** `dev`
- **Commit(s):** Working tree (not yet committed)
- **Environment:** WSL2 filesystem; Node runtime missing (blocked commands noted below)
- **Commands run:**
  ```bash
  npm run export:static          # fails: "WSL 1 is not supported ... Could not determine Node.js install directory"
  node scripts/create-static-out.mjs   # fails: /bin/bash: node: command not found
  npx playwright test --headed web/tests/groups-detail-navigation.spec.ts   # not run (same node issue)
  ```
- **Result summary:** Rewrote `create-static-out.mjs` to recursively copy every `.html` and `.rsc` under `.next/server/app`, mapping directory structure so each route serves `index.html` + `index.txt`. Hardened `post-export.js` to duplicate both `/groups/detail.html` and `/groups/detail.rsc`. Authored `web/tests/groups-detail-navigation.spec.ts` to log in, click "Öppna grupp", assert `index.txt` exists, and verify CTA buttons—test currently blocked until Node is available.
- **Files changed (exact):**
  - `crm-app/scripts/create-static-out.mjs` — L49–119 — `buildOut`, new `walkFiles`, `writeRouteFile` helpers copy `.rsc` → `index.txt`.
  - `crm-app/scripts/post-export.js` — L1–44 — ensures `/groups/detail/index.(html|txt)` always exist (copies `.rsc` from `.next`).
  - `web/tests/groups-detail-navigation.spec.ts` — L1–57 — new Playwright spec covering SPA navigation + RSC fetch.
- **Unified diff (minimal, consolidated):**
  ```diff
  --- a/crm-app/scripts/create-static-out.mjs
  +++ b/crm-app/scripts/create-static-out.mjs
  @@
  -  const htmlFiles = fs.readdirSync(appServerDir).filter((name) => name.endsWith('.html'))
  -  for (const fileName of htmlFiles) {
  -    const base = fileName.replace(/\.html$/, '')
  -    const src = path.join(appServerDir, fileName)
  -    ...
  -  }
  +  const walkFiles = (dir) => { /* recurse */ }
  +  const appFiles = walkFiles(appServerDir)
  +  const htmlFiles = appFiles.filter((filePath) => filePath.endsWith('.html'))
  +  const rscFiles = appFiles.filter((filePath) => filePath.endsWith('.rsc'))
  +  const writeRouteFile = (route, src, fileName) => { /* map nested paths, emit index.(html|txt) */ }
  +  for (const filePath of htmlFiles) { writeRouteFile(route, filePath, 'index.html') }
  +  for (const filePath of rscFiles) { writeRouteFile(route, filePath, 'index.txt') }
  
  --- a/crm-app/scripts/post-export.js
  +++ b/crm-app/scripts/post-export.js
  @@
  -const detailPagePath = path.join(__dirname, '../.next/server/app/groups/detail/page.html')
  -if (fs.existsSync(detailPagePath)) { /* copy html only */ }
  +const detailHtmlSource = path.join(__dirname, '../.next/server/app/groups/detail.html')
  +const detailRscSource = path.join(__dirname, '../.next/server/app/groups/detail.rsc')
  +if (fs.existsSync(detailHtmlSource)) { fs.copyFileSync(detailHtmlSource, detailHtmlOut) }
  +else if (fs.existsSync(groupsIndexHtml)) { /* warn, copy fallback */ } else { process.exit(1) }
  +if (fs.existsSync(detailRscSource)) { fs.copyFileSync(detailRscSource, detailRscOut) } else { process.exit(1) }
  
  --- /dev/null
  +++ b/web/tests/groups-detail-navigation.spec.ts
  +import { test, expect } from '@playwright/test'
  +test.describe('Group detail navigation', () => {
  +  test('opens group detail via SPA navigation and serves matching RSC payload', async ({ page }) => {
  +    await page.goto('/login?redirectTo=%2Fgroups')
  +    ...
  +    const response = await page.request.get(`${CRM_BASE_URL}/groups/detail/index.txt`)
  +    expect(response.status()).toBe(200)
  +  })
  +})
  ```
- **Tests executed:** Not executed — both `npm run export:static` and `npx playwright ...` fail immediately because `node` is absent inside WSL (documented in commands above). No DB state touched.
- **Performance note:** N/A (file-copy script only)
- **System documentation updated:** None
- **Artifacts:** None (build + tests blocked before artifact stage)
- **Next action:** Install a Linux Node runtime (or make `/usr/bin/node` available), rerun `npm run export:static`, execute the new Playwright spec with mandated video/snapshot, save report under `web/test-reports/`, then redeploy via `scripts/deploy_loopia_frontend.bat`.

---

## 5) Changes by File (Exact Edits)

### 5.1) `crm-app/scripts/create-static-out.mjs`
- **Purpose of change:** Previous script only copied top-level `.html` files and explicitly skipped `.rsc`, leaving `/groups/detail/index.txt` missing in production static exports.
- **Functions/Classes touched:** `buildOut`, new helpers `walkFiles`, `writeRouteFile`
- **Exact lines changed:** L49–119
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
@@
-  const htmlFiles = fs.readdirSync(appServerDir).filter((name) => name.endsWith('.html'))
-  for (const fileName of htmlFiles) {
-    const base = fileName.replace(/\.html$/, '')
-    const src = path.join(appServerDir, fileName)
-    ...
-  }
+  const walkFiles = (dir) => {
+    const files = []
+    const entries = fs.readdirSync(dir, { withFileTypes: true })
+    for (const entry of entries) {
+      const entryPath = path.join(dir, entry.name)
+      if (entry.isDirectory()) {
+        files.push(...walkFiles(entryPath))
+      } else if (entry.isFile()) {
+        files.push(entryPath)
+      }
+    }
+    return files
+  }
+
+  const appFiles = walkFiles(appServerDir)
+  const htmlFiles = appFiles.filter((filePath) => filePath.endsWith('.html'))
+  const rscFiles = appFiles.filter((filePath) => filePath.endsWith('.rsc'))
+
+  const writeRouteFile = (route, src, fileName) => {
+    if (route === '_not-found') {
+      copyFile(src, path.join(outDir, fileName === 'index.html' ? '404.html' : '404.txt'))
+      return
+    }
+    if (route === 'index') {
+      copyFile(src, path.join(outDir, fileName))
+      return
+    }
+    const segments = route.split('/').filter(Boolean)
+    const destDir = path.join(outDir, ...segments)
+    ensureDir(destDir)
+    copyFile(src, path.join(destDir, fileName))
+  }
+
+  for (const filePath of htmlFiles) {
+    const route = normalize(path.relative(appServerDir, filePath)).replace(/\.html$/, '')
+    writeRouteFile(route, filePath, 'index.html')
+  }
+
+  for (const filePath of rscFiles) {
+    const route = normalize(path.relative(appServerDir, filePath)).replace(/\.rsc$/, '')
+    writeRouteFile(route, filePath, 'index.txt')
+  }
```
- **Removals commented & justification:** Removed ad-hoc loop over `fs.readdirSync` because it ignored nested directories and `.rsc`. New recursive implementation ensures parity between HTML and RSC assets.
- **Side-effects / dependencies:** Exporter now emits `404.txt` when `_not-found.rsc` exists, so CDN cache should be invalidated on next deploy.

### 5.2) `crm-app/scripts/post-export.js`
- **Purpose of change:** Prior script only copied HTML for `/groups/detail` and silently succeeded even when `.rsc` was missing, leaving SPA navigation broken.
- **Functions/Classes touched:** top-level script logic
- **Exact lines changed:** L1–44 (entire script rewritten)
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
@@
-const detailPagePath = path.join(__dirname, '../.next/server/app/groups/detail/page.html')
-if (fs.existsSync(detailPagePath)) {
-  const content = fs.readFileSync(detailPagePath, 'utf8')
-  fs.writeFileSync(path.join(detailDir, 'index.html'), content)
-  console.log('✓ Created /groups/detail/index.html')
-} else {
-  ... // copy groups/index.html silently
-}
+const detailHtmlSource = path.join(__dirname, '../.next/server/app/groups/detail.html')
+const detailRscSource = path.join(__dirname, '../.next/server/app/groups/detail.rsc')
+const detailHtmlOut = path.join(detailDir, 'index.html')
+const detailRscOut = path.join(detailDir, 'index.txt')
+...
+if (fs.existsSync(detailHtmlSource)) {
+  fs.copyFileSync(detailHtmlSource, detailHtmlOut)
+  console.log('✓ Created /groups/detail/index.html')
+} else if (fs.existsSync(groupsIndexHtml)) {
+  fs.copyFileSync(groupsIndexHtml, detailHtmlOut)
+  console.warn('! Missing detail.html, copied /groups/index.html instead')
+} else {
+  console.error('✗ Could not find a source HTML file for /groups/detail')
+  process.exit(1)
+}
+
+if (fs.existsSync(detailRscSource)) {
+  fs.copyFileSync(detailRscSource, detailRscOut)
+  console.log('✓ Created /groups/detail/index.txt')
+} else {
+  console.error('✗ Could not find detail.rsc required for /groups/detail/index.txt')
+  process.exit(1)
+}
```
- **Removals commented & justification:** Removed silent fallback that masked missing `detail.html`; exporter must fail fast if source assets are absent to avoid shipping broken builds.
- **Side-effects / dependencies:** Build now depends on `detail.rsc` existing under `.next/server/app`. If Next ever renames its output path we must update this script accordingly.

### 5.3) `web/tests/groups-detail-navigation.spec.ts`
- **Purpose of change:** Provide failing regression coverage demonstrating `/groups/detail/index.txt` must exist for SPA navigation, per TEST_RULES.
- **Functions/Classes touched:** New Playwright spec (no reusable functions)
- **Exact lines changed:** L1–57 (new file)
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
+import { test, expect } from '@playwright/test'
+
+const CRM_BASE_URL = process.env.PLAYWRIGHT_REMOTE_BASE_URL ?? 'https://crm.medlemsregistret.se'
+...
+  test('opens group detail via SPA navigation and serves matching RSC payload', async ({ page }) => {
+    await page.goto('/login?redirectTo=%2Fgroups')
+    ...
+    const response = await page.request.get(`${CRM_BASE_URL}/groups/detail/index.txt`)
+    expect(response.status()).toBe(200)
+    ...
+  })
+})
```
- **Removals commented & justification:** N/A (brand new spec)
- **Side-effects / dependencies:** Uses remote production credentials/env variables; ensure secrets remain in `.env` and not hard-coded.

### 5.4) `api/users.php`
- **Purpose of change:** Nytt API-endpoint för att lista, skapa, uppdatera, soft-deleta och återställa användare med rollkontroll samt lösenordshantering.
- **Functions/Classes touched:** `handle_list_users`, `handle_get_user`, `handle_create_user`, `handle_update_user`, `handle_delete_user`, `handle_restore_user`, `ensure_admin_user`, `normalize_user_role`, `map_user_row`, `ensure_email_available`, `ensure_other_admin_exists`
- **Exact lines changed:** L1–369 (helt ny fil)
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
+switch ($method) {
+  case 'GET':
+    if (isset($_GET['id']) && $_GET['id'] !== '') {
+      handle_get_user();
+    } else {
+      handle_list_users();
+    }
+    break;
+  case 'POST':
+    $body = read_json();
+    if (($body['action'] ?? '') === 'restore') {
+      handle_restore_user($body);
+    } else {
+      handle_create_user($body);
+    }
+    break;
+  ...
+function handle_create_user(array $body): void {
+  ensure_admin_user();
+  require_csrf();
+  $passwordHash = password_hash($password, PASSWORD_BCRYPT);
+  $id = generate_id();
+  $stmt = db()->prepare('INSERT INTO User (id, name, email, role, passwordHash, isDeleted, createdAt, updatedAt)
+          VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())');
+  ...
+function ensure_other_admin_exists(string $excludeId): void {
+  $stmt = db()->prepare('SELECT COUNT(*) AS total FROM User WHERE role = "ADMIN" AND isDeleted = 0 AND id <> ?');
+  ...
+  if ($remaining <= 0) {
+    json_out(400, ['error' => 'Det måste finnas minst en aktiv administratör kvar']);
+  }
+}
```
- **Removals commented & justification:** N/A (ny fil)
- **Side-effects / dependencies:** Endast administratörer får hantera användare; endpoint förhindrar att sista admin raderas/demoteras och kräver CSRF + rate limiting på alla skrivningar.

### 5.5) `crm-app/lib/api.ts`
- **Purpose of change:** Tillhandahålla typed klientfunktioner för nya användar-API:t och exponera `ManagedUser` i frontend.
- **Functions/Classes touched:** `ManagedUser`-typ, `getUsers`, `createUser`, `updateUser`, `deleteUser`, `restoreUser`
- **Exact lines changed:** L33–59, L450–517
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
+export interface ManagedUser {
+  id: string;
+  name: string | null;
+  email: string | null;
+  role: AuthRole;
+  isDeleted: boolean;
+  deletedAt: string | null;
+  createdAt: string | null;
+  updatedAt: string | null;
+}
+
+  async getUsers(params: { q?: string; includeDeleted?: boolean } = {}): Promise<ManagedUser[]> {
+    const search = new URLSearchParams();
+    if (params.q) search.set('q', params.q);
+    if (params.includeDeleted) search.set('includeDeleted', '1');
+    const url = search.toString() ? `/api/users.php?${search}` : '/api/users.php';
+    const res = await jsonFetch(url, { method: 'GET' });
+    return Array.isArray(res?.items) ? (res.items as ManagedUser[]) : [];
+  },
+  async createUser(payload: { name?: string | null; email: string; role: AuthRole; password: string }): Promise<{ id: string }> {
+    return jsonFetch('/api/users.php', { method: 'POST', body: payload }, true);
+  },
+  ...
+  async restoreUser(id: string): Promise<{ success: boolean }> {
+    return jsonFetch('/api/users.php', { method: 'POST', body: { action: 'restore', id } }, true);
+  },
```
- **Removals commented & justification:** N/A (endast tillägg)
- **Side-effects / dependencies:** Frontend kan nu konsumera user-endpoint och samma helpers används av `useAuth`.

### 5.6) `crm-app/app/users/page.tsx`
- **Purpose of change:** Bygga hela sidan för användarhantering (lista, sök, toggles, modaler för skapa/redigera, soft delete och återställning).
- **Functions/Classes touched:** `UsersPage`, `UserFormDialog`, hjälpfunktioner `resolveRoleLabel`, `roleBadgeVariant`, `useDebouncedValue`
- **Exact lines changed:** L1–442 (fil ny/ersatt)
- **Linked commit(s):** (uncommitted)
- **Before/After diff (unified):**
```diff
-export default function UsersPage() {
-  return (
-    <AppLayout title="Användare" description="Administrera åtkomst och roller (kommer snart)">
-      <Card>
-        <CardHeader>
-          <CardTitle>Användarhantering planeras</CardTitle>
-        </CardHeader>
-        <CardContent className="text-sm text-muted-foreground">
-          Den förenklade plattformen stödjer just nu en administratör. Funktioner för fler användare
-          kommer att introduceras här framöver.
-        </CardContent>
-      </Card>
-    </AppLayout>
-  )
-}
+export default function UsersPage() {
+  const { session, status } = useAuth()
+  const [users, setUsers] = useState<ManagedUser[]>([])
+  const [search, setSearch] = useState("")
+  const [showDeleted, setShowDeleted] = useState(false)
+  ...
+  return (
+    <AppLayout
+      title="Användarhantering"
+      description="Administrera åtkomst och roller i systemet."
+      actions={
+        <Button onClick={openCreateDialog} size="sm">
+          <Plus className="mr-2 h-4 w-4" />
+          Ny användare
+        </Button>
+      }
+    >
+      <Card>... tabell med checkboxar, rollbadges, sökfält, visa raderade-switch ...</Card>
+      <UserFormDialog ... />
+      <AlertDialog ... />
+    </AppLayout>
+  )
+}
```
- **Removals commented & justification:** Tog bort placeholder-kortet ("kommer snart") eftersom fullt UI nu finns.
- **Side-effects / dependencies:** Sidan kräver admin-role via `useAuth`; alla skrivningar använder nya API-metoder och visar toasts för feedback.

---

## 6) Database & Migrations

N/A – no schema or data changes today.

---

## 7) APIs & Contracts

- **New/Changed endpoints:** `/api/users.php` (GET list/sök, POST create, POST action=restore, PUT update, DELETE soft delete)
- **Request schema:** JSON-kropp enligt respektive metod (create kräver `{ email, role, password }`, update `{ id, ... }`, delete `{ id }`), GET tar query params `q`, `includeDeleted`.
- **Response schema:** List ger `{ items: ManagedUser[], total: number }`. Övriga operationer svarar `{ id }` eller `{ success: true }` + felmeddelanden via `{ error }`.
- **Backward compatibility:** Ja – nytt endpoint påverkar inte befintliga API:er; endast administratörer kan använda det via sessionskontroll.
- **Clients impacted:** `crm-app/app/users/page.tsx` via nya helpers i `crm-app/lib/api.ts`.

---

## 8) Tests & Evidence

- **Unit tests added/updated:** Ingen – Node.js saknas i WSL-miljön.
- **Integration/E2E:** `web/tests/groups-detail-navigation.spec.ts` och nya användarflöden saknar körning p.g.a. både `node` och `php` saknas (`node: command not found`, `php: command not found`).
- **Coverage:** N/A (ingen körning möjlig)
- **Artifacts:** Inga (inga tester kunde köras)
- **Commands run:**
```bash
npm run export:static   # fails before build/test stage due to missing node in WSL
npx playwright test --headed web/tests/groups-detail-navigation.spec.ts   # not executed (same blocker)
php -l api/users.php   # fails: php: command not found
```
- **Results summary:** Inga automatiserade tester kunde köras; blocker dokumenterad och installation av Node.js + PHP-cli i WSL krävs innan verifiering kan göras.
- **Known flaky tests:** N/A

---

## 9) Performance & Benchmarks

N/A – file copy script only.

---

## 10) Security, Privacy, Compliance

- **Secrets handling:** Inga nya hemligheter; UI använder befintliga sessioner och inga creds hårdkodas.
- **Access control changes:** `api/users.php` inför `ensure_admin_user()` + kontroll så att sista ADMIN inte kan tas bort eller nedgraderas.
- **Data handling:** Hanterar riktiga användarprofiler (namn/e-post) + lösenord som alltid bcrypt-hashas innan de skrivs till DB.
- **Threat/abuse considerations:** Alla skrivoperationer kräver CSRF-token + rate limiting; UI blockar själv-radering och visar soft delete-status för transparens.

---

## 11) Issues, Bugs, Incidents

- **Symptom:** `npm run export:static` fails with `WSL 1 is not supported` even though host is WSL2; `node` unavailable inside Linux environment → exporter/test commands cannot run.
- **Impact:** Unable to regenerate `crm-app/out` or capture required Playwright report locally; deployment blocked.
- **Root cause (if known):** Repository relies on Windows-installed Node (`/mnt/c/Program Files/nodejs/node.exe`). The `npm` shim refuses to run under WSL because it detects WSL1 semantics, so `node` never spawns.
- **Mitigation/Workaround:** None yet; need to install a native Linux Node (e.g., via `nvm`, `asdf`, or distro packages) or reconfigure PATH.
- **Permanent fix plan:** Install Node 20+ inside WSL, re-run export + Playwright tests, then proceed with deployment.
- **Links:** Internal console output captured in section 4 commands.

---

## 12) Communication & Reviews

- **PR(s):** N/A (work in progress)
- **Reviewers & outcomes:** N/A
- **Follow-up actions requested:** Need user confirmation once Node is installed so export/test cycle can continue.

---

## 13) Stats & Traceability

- **Files changed:** `crm-app/scripts/create-static-out.mjs`, `crm-app/scripts/post-export.js`, `web/tests/groups-detail-navigation.spec.ts`, `api/users.php`, `crm-app/lib/api.ts`, `crm-app/app/users/page.tsx`
- **Lines added/removed:** cirka +980 / -40 totalt (inklusive +370 nya PHP-rader, +50 i `lib/api.ts`, +420 i UI, utöver tidigare exporter-fixar)
- **Functions/classes count (before → after):** +1 PHP endpoint med 10 helpers; frontend fick 3 nya komponenter/hjälpfunktioner (UsersPage, UserFormDialog, useDebouncedValue).
- **Ticket ↔ Commit ↔ Test mapping (RTM):**
| Ticket | Commit SHA | Files | Test(s) |
|---|---|---|---|
| N/A | `(uncommitted)` | `crm-app/scripts/create-static-out.mjs`, `crm-app/scripts/post-export.js`, `web/tests/groups-detail-navigation.spec.ts` | `web/tests/groups-detail-navigation.spec.ts` (pending execution) |
| N/A | `(uncommitted)` | `api/users.php`, `crm-app/lib/api.ts`, `crm-app/app/users/page.tsx` | (Planerat) Ny Playwright-svit för användarlistan när Node/PHP finns |

---

## 14) Config & Ops

- **Config files touched:** None today.
- **Runtime toggles/flags:** None.
- **Dev/Test/Prod parity:** Exporter now mirrors prod expectations (HTML + RSC). Need to re-export before syncing to Loopia.
- **Deploy steps executed:** None (deployment intentionally paused until Node/install + tests complete).
- **Backout plan:** Revert scripts + delete new spec before next export if needed.
- **Monitoring/alerts:** Manual HAR review only; no automated alerts configured.

---

## 15) Decisions & Rationale (ADR-style snippets)

- **Decision:** Copy every `.rsc` file during static export and fail fast if `/groups/detail` assets are missing.
- **Context:** Loopia hosts rely on static exports; missing `.rsc` causes SPA navigation 404s (see HAR evidence).
- **Options considered:** (A) Re-enable Node server (not available on Loopia), (B) Hardcode JSON mocks (disallowed), (C) Copy `.rsc` files during export (chosen).
- **Chosen because:** Option C keeps deployment static-friendly and matches Next.js expectations with minimal infra changes.
- **Consequences:** Export script runs longer but ensures parity; build now fails if `detail.rsc` is absent, which surfaces issues earlier in CI.

---

## 16) TODO / Next Steps

- Install a native Linux Node.js runtime inside WSL (or expose a working `/usr/bin/node` symlink) so exporter/tests can execute.
- Rerun `npm run export:static` and confirm `/groups/detail/index.txt` exists in `crm-app/out`.
- Install PHP-cli i samma miljö och kör `php -l api/users.php` för att syntaxkontrollera nya endpointet.
- Ta fram Playwright-scenarion för användarlistan (sök, soft delete/restore) och kör dem tillsammans med befintliga tester när Node/PHP är installerade.
- Execute `npx playwright test --headed web/tests/groups-detail-navigation.spec.ts`, capture 1900×120 video + 1900×1200 snapshot, and archive report under `web/test-reports/` per TEST_RULES.
- Once assets + tests succeed, run `scripts/deploy_loopia_frontend.bat` from PowerShell to push HTML+RSC updates to Loopia.

---

## 17) Time Log
| Start | End | Duration | Activity |
|---|---|---|---|
| 13:30 | 15:40 | 2h10 | Export tooling refactor, post-export hardening, Playwright spec authoring, documented Node blocker |
| 15:50 | 18:10 | 2h20 | Tog fram PHP-endpoint + React UI för användarhantering, uppdaterade API-klienter och worklog |
| 18:10 | 18:35 | 0h25 | Felsökte tom Användare-lista efter rebuild och uppdaterade SQL så NULL-isDeleted räknas som aktiv |

---

## 18) Attachments & Artifacts

- **Screenshots:** N/A
- **Logs:** Refer to console snippets inside this worklog; no transcript files saved because exporter never ran successfully.
- **Reports:** N/A (tests blocked)
- **Data samples (sanitized):** HAR already stored at `logs/loopia_e2e.har` (unchanged today)

---

## 19) Appendix A — Raw Console Log (Optional)
```text
npm run export:static
WSL 1 is not supported. Please upgrade to WSL 2 or above.
Could not determine Node.js install directory

node scripts/create-static-out.mjs
bash: node: command not found
```

## 20) Appendix B — Full Patches (Optional)
```diff
# See git working tree for full patches; excerpts included above in sections 4 & 5.
```

---

> **Checklist before closing the day:**
> - [x] All edits captured with exact file paths, line ranges, and diffs.
> - [ ] Tests executed with evidence attached. *(Blocked: Node runtime missing in WSL.)*
> - [x] DB changes documented with rollback. *(N/A)*
> - [x] Config changes and feature flags recorded. *(None)*
> - [x] Traceability matrix updated.
> - [ ] Backout plan defined. *(Pending once tests/deploy ready.)*
> - [x] Next steps & owners set.
