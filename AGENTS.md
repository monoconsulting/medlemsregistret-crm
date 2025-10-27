# Instructions and rules for agents
```
Version: 1.1.
Date: 2025-10-26
```

## Rules
**NEVER CHANGE PORTS!**
NEVER TASKKILL!
ALWAYS READ INSTRUCTED FILES!
* Mock data in the system are **not allowed.** This can not be used without a specific order to implement it
* **SQLLite can never be used.** You have no permissions to use this. 
* Test **must** be performed exactly as stated in @docs/TEST_RULES.md
* You are **never allowed to change port** or assign a new port to something that is not working.  You MUST ask permission
* You have **NO PERMISSIONS to use taskkill** to kill a port that someone else is using. This can cause serious damage
* You **ARE NOT ALLOWED TO EDIT THE FOLLOWING FILES WITHOUT PERMISSION**
  * **docker-compose - files**
  * **.env-files**
  * **playwright.config.ts-files**
* You are **NOT ALLOWED to change ports.** If the port are busy or not working you must:
  * Check the docker-compose-files and .env - is the right port used?
  * Check docker ps - what is running on the port. **BUT DONT KILL THE SERVICE**
* Only soft delete in database!



| SYSTEM           | INSTRUCTION FILE                                     | LESSONS LEARNED FILE                      | COMMENTS                                                |
| ---------------- | ---------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| FRI              | `\scraping\docs\FRI_SCRAPING_GUIDES.md`              | `\scraping\docs\lessons\lessons_fri.md`   |                                                         |
| RBOK             | `\scraping\docs\RBOK_SCRAPING_GUIDES.md`             | `\scraping\docs\RBOK_SCRAPING_GUIDES.md`  |                                                         |
| IBGO             | `\scraping\docs\IBGO_SCRAPING_GUIDES.md`             | `\scraping\docs\lessons\lessons_ibgo.md`  | REST API — No pagination. 31 verified municipalities (10,000+ associations). ⚠️ Email concatenation handled. NO org numbers. |
| ACTORS SMARTBOOK | `\scraping\docs\ACTORS_SMARTBOOK_SCRAPING_GUIDES.md` | `\scraping\docs\lessons\lessons_actor.md` | REST API — Paginated. 22 verified municipalities, 12 scraped (3,425 associations). ⚠️ Email concatenation handled. |
| OTHER            | `\scraping\docs\OTHER_SCRAPING_GUIDES.md`            | `\scraping\lessons\lessons_misc.md`       | Miscellaneous — PDFs, custom websites, CSV, Excel, etc. |

**NOTE:**
Always use **Playwright MCP** as your assistant tool.
If it is not already running, **start it before executing any scraping actions**.

---

## Critical Data Handling Rules

### Email Field Concatenation (IBGO & Actor Smartbook)

⚠️ **CRITICAL**: Both IBGO and Actor Smartbook APIs sometimes return **multiple comma-separated emails** in a single field.

**Example problematic data**:
```json
{
  "Email": "email1@test.com, email2@test.com, email3@test.com"
}
```

**Required handling**:
1. **Detect** concatenated emails with `email.includes(',')`
2. **Split** into individual addresses
3. **Create separate contact records** for each email
4. **Set association.email to null** when multiple emails exist

**Implementation pattern**:
```typescript
if (customer.Email && customer.Email.includes(',')) {
  const emails = customer.Email.split(',')
    .map(e => e.trim())
    .filter(e => e && e.length > 0 && e.includes('@'));

  emails.forEach(email => {
    contacts.push({
      contact_person_name: null,
      contact_person_role: null,
      contact_person_email: email,
      contact_person_phone: null,
    });
  });
  associationEmail = null;
} else {
  associationEmail = customer.Email;
}
```

**Database requirement**: `Association.email` MUST be `TEXT` type (not VARCHAR) in Prisma schema.

### System-Specific Limitations

| System | Organization Numbers | Email Concatenation | Contact Data Quality |
|--------|---------------------|---------------------|---------------------|
| IBGO | ❌ NOT available | ⚠️ Occurs (~0.01%) | Low (<5% have contacts) |
| Actor Smartbook | ✅ Available | ⚠️ Occurs (~0.01%) | Medium (~30% have contacts) |
| FRI | ✅ Usually available | ❓ Unknown | Medium |
| RBOK | ❓ Unknown | ❓ Unknown | ❓ Unknown |

---

## Directory and File Standards

⚠️ **Critical Rule:**
You must **never save files in the root directory**.
Doing so is considered a **severe error** and will result in immediate replacement of the agent.

| Function                | Path                      | Naming Convention                                    | Description                                                  |
| ----------------------- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| Final JSON files        | `\scraping\json`          | `<municipality>_<SOURCE_SYSTEM>_YYYY-MM-DD_HH-MM.json` | **NEW FORMAT (Oct 2025)**: Includes source system (IBGO, ActorSmartbook). Only Pretty JSON (no JSONL). Overwrites existing. |
| Lessons Learned         | `\scraping\docs\lessons\` | `lessons_<system>.md` (e.g., `lessons_ibgo.md`)      | System-level lessons, not per municipality. Update when new patterns discovered. |
| Guides                  | `\scraping\docs\`         | `<SYSTEM>_SCRAPING_GUIDES.md`                        | Update when significant findings or new import logic are discovered. |
| Inspections / Lab files | `\scraping\inspects`      | `<municipality>_inspects.ts`                         | Used for experimental tests and debugging.                   |
| Ready-to-run scripts    | `\scraping\scripts`       | `<system>_scrape.bat`, `<system>_import.bat`         | Batch files for bulk operations. Individual municipality scripts deprecated. |
| Codegen traces          | `\scraping\codegen`       | `<municipality>_codegen.txt`                         | Files provided by the user showing recorded navigation and clicks. |
| Logs                    | `\scraping\logs`          | `<municipality>.log`                                 | Appends to same file per municipality across runs.           |



