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