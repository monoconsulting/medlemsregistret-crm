# Instructions and rules for agents
```
Version: 1.0.
Date: 2025-09-25
```

## Rules

* Mock data in the system are **not allowed.** This can not be used without a specific order to implement it
* **SQLLite can never be used.** You have no permissions to use this. 
* Test **must** be performed exactly as stated in @docs/TEST_RULES.md
* You are **never allowed to change port** or assign a new port to something that is not working.  You MUST ask permission
* You have **NO PERMISSIONS to use taskkill** to kill a port that someone else is using. This can cause serious damage
* You **ARE NOT ALLOWED TO EDIT playwright.config.ts**
* When working with association groups:
  * Use the existing tRPC procedures (`groups.list`, `groups.getById`, `groups.exportMembers`, `groups.softDelete`).
  * Persist ANSI/semicolon CSV output – the backend already encodes via `iconv-lite`. Do not change encoding without approval.
  * Keep the dropdown counts synced by invalidating both queries after mutations (see `AddAssociationsToGroupModal`).
* Frontend code should rely on `crm-app/lib/backend-base.ts` for resolving the backend origin in middleware/SSR contexts.
* Start the Next.js dev server via `npm run dev` (runs `scripts/start-dev.ts`, binds to port 3000 inside docker-compose). Do not reassign ports.
