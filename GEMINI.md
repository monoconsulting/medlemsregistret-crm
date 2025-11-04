# GEMINI.md

Guidelines for Google Gemini when coding in this repository.

## Key Points
- Follow the same safety rules as other agents (no port changes, no mock data, no `taskkill`).
- Reuse the shared backend discovery helper `crm-app/lib/backend-base.ts` for any SSR/middleware fetch logic.
- Association group workflows now depend on ANSI CSV export (`groups.exportMembers`) and soft-delete flags; respect the schema fields `Group.isDeleted` and `Group.deletedAt`.
- Dev server should be launched with `npm run dev` which executes `scripts/start-dev.ts` (binds to port 3000 inside docker-compose). Do not override ports manually.
- When adjusting dashboards, keep Playwright regression `web/tests/login.spec.ts` and codegen script `tests/codegen/dev.login.codegen.ts` in sync.

## Helpful Commands
```bash
npm install
npm run dev
npx playwright test web/tests/login.spec.ts
```

## Contact Data Exports
- CSV needs Windows-1252 encoding (`iconv-lite`) with semicolons and columns: group name, municipality, Ort, association name, homepage, up to 3 contacts (with phone/address for contact 1).
- Use `groups.exportMembers` rather than crafting CSV on the client.
