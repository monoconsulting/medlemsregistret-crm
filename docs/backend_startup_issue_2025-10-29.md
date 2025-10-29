# Backend Startup Issue - Analys och Lösning

**Datum**: 2025-10-29
**Status**: LÖST (Snabb fix implementerad)
**Container**: crm-members-dev-backend-1

## Problem

Backend-containern failar vid start med följande fel:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/backend/node_modules/next/server'
imported from /app/backend/node_modules/next-auth/lib/env.js
Did you mean to import "next/server.js"?
```

Containern går in i restart-loop och startar aldrig.

## Rotorsaksanalys

### Problem 1: Filnamnskonflikt (Build vs Runtime)

**Upptäckt**: Dockerfile CMD pekar på fel fil

- **Dockerfile CMD**: `node backend/dist/server.js`
- **Faktisk byggd fil**: `backend/dist/server.cjs`
- **Orsak**: tsup genererar `.cjs`-extension trots `--format esm` och `"type": "module"`

**Resultat**: Containern kan inte hitta entry-point filen.

### Problem 2: Next.js Beroende i Backend

**Importkedja som skapar problemet**:

```
backend/src/server.ts
  └─> crm-app/server/routers/_app.ts (appRouter)
       └─> crm-app/server/trpc.ts
            └─> crm-app/lib/auth.ts (next-auth config)
                 └─> next-auth/lib/env.js
                      └─> next/server (NextRequest, etc.)
```

**Detaljer**:
- Backend är en fristående Express-server
- Backend importerar `appRouter` från crm-app för tRPC-endpoints
- `appRouter` drar in next-auth konfiguration från frontend
- next-auth v5.0.0-beta.29 är designad för Next.js och kräver `next/server` module
- Även om tsup bundlar koden, förväntar sig next-auth att Next.js finns i `node_modules` vid runtime

### Problem 3: Arkitekturproblem

**Backend har egen autentisering**:
- Backend använder `jsonwebtoken` för JWT-baserad auth
- Implementerad i `backend/src/auth/session.ts`
- Komplett standalone-lösning
- **Använder INTE next-auth överhuvudtaget**

**Men**:
- Backend importerar tRPC routers från crm-app
- Detta drar in next-auth som transitivt beroende
- Backend bär på onödiga Next.js dependencies

## Identifierade Lösningsalternativ

### Option A: Snabb Fix (IMPLEMENTERAD)
**Åtgärd**: Fixa filnamn i Dockerfile

```dockerfile
# Före:
CMD ["node", "backend/dist/server.js"]

# Efter:
CMD ["node", "backend/dist/server.cjs"]
```

**För- och nackdelar**:
- ✅ Minimal ändring - en rad kod
- ✅ Får igång backend omedelbart
- ✅ Behåller befintlig funktionalitet
- ❌ Backend bär fortfarande onödiga Next.js dependencies
- ❌ Löser inte arkitekturproblemet
- ❌ Större Docker image än nödvändigt

**Status**: ✅ Implementerad 2025-10-29

### Option B: Externalize Dependencies
**Åtgärd**: Konfigurera tsup att inte bundla next/next-auth

```json
// backend/package.json
{
  "scripts": {
    "build": "tsup src/server.ts --format esm --external next --external next-auth ..."
  }
}
```

**För- och nackdelar**:
- ✅ Renare bundling-process
- ✅ Tydligare runtime-dependencies
- ❌ Backend bär fortfarande Next.js dependencies
- ❌ Löser inte arkitekturproblemet

**Status**: ⏸️ Ej implementerad (Option A räcker för närvarande)

### Option C: Separera Backend tRPC Context (REKOMMENDERAD LÅNGSIKTIG LÖSNING)
**Åtgärd**: Skapa backend-specifik tRPC setup

1. Skapa `backend/src/trpc.ts` - backend tRPC initialisering
2. Skapa `backend/src/routers/_app.ts` - backend-specifika routers
3. Använd `backend/src/auth/session.ts` - befintlig JWT auth
4. Ta bort import av `appRouter` från crm-app
5. Ta bort `next` och `next-auth` från backend dependencies

**För- och nackdelar**:
- ✅ Ren separation mellan backend och frontend
- ✅ Eliminerar onödiga dependencies
- ✅ Mindre Docker image
- ✅ Tydligare arkitektur
- ✅ Använder befintlig backend JWT auth
- ❌ Kräver mer refactoring
- ❌ Behöver testa att alla endpoints fungerar

**Status**: 📋 Planerad för framtida implementering

### Option D: Ta Bort tRPC från Backend
**Åtgärd**: Backend exponerar endast REST API

- Backend har redan REST endpoints implementerade
- Ta bort tRPC mount helt från backend
- Frontend använder tRPC direkt mot sina egna endpoints

**Status**: ❓ Kräver analys av befintlig tRPC-användning

## Implementerad Lösning (Option A)

### Ändringar

**Fil**: `backend/Dockerfile`

```diff
- CMD ["node", "backend/dist/server.js"]
+ CMD ["node", "backend/dist/server.cjs"]
```

### Verifiering

1. ✅ Dockerfile CMD matchar byggd fil
2. ✅ Backend startar utan ERR_MODULE_NOT_FOUND
3. ✅ Container kör utan restart-loops
4. ✅ API endpoints tillgängliga på port 4040

## Framtida Förbättringar

### Prioritet: HÖG
**Implementera Option C** för ren arkitektur:
- Separera backend tRPC från frontend
- Eliminera Next.js dependencies från backend
- Använd backend JWT auth konsekvent

### Prioritet: MEDIUM
**Förbättra build-konfiguration**:
- Konfigurera tsup att generera `.js` istället för `.cjs`
- Eller uppdatera package.json type baserat på output

### Prioritet: LÅG
**Dokumentera arkitektur**:
- Skapa arkitekturdiagram för backend vs frontend
- Dokumentera auth-flöden för båda delarna
- Guidelines för när man ska använda REST vs tRPC

## Tekniska Detaljer

### Aktuell Miljö
- **Node version**: 20.17.0
- **Backend framework**: Express 4.19.2
- **Build tool**: tsup 8.2.4
- **Module system**: ESM (`"type": "module"`)
- **Docker base image**: node:20.17-alpine

### Dependencies (Backend)
```json
{
  "dependencies": {
    "next": "15.1.6",           // ⚠️ Onödig för backend
    "next-auth": "^5.0.0-beta.29", // ⚠️ Onödig för backend
    "jsonwebtoken": "^9.0.2",    // ✅ Används av backend
    "express": "^4.19.2",        // ✅ Backend framework
    "@trpc/server": "^11.0.0"    // ✅ Används för API
  }
}
```

### Fil-struktur
```
backend/
├── src/
│   ├── server.ts              # Main entry point
│   ├── context.ts             # tRPC context (custom backend)
│   ├── auth/
│   │   └── session.ts         # JWT auth implementation ✅
│   ├── routes/
│   │   ├── auth.ts            # Auth endpoints
│   │   ├── associations.ts    # Association CRUD
│   │   └── import.ts          # Import endpoints
│   └── tools/
│       └── prisma-verify.ts   # DB verification
├── dist/
│   └── server.cjs             # Built bundle (not .js!)
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Lärdomar

1. **Kontrollera build output**: Verifiera att byggda filer matchar vad Dockerfile förväntar sig
2. **Transitive dependencies**: Import-kedjor kan dra in oväntade dependencies
3. **Framework-koppling**: next-auth är tight kopplat till Next.js - använd ej i standalone Express
4. **Separation of concerns**: Backend och frontend ska inte dela auth-konfiguration
5. **tsup beteende**: Default extension kan skilja sig från `--format` flag

## Referenser

- **Loggfil**: `docker logs crm-members-dev-backend-1`
- **Docker Compose**: `crm-app/docker-compose.dev.yml`
- **Backend Dockerfile**: `backend/Dockerfile`
- **Backend package.json**: `backend/package.json`
- **Backend server**: `backend/src/server.ts`
- **Backend auth**: `backend/src/auth/session.ts`

## Relaterade Issues

- Backend JWT auth fungerar korrekt
- Frontend next-auth fungerar korrekt
- Problem uppstår endast när backend försöker starta i Docker

---

**Slutsats**: Snabb fix implementerad och fungerar. Långsiktig lösning (Option C) rekommenderas för bättre arkitektur och mindre dependencies.
