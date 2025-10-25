# FUNCTIONAL_SPEC.md
**System:** Municipal Association CRM & Web Scraping Platform  
**Version:** 1.1  
**Last updated:** 2025-10-24  
**Author:** Mattias Cederlund & AI Assistant  

---

## 1. System Overview

The Municipal Association CRM is a web-based system that combines **automated data collection (Playwright)** from Swedish municipalities’ public association registries with a **centralized CRM** for follow-up, segmentation, and AI-assisted communication.

The system allows users to:
- Scrape and normalize association data into a unified schema  
- Browse, filter, and enrich associations  
- Manage contacts, notes, and activities  
- Automate follow-ups through a structured CRM pipeline  
- Export results in multiple formats  
- Receive AI-generated insights, email drafts, and enrichment suggestions  

The data pipeline and scraping logic follow the specifications in  
`CRM_SCRAPING_INSTRUCTIONS_V.1.1.md`.

---

## 2. Core Functional Areas

### 2.1 Data Collection & Normalization

| Feature | Description |
|----------|--------------|
| **Full pagination** | Automatically iterates through all result pages; detects end-of-list when “Next” is missing or disabled. |
| **Detail page crawling** | Opens every association’s detail page to extract contact data, tables, and free-text sections (e.g., “Övrig information”). |
| **Unified JSON schema** | Each record follows a standardized format with the following top-level keys:<br> `run_metadata`, `association`, `contacts`, `source_navigation`, `extras`. |
| **Label normalization** | Converts Swedish/English labels to snake_case; merges synonyms and normalizes common values (e.g., “Founded” → `founded_year`). |
| **Data cleansing** | Removes duplicates, trims whitespace, converts empty fields to `null`, and parses multi-value lists. |
| **Output formats** | Each run outputs both `.jsonl` (newline-delimited) and `.json` (pretty printed). |
| **Logging & validation** | Every run logs page count, discovered items, failed pages, and timestamp. |

---

### 2.2 CRM Interface

| Component | Description |
|------------|-------------|
| **List / Grid / Map view** | Displays all associations with switchable visualizations. |
| **Advanced filtering** | Filter by municipality, type, activity, CRM status, pipeline stage, tags, membership, assigned user, and date range. Full-text search is supported. |
| **Details page** | Tabs: *Overview*, *Contacts*, *Notes*, *Activity log*, *Raw data*. |
| **Contact management** | Add / edit / delete contacts; enforce one primary contact per association. |
| **Notes** | Add or edit notes (only author can modify/delete). Taggable for topic grouping. |
| **Activity log** | Automatic logging of important actions (status changes, edits, contact updates). |
| **Statistics** | Backend-generated dashboards showing totals, members, uncontacted orgs, top municipalities, and most frequent activities. |
| **Exports** | Supports XLSX (multi-sheet), CSV (`;` delimited, UTF-8-BOM), and JSON. |

---

### 2.3 AI Modules

| Module | Purpose |
|---------|----------|
| **AI Next-Step Advisor** | Generates prioritized next actions for each association (with reason, timeframe, and expected outcome). |
| **AI Enrichment Planner** | Identifies missing fields (e.g., org. no, phone, website, description) and suggests how to acquire them. |
| **AI Email Generator** | Produces short, personalized emails (first contact, follow-up, event invitation, etc.) ready for copy-paste. |
| **AI Segmentation Assistant** | Creates smart segments based on activity, association type, engagement, or potential. |
| **AI Overview Summary** | Summarizes relationship status, strengths, and recommended next steps for managers. |

---

### 2.4 Authentication & Security

- **Auth Provider:** NextAuth (Google OAuth and credential login)  
- **Session Type:** JWT with session middleware  
- **Access Control:** Role-based (USER, SALES, MANAGER, ADMIN)  
- **Protection:** Middleware guards for API routes and role checks in UI components  

---

## 3. CRM Pipeline

The CRM pipeline describes the full engagement lifecycle for each association.  
Every record includes a `pipeline_status` field linked to the `crm_pipeline_status` lookup table.

### 3.1 Pipeline Stages

| Code | Label | Description | Typical Trigger |
|------|--------|-------------|-----------------|
| `NEW` | New | Newly imported from scraping; not yet reviewed. | Automatically assigned on import |
| `QUALIFIED` | Qualified Lead | Contact verified or enrichment complete; relevant for outreach. | Manual mark or AI qualification |
| `CONTACTED` | Contacted | First email/phone contact made. | Note or activity of type “Contact” |
| `FOLLOW_UP` | Follow-up | Awaiting reply or further discussion required. | Manual update or scheduled task |
| `INTERESTED` | Interested | Association has shown positive interest. | Activity or note tagged “Interested” |
| `IN_DISCUSSION` | In Discussion | Ongoing dialogue or meeting planned. | Manual update |
| `MEMBER` | Member | Converted to active member or registered partner. | Manual or integration update |
| `INACTIVE` | Inactive | Contact lost or no further interest. | Manual or time-based rule |
| `ARCHIVED` | Archived | Historical record kept for reference only. | Manual archive or cleanup rule |

### 3.2 Pipeline Logic

- **Default status:** `NEW`
- **Allowed transitions:**  
  - Only forward transitions are automatic (`NEW → QUALIFIED → CONTACTED → FOLLOW_UP → INTERESTED → IN_DISCUSSION → MEMBER`)  
  - Reverse or skip transitions require manual confirmation.  
- **Automatic triggers:**  
  - Adding a note of type *contact* sets `pipeline_status = CONTACTED`  
  - AI “Next Step” suggestion can automatically propose a new status.  
  - If no activity for 180 days, system may auto-flag as `INACTIVE`.  
- **Visual indicators:**  
  - Color badges for quick recognition (e.g., grey=NEW, blue=CONTACTED, green=MEMBER, red=INACTIVE).  
- **Statistics integration:**  
  - Each change is logged in `activities` table for dashboard aggregation.

---

### 3.3 Database Schema

#### `associations`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Association name |
| `municipality` | VARCHAR(100) | Municipality name |
| `association_type` | VARCHAR(100) | Type (sports, culture, etc.) |
| `activities` | JSON | List of activities |
| `address`, `email`, `phone`, `website` | TEXT | Contact info |
| `description` | TEXT | Rich description text |
| `pipeline_status` | ENUM | FK → `crm_pipeline_status.code` |
| `is_member` | BOOLEAN | Membership flag |
| `source_system` | VARCHAR(50) | Origin system (FRI, IdrottOnline, etc.) |
| `scraped_at` | DATETIME | Scrape timestamp |
| `run_id` | UUID | Reference to scraping run |

#### `crm_pipeline_status`
| Field | Type | Description |
|--------|------|-------------|
| `code` | VARCHAR(30) | e.g., NEW, QUALIFIED, ... |
| `label` | VARCHAR(100) | Display label |
| `color` | VARCHAR(20) | UI badge color |
| `order_index` | INT | Sorting order |

#### `contacts`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `association_id` | FK → `associations.id` | Relation |
| `name`, `email`, `phone`, `role` | TEXT | Contact data |
| `is_primary` | BOOLEAN | One per association |
| `created_at`, `updated_at` | DATETIME | Audit fields |

#### `notes`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `association_id` | FK → `associations.id` | Relation |
| `author_id` | FK → `users.id` | Author |
| `content` | TEXT | Note text |
| `tags` | JSON | Array of tags |
| `created_at`, `updated_at` | DATETIME | Audit fields |

#### `activities`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `association_id` | FK → `associations.id` | Relation |
| `type` | VARCHAR(50) | e.g., "status_change", "email_sent", "note_added" |
| `old_value`, `new_value` | TEXT | Optional before/after |
| `timestamp` | DATETIME | Event time |

#### `ai_recommendations`
| Field | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `association_id` | FK → `associations.id` | Relation |
| `category` | VARCHAR(50) | e.g., NEXT_STEP, ENRICHMENT |
| `content` | JSON | AI result payload |
| `created_at` | DATETIME | Timestamp |

---

### 3.4 API Endpoints (tRPC / REST Summary)

| Endpoint | Method | Purpose |
|-----------|--------|----------|
| `/api/associations/list` | GET | Paginated list with filters |
| `/api/associations/{id}` | GET | Fetch association details |
| `/api/associations/update` | POST | Update basic info / pipeline status |
| `/api/contacts/create` | POST | Add new contact |
| `/api/contacts/update` | POST | Update or set primary contact |
| `/api/notes/create` | POST | Add a note |
| `/api/notes/delete` | DELETE | Delete note (author only) |
| `/api/export/{format}` | GET | Export current filter (XLSX, CSV, JSON) |
| `/api/ai/next-step` | POST | Generate AI next-step recommendations |
| `/api/ai/enrichment` | POST | Suggest data enrichment tasks |
| `/api/ai/email` | POST | Generate email drafts |
| `/api/ai/segment` | POST | Generate AI-based segmentation |
| `/api/stats/overview` | GET | Aggregated statistics for dashboard |
| `/api/auth/session` | GET | Current user session info |

---

## 4. Typical Use Cases

1. **Find target groups in a municipality**  
   Filter by municipality = Östhammar, type = “Sports”, has email = true → export to Excel.

2. **Follow up a specific association**  
   Open details → check primary contact → add new note → move pipeline status to “Follow-up”.

3. **AI-assisted planning**  
   Select 10 associations in “Interested” → run *AI Next Step* → receive ranked actions per association.

4. **Mass email preparation**  
   Filter all non-members with emails → generate “First contact” email via AI → copy into email client.

5. **Data enrichment**  
   Run *AI Enrichment* to detect missing data and get source suggestions.

6. **Segment creation**  
   Use *AI Segmentation* to define cultural organizations with high potential → export CSV.

7. **Activity and performance review**  
   Open *Statistics* page to view total counts, member ratio, contacted vs. uncontacted, and trends.

8. **Validate scraped data**  
   Use *Raw data* tab to verify original source and scraping timestamp.

---

## 5. Suggested Enhancements (“Nice to Have”)

| Feature | Benefit |
|----------|----------|
| **Duplicate detection & merge wizard** | Prevents duplicate associations; guided field-by-field merge. |
| **GDPR compliance tools** | Flag personal data, export contact info, handle “forget me” requests. |
| **Email integration (IMAP / SMTP / M365)** | Sync sent and received emails into CRM automatically. |
| **Calendar & reminders** | Set follow-up dates and show in dashboard view. |
| **Campaign tool (light)** | Send personalized mass emails with built-in tracking. |
| **Scrape job monitor** | UI dashboard for Playwright jobs, page counters, and run logs. |
| **Webhook & API key system** | Integrations with NocoBase, Mind2, Atlas. |
| **Validation rules & data policies** | Field validation (org.no, email domain, founded_year, etc.). |
| **Pipeline health dashboard** | Highlights bottleneck stages and AI-suggested fixes. |
| **Bulk update interface** | Mass-edit pipeline status, tags, or assigned user. |

---

## 6. Technical Foundations

- **Frontend:** Next.js + TypeScript  
- **Backend:** tRPC + Prisma + PostgreSQL  
- **Auth:** NextAuth (JWT sessions)  
- **Exports:** ExcelJS, JSON2CSV  
- **AI Integration:** OpenAI GPT-5 API (Next-step, Email, Enrichment, Segmentation)  
- **Scraping Engine:** Playwright (Node.js, Chromium)  
- **Deployment:** Docker Compose (frontend, backend, database, scraper)  

---

## 7. Acceptance Criteria (Extract from v1.1)

- Scraping covers **all pages** without infinite loops.  
- Each record contains **all visible fields** from the source, including “Other information” tables.  
- JSON output matches unified schema.  
- CRM pipeline statuses correctly transition and reflect activity.  
- Exports produce valid UTF-8-BOM files with correct headers.  
- AI modules respond with structured JSON payloads under `content`.  
- Role-based access enforced for all protected routes.  

---

### Document References
- `CRM_SCRAPING_INSTRUCTIONS_V.1.1.md` – scraping rules & JSON schema  
- `CRM_IMPLEMENTATION_1.md–4.md` – implementation details & endpoints  
- `LESSONS_LEARNED_*.md` – system-specific best practices  

---
git 