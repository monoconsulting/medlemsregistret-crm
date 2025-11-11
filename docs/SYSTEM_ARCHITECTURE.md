# System Architecture Guide for AI Agents

> **Target Audience:** AI assistants working on this codebase
> **Last Updated:** 2025-11-10
> **Purpose:** Understand the system architecture, deployment model, and codebase structure

---

## 🏗️ System Overview

This is a **hybrid static + PHP CRM system** for managing Swedish municipal association registries.

### Deployment Model

- **Hosting:** Standard Apache webhotell (shared hosting, **NO Node.js server**)
- **Frontend:** Next.js 15 **statically exported** to HTML/CSS/JS
- **Backend:** PHP 8+ REST APIs with MySQL database
- **Database:** MySQL running on the **same webhotell** (remote database)
- **No VPS/Docker:** Everything runs on traditional LAMP stack (Linux, Apache, MySQL, PHP)

### Critical Constraint: Static Export Only

⚠️ **NEVER use Next.js dynamic routes like `/groups/[id]`**

**Why?** Dynamic routes require a Node.js server. We only have Apache.

**Instead:** Use query parameters like `/groups/detail?id=xxx`

---

## 📁 Codebase Structure

```
E:\projects\CRM\
│
├── api/                          # PHP Backend (REST APIs)
│   ├── bootstrap.php             # DB connection, auth, CSRF, utilities
│   ├── associations.php          # Association CRUD endpoints
│   ├── groups.php                # Group management endpoints
│   ├── tags.php                  # Tag management
│   ├── municipalities.php        # Municipality data
│   ├── contacts.php              # Contact person management
│   ├── login.php                 # Session-based authentication
│   ├── logout.php
│   └── auth/me.php               # Current session check
│
├── crm-app/                      # Next.js 15 Frontend (Static Export)
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx            # Root layout
│   │   ├── login/page.tsx        # Login page
│   │   ├── dashboard/page.tsx    # Dashboard
│   │   ├── associations/page.tsx # Association list + details modal
│   │   ├── groups/
│   │   │   ├── page.tsx          # Groups list
│   │   │   └── detail/page.tsx   # Group detail (query param route!)
│   │   ├── municipalities/page.tsx
│   │   ├── contacts/page.tsx
│   │   ├── users/page.tsx
│   │   └── import/page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── app-layout.tsx    # Main layout wrapper
│   │   ├── modals/               # ⭐ ALL MODALS LIVE HERE
│   │   │   ├── association-details-dialog.tsx
│   │   │   ├── add-associations-to-group-modal.tsx
│   │   │   ├── edit-association-modal.tsx
│   │   │   ├── add-note-modal.tsx
│   │   │   └── association-contacts-modal.tsx
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── input.tsx
│   │   │   ├── switch.tsx
│   │   │   └── ...
│   │   └── tag-selector.tsx      # Custom reusable components
│   │
│   ├── lib/
│   │   ├── api.ts                # ⭐ API CLIENT - wraps all PHP endpoints
│   │   ├── backend-base.ts       # Backend URL resolution
│   │   └── utils.ts              # Utilities
│   │
│   ├── scripts/
│   │   ├── create-static-out.mjs # Generates static HTML from build
│   │   └── post-export.js        # ⭐ Creates missing HTML for query param routes
│   │
│   ├── out/                      # ⭐ Static export output (deployed to webhotell)
│   │   ├── index.html
│   │   ├── groups/
│   │   │   ├── index.html
│   │   │   └── detail/index.html # Created by post-export.js!
│   │   ├── _next/                # JS/CSS bundles
│   │   └── ...
│   │
│   ├── next.config.ts            # Enables static export mode
│   └── package.json
│
├── scraping/                     # Web scraping framework (50+ municipalities)
│   ├── json/                     # Scraped data output
│   ├── logs/                     # Scraping logs
│   └── scripts/                  # Bulk scraping batch files
│
├── legacy/                       # Old tRPC-based version (reference only)
│
└── docs/
    ├── SYSTEM_ARCHITECTURE.md    # ⭐ THIS FILE
    ├── CLAUDE.md                 # Project rules and context
    ├── TEST_RULES.md             # Testing protocol
    ├── JSON_STANDARD.md          # Scraping output format
    └── worklogs/                 # Daily engineering logs
```

---

## 🔄 How the System Works

### 1. Build Process

```bash
# Development
npm run dev  # Runs Next.js dev server on localhost:3000

# Production Build (static export)
npm run export  # Runs: next build → create-static-out.mjs → post-export.js
```

**What happens:**
1. Next.js builds → generates `.next/` directory
2. `create-static-out.mjs` → exports to `out/` directory (static HTML)
3. `post-export.js` → creates missing HTML files for query param routes (e.g., `/groups/detail/index.html`)

### 2. Deployment

Upload `crm-app/out/` directory to webhotell via FTP/SFTP:
- Frontend: `out/` → webhotell root or subdirectory
- Backend: `api/` → webhotell `/api` directory
- Database: Already running on webhotell MySQL server

### 3. Request Flow

```
User → Apache → Static HTML (out/)
                    ↓
              React Hydrates
                    ↓
              Fetch API Calls → PHP (api/)
                                    ↓
                              MySQL Database
```

**Example: View Group Detail**
1. User clicks "Öppna grupp" → navigates to `/groups/detail?id=xxx`
2. Apache serves `/groups/detail/index.html` (created by post-export.js)
3. React hydrates → reads `?id=xxx` via `useSearchParams()`
4. Calls `api.getGroupById(id)` → fetches `/api/groups.php?id=xxx`
5. PHP queries MySQL → returns JSON
6. React renders group detail with data

---

## 📋 Frontend Patterns

### Page Structure

**ALL pages follow this pattern:**

```tsx
"use client"  // Required for client-side interactivity

import { AppLayout } from "@/components/layout/app-layout"
import { api } from "@/lib/api"

export default function MyPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data from API
    api.getSomething().then(setData).finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout title="Page Title" description="Description">
      {/* Page content */}
    </AppLayout>
  )
}
```

### Modal Pattern

**ALL modals live in `components/modals/`** and follow this structure:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface MyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string | null
  onUpdated?: () => void  // Callback to refresh parent data
}

export function MyModal({ open, onOpenChange, itemId, onUpdated }: MyModalProps) {
  // Modal logic here

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        {/* Modal content */}
      </DialogContent>
    </Dialog>
  )
}
```

**Usage in page:**
```tsx
const [modalOpen, setModalOpen] = useState(false)
const [selectedId, setSelectedId] = useState<string | null>(null)

<MyModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  itemId={selectedId}
  onUpdated={() => loadData()}  // Refresh parent data after save
/>
```

### API Client Pattern

**NEVER call `fetch()` directly. Always use `api.ts` client:**

```tsx
import { api } from "@/lib/api"

// List
const groups = await api.getGroups()

// Get by ID
const group = await api.getGroupById(id)

// Create
const result = await api.createGroup({ name: "New Group" })

// Update
await api.updateGroup(id, { name: "Updated" })

// Delete (soft-delete)
await api.deleteGroup(id)
```

**Adding new API methods:**

1. Add to `api/` directory (PHP):
```php
// api/myendpoint.php
require __DIR__ . '/bootstrap.php';

function handle_my_action(): void {
  require_auth();  // Always check auth
  require_csrf();  // For POST/PUT/DELETE

  $data = read_json();  // Parse request body

  // Your logic here

  json_out(200, ['success' => true]);
}
```

2. Add to `lib/api.ts` (TypeScript):
```typescript
export const api = {
  // ...existing methods

  async myAction(data: MyData): Promise<MyResult> {
    return jsonFetch('/api/myendpoint.php',
      { method: 'POST', body: data },
      true  // needsCsrf
    )
  },
}
```

---

## 🚫 Common Pitfalls

### ❌ NEVER Do This

```tsx
// ❌ Dynamic routes (requires Node.js server)
app/groups/[id]/page.tsx

// ❌ Direct fetch calls (bypasses CSRF/auth)
fetch('/api/groups.php', { ... })

// ❌ Server-side rendering
export async function getServerSideProps() { ... }

// ❌ API routes in Next.js (we use PHP)
app/api/groups/route.ts

// ❌ Hard delete from database
DELETE FROM Table WHERE id = ?

// ❌ Creating files outside allowed directories
mkdir /tmp/uploads/  // FORBIDDEN
```

### ✅ ALWAYS Do This

```tsx
// ✅ Query parameter routes
app/groups/detail/page.tsx  // Reads ?id=xxx

// ✅ Use API client
import { api } from "@/lib/api"
await api.getGroups()

// ✅ Client-side only ("use client")
"use client"
import { useSearchParams } from "next/navigation"

// ✅ Soft delete (set isDeleted flag)
UPDATE Table SET isDeleted = 1, deletedAt = NOW() WHERE id = ?

// ✅ Wrap useSearchParams in Suspense
<Suspense fallback={<Loading />}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

## 🗄️ Database Pattern

### Connection

Handled in `api/bootstrap.php`:
```php
function db(): mysqli {
  static $db = null;
  if ($db === null) {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  }
  return $db;
}
```

### Soft Delete (ALWAYS use this)

```php
// ❌ NEVER hard delete
$sql = "DELETE FROM `Group` WHERE id = ?";

// ✅ ALWAYS soft delete
$sql = "UPDATE `Group` SET isDeleted = 1, deletedAt = NOW() WHERE id = ?";

// ✅ Filter out deleted in queries
$sql = "SELECT * FROM `Group` WHERE isDeleted = 0";
```

### Query Pattern

```php
// Prepare statement
$sql = "SELECT * FROM Association WHERE id = ? AND deletedAt IS NULL";
$stmt = db()->prepare($sql);

// Bind parameters
$stmt->bind_param('s', $id);

// Execute
$stmt->execute();
$res = $stmt->get_result();

// Fetch
$row = $res->fetch_assoc();

// Return JSON
json_out(200, $row);
```

---

## 🎨 UI Components

### shadcn/ui Components

Located in `components/ui/`. **DO NOT modify these directly** (they're from shadcn).

Common components:
- `Button` - Buttons with variants
- `Card` - Container cards
- `Dialog` - Modals
- `Table` - Data tables
- `Input` / `Textarea` - Form inputs
- `Switch` - Toggle switches
- `Badge` - Labels/tags
- `AlertDialog` - Confirmation dialogs

### Custom Components

- `AppLayout` - Page wrapper with navigation
- `TagSelector` - Multi-select tag picker with search
- All modals in `components/modals/`

---

## 🔐 Authentication

### Session-based Auth (PHP)

```php
// Check if authenticated
require_auth();  // Dies with 401 if not logged in

// Get current user ID
$userId = $_SESSION['uid'];
```

### CSRF Protection

```php
// For POST/PUT/DELETE endpoints
require_csrf();  // Validates X-CSRF-Token header
```

### Frontend Auth

```tsx
// Check session
const session = await api.getSession()
if (!session) {
  router.push('/login')
}

// Login
await api.login(email, password)

// Logout
await api.logout()
```

---

## 📦 Export Process Details

### Why post-export.js is Needed

Next.js static export **skips** generating HTML for routes using `Suspense + useSearchParams()` to avoid hydration mismatches.

**Solution:** `post-export.js` creates missing HTML files by copying parent route HTML.

```javascript
// scripts/post-export.js
// Copies groups/index.html → groups/detail/index.html
// React then reads query params client-side
```

### Static Export Config

```typescript
// next.config.ts
const nextConfig: NextConfig = enableStaticExport
  ? {
      output: "export",  // Static HTML generation
      images: {
        unoptimized: true,  // No image optimization (no server)
      },
    }
  : {}
```

---

## 🧪 Testing

See `docs/TEST_RULES.md` for full testing protocol.

**Quick summary:**
- Playwright tests in `/web/tests`
- Must pass tests BEFORE merging
- Tests prove bugs AND verify fixes

---

## 📝 Worklog

ALL changes must be logged in `docs/worklogs/YY-MM-DD_Worklog.md`

See `docs/worklogs/WORKLOG_AI_INSTRUCTION.md` for format.

---

## 🎯 Quick Reference

| Task | Location | Pattern |
|------|----------|---------|
| Add new page | `app/mypage/page.tsx` | Use `AppLayout` + `"use client"` |
| Add new modal | `components/modals/my-modal.tsx` | Use `Dialog` component |
| Add API endpoint | `api/myendpoint.php` | Use `require_auth()` + `json_out()` |
| Add API client method | `lib/api.ts` | Use `jsonFetch()` |
| Use query params | `useSearchParams()` in `<Suspense>` | See `/groups/detail/page.tsx` |
| Soft delete | SQL: `isDeleted = 1, deletedAt = NOW()` | NEVER hard delete |
| Build for production | `npm run export` | Outputs to `out/` |
| Add to build process | Edit `scripts/post-export.js` | Runs after Next.js build |

---

## 🆘 Troubleshooting

### "404 on my new page"

**Cause:** Page uses dynamic route `[id]` or `useSearchParams` without Suspense
**Fix:** Use query params (`/page/detail?id=xxx`) + wrap in `<Suspense>` + run post-export script

### "CSRF token missing"

**Cause:** Forgot to pass `needsCsrf: true` to `jsonFetch()`
**Fix:** `jsonFetch('/api/endpoint', { method: 'POST', body }, true)`

### "Changes not appearing on production"

**Cause:** Forgot to run `npm run export` and upload `out/`
**Fix:** Run export, upload entire `out/` directory

### "Mixed content blocked"

**Cause:** HTTP request from HTTPS page
**Fix:** Use `resolveBackendUrl()` from `lib/backend-base.ts`

---

## 📚 Additional Resources

- **Project Rules:** `docs/CLAUDE.md`
- **API Contract:** `docs/api_contract.md`
- **Testing:** `docs/TEST_RULES.md`
- **Scraping:** `docs/JSON_STANDARD.md`
- **Git Workflow:** `docs/GIT_START.md`

---

**Remember:** This is a **static export + PHP** system on **traditional webhotell**. No Node.js server exists in production. Plan accordingly.
