# Buggrapport: Gruppdetalj - Mixed Content & RSC Payload-fel

**Datum:** 2025-11-10  
**Severity:** CRITICAL  
**Status:** ÖPPEN  
**Miljö:** Produktion (crm.medlemsregistret.se)

---

## 📋 Sammanfattning

När användare navigerar till grupp-detalj sidan (`/groups/detail?id=xxx`) på produktionsservern uppstår kritiska Mixed Content-fel som blockerar Next.js Router Server Components (RSC) från att laddas korrekt. Detta orsakar att navigation i applikationen slutar fungera.

---

## 🔴 Kritiska Felmeddelanden

### 1. Mixed Content Blocking
```
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/dashboard/?_rsc=1q6ul"
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/associations/?_rsc=1q6ul"
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/municipalities/?_rsc=1q6ul"
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/groups/?_rsc=1q6ul"
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/contacts/?_rsc=1q6ul"
Blockerade laddning av blandat aktivt innehåll "http://crm.medlemsregistret.se/groups/detail/?id=wBFfjir4Q7AK32LKJxgpgkHu&_rsc=1q6ul"
```

### 2. RSC Payload Fetch Failures
```
Failed to fetch RSC payload for https://crm.medlemsregistret.se/dashboard. Falling back to browser navigation.
Failed to fetch RSC payload for https://crm.medlemsregistret.se/associations. Falling back to browser navigation.
Failed to fetch RSC payload for https://crm.medlemsregistret.se/municipalities. Falling back to browser navigation.
Failed to fetch RSC payload for https://crm.medlemsregistret.se/groups. Falling back to browser navigation.
Failed to fetch RSC payload for https://crm.medlemsregistret.se/contacts. Falling back to browser navigation.
Failed to fetch RSC payload for https://crm.medlemsregistret.se/groups/detail?id=wBFfjir4Q7AK32LKJxgpgkHu. Falling back to browser navigation.
```

### 3. Network Errors
```
NS_ERROR_UNEXPECTED på HTTP-requests (http:// istället för https://)
```

---

## 🔍 Rotorsaksanalys

### Huvudproblem
Next.js försöker ladda Router Server Components (RSC) via **HTTP** istället för **HTTPS**, vilket blockeras av webbläsarens Mixed Content Policy eftersom huvudsidan laddas över HTTPS.

### Varför sker detta?

#### 1. **Next.js asPath/basePath-konfiguration saknas**
När Next.js körs i statiskt exportläge (`output: "export"`) saknar den information om produktions-URL:en. Detta gör att RSC-requests genereras med relativa eller inkompletta URL:er som faller tillbaka till HTTP.

#### 2. **AppLayout-komponenten använder Next.js Link**
`AppLayout` i `/crm-app/components/layout/app-layout.tsx` använder Next.js `<Link>` för navigation. När dessa länkar renderas på servern/vid export, saknar de kontext om HTTPS-protokollet.

#### 3. **Statisk export + RSC-filer**
Next.js statisk export genererar `_rsc`-filer för att möjliggöra client-side navigation utan full page reload. Men dessa requests konstrueras felaktigt:
- ✅ Korrekt: `https://crm.medlemsregistret.se/groups?_rsc=1q6ul`
- ❌ Faktiskt: `http://crm.medlemsregistret.se/groups/?_rsc=1q6ul` (med trailing slash och HTTP)

#### 4. **Trailing Slash-problem**
Observera att de blockerade URL:erna har en **trailing slash** (`/groups/?_rsc=...` istället för `/groups?_rsc=...`). Detta indikerar en mismatch mellan Next.js routing-konfiguration och produktionsmiljön.

---

## 🎯 Påverkan på Systemet

### Användarupplevelse
- ✅ Första laddningen av `/groups/detail?id=xxx` fungerar (HTTP 200)
- ❌ Navigation till andra sidor från `/groups/detail` **FUNGERAR INTE**
- ❌ Next.js router "fallback to browser navigation" orsakar full page reload
- ❌ Användaren fastnar och kan inte navigera vidare i applikationen

### Teknisk påverkan
- ❌ Client-side routing är trasig
- ❌ Next.js App Router förlorar sin SPA-funktionalitet
- ❌ Varje navigering blir en full page reload (långsam)
- ⚠️ Problemet påverkar **ALLA sidor** i applikationen när användaren väl är på `/groups/detail`

---

## 🔧 Rekommenderade Lösningar

### ⭐ Lösning 1: Konfigurera Next.js basePath & assetPrefix (PRIORITERAD)

Detta är den mest robusta lösningen för statisk export på HTTPS-domän.

**Fil: `crm-app/next.config.ts`**

```typescript
import type { NextConfig } from "next"

const enableStaticExport =
  process.env.NEXT_ENABLE_STATIC_EXPORT === "true" ||
  process.env.NEXT_OUTPUT === "export"

// Production URL för Loopia
const isProd = process.env.NODE_ENV === "production"
const productionUrl = "https://crm.medlemsregistret.se"

const nextConfig: NextConfig = enableStaticExport
  ? {
      output: "export",
      images: {
        unoptimized: true,
      },
      // Force HTTPS för alla interna länkar
      assetPrefix: isProd ? productionUrl : undefined,
      // Lägg till trailing slash konsistens
      trailingSlash: true,
    }
  : {
      // Dev mode behåller default beteende
      trailingSlash: true,
    }

export default nextConfig
```

**Uppdatera också `.env.production` (skapa om den saknas):**

```env
NEXT_PUBLIC_SITE_URL=https://crm.medlemsregistret.se
NODE_ENV=production
```

**Fördelar:**
- ✅ Tvingar alla Next.js-genererade länkar att använda HTTPS
- ✅ Löser trailing slash-problemet konsistens
- ✅ Fungerar både lokalt och i produktion
- ✅ Ingen kodändring i komponenter behövs

**Nackdelar:**
- ⚠️ Kräver rebuild och redeploy

---

### ⭐ Lösning 2: Lägg till Meta-tag för Content Security Policy

Tvinga webbläsaren att uppgradera alla HTTP-requests till HTTPS.

**Fil: `crm-app/app/layout.tsx`**

Lägg till i `<head>`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        {/* Force HTTPS för alla requests */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

**Fördelar:**
- ✅ Snabb fix som kan deployas omedelbart
- ✅ Webbläsaren uppgraderar automatiskt HTTP → HTTPS
- ✅ Fungerar som backup även om Next.js gör fel

**Nackdelar:**
- ⚠️ Löser inte grundproblemet, bara symptomet
- ⚠️ Kan orsaka problem om API:et kör HTTP (men ert API redan kör HTTPS)

---

### ⭐ Lösning 3: Apache/Webhotell-nivå HTTP → HTTPS Redirect

Säkerställ att ALL trafik till `crm.medlemsregistret.se` använder HTTPS.

**Fil: `.htaccess` (i webhotell root)**

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Force no trailing slash on API requests
RewriteCond %{REQUEST_URI} ^/api/.*/$
RewriteRule ^(.*)/$ /$1 [L,R=301]

# Add trailing slash for page routes (men INTE för filer)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !(.*)/$
RewriteRule ^(.*)$ $1/ [L,R=301]
```

**Fördelar:**
- ✅ Löser problemet på server-nivå
- ✅ Fungerar oavsett vad Next.js gör
- ✅ Enhetlig hantering för hela webbplatsen

**Nackdelar:**
- ⚠️ Kräver åtkomst till webhotell-konfiguration
- ⚠️ Extra redirects kan göra sidan långsammare

---

### ⭐ Lösning 4: Uppdatera resolveBackendUrl i lib/backend-base.ts

Säkerställ att backend-resolver alltid använder HTTPS.

**Fil: `crm-app/lib/backend-base.ts`**

```typescript
export function resolveBackendUrl(path = ''): string {
  // Force production URL to always use HTTPS
  const productionUrl = 'https://crm.medlemsregistret.se'
  
  if (typeof window === 'undefined') {
    // Server-side: Always use production URL
    return productionUrl + path
  }

  // Client-side: Check if we're in production
  if (window.location.hostname === 'crm.medlemsregistret.se') {
    return productionUrl + path
  }

  // Local development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' + path
}
```

**Fördelar:**
- ✅ Säkerställer att API-anrop alltid använder HTTPS
- ✅ Fungerar både server- och client-side

**Nackdelar:**
- ⚠️ Löser bara API-requests, inte RSC-requests

---

## 🎯 Rekommenderad Implementation (Steg-för-steg)

### Fas 1: Snabbfix (Deploy inom 1 timme)
1. **Lägg till CSP meta-tag** (Lösning 2) i `layout.tsx`
2. **Verifiera .htaccess** har HTTPS-redirect (Lösning 3)
3. **Deploy till produktion**
4. **Testa navigation på crm.medlemsregistret.se**

### Fas 2: Permanent fix (Deploy inom 1 dag)
1. **Uppdatera next.config.ts** (Lösning 1) med `assetPrefix` och `trailingSlash`
2. **Skapa .env.production** med korrekt `NEXT_PUBLIC_SITE_URL`
3. **Uppdatera backend-base.ts** (Lösning 4)
4. **Rebuild frontend**: `npm run export`
5. **Deploy via deploy_loopia_frontend.bat**
6. **Regressionstest alla sidor**

### Fas 3: Verifiering
1. Testa navigation mellan följande sidor:
   - `/dashboard` → `/groups` → `/groups/detail?id=xxx`
   - `/groups/detail?id=xxx` → `/associations`
   - `/groups/detail?id=xxx` → `/municipalities`
2. Verifiera i browser DevTools att **INGA HTTP-requests** görs
3. Verifiera att RSC-payloads laddas korrekt (status 200, HTTPS)

---

## 📊 Teknisk Förklaring: Varför RSC-requests?

Next.js App Router använder **Router Server Components (RSC)** för att möjliggöra snabb client-side navigation utan full page reload:

1. Initial page load: Laddar full HTML
2. Användaren klickar på en `<Link>`: Next.js interceptar
3. Next.js fetchar `/_rsc`-payload för målsidan
4. React uppdaterar DOM utan full reload

**Problemet:** När `_rsc`-requests görs med HTTP istället för HTTPS blockeras de av Mixed Content Policy, vilket tvingar Next.js att "fall back to browser navigation" (full page reload).

**Resultat:** SPA-funktionaliteten förloras helt.

---

## 🔗 Relaterade Filer

- `crm-app/next.config.ts` - Next.js konfiguration
- `crm-app/app/layout.tsx` - Root layout
- `crm-app/lib/backend-base.ts` - Backend URL resolver
- `crm-app/components/layout/app-layout.tsx` - Layout-komponent med navigation
- `.htaccess` (webhotell root) - Apache-konfiguration

---

## ✅ Testplan Efter Fix

### Manual Testing
- [ ] Navigera från `/groups` till `/groups/detail?id=xxx`
- [ ] Från `/groups/detail` klicka på "Tillbaka" länken
- [ ] Från `/groups/detail` använd huvudnavigeringen till `/dashboard`
- [ ] Från `/groups/detail` navigera till `/associations`
- [ ] Verifiera att INGA Mixed Content-varningar visas i Console

### Automated Testing (Playwright)
```typescript
// tests/groups-navigation.spec.ts
test('should navigate from groups to detail and back without errors', async ({ page }) => {
  await page.goto('https://crm.medlemsregistret.se/groups')
  
  // Listen for mixed content errors
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Mixed')) {
      errors.push(msg.text())
    }
  })
  
  // Click on first group
  await page.click('a[href*="/groups/detail"]')
  await page.waitForURL('**/groups/detail?id=*')
  
  // Navigate to associations
  await page.click('a[href="/associations"]')
  await page.waitForURL('**/associations')
  
  // Verify no mixed content errors
  expect(errors).toHaveLength(0)
})
```

---

## 📝 Status Log

| Datum | Status | Action | Resultat |
|-------|--------|--------|----------|
| 2025-11-10 | ÖPPEN | Bug identifierad | Väntar på fix |

---

## 👤 Ansvarig

- **Rapporterad av:** AI Agent (Claude)
- **Tilldelad till:** Development Team
- **Prioritet:** CRITICAL
- **Estimerad tid:** 2-4 timmar (inkl. test)

---

## 🔗 Referenser

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [MDN: Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
- [Next.js assetPrefix Configuration](https://nextjs.org/docs/app/api-reference/next-config-js/assetPrefix)
