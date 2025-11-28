# CRM Pipeline & Status Redesign – Context and Target Design

## 1. System Context

The CRM system in this repo is built as a **static-exported Next.js frontend** talking to a **PHP API** on Loopia:

- **Frontend**
  - Location: `crm-app/`
  - Tech: Next.js 15 / React 19, TypeScript, Tailwind, shadcn UI
  - Build: `npm run export` → static output created by `scripts/create-static-out.mjs`
  - Deploy: `scripts/deploy_loopia_frontend.bat` uploads `temp/local_webroot` to Loopia via WinSCP/FTP
  - Runtime: No Node backend in production; only static files plus XHR calls to PHP under `/api/*.php`.

- **Backend**
  - Legacy PHP API in `/api` on the Loopia web hotel.
  - Example endpoints:
    - `api/associations.php`
    - `api/contacts.php`
  - Database: MySQL/MariaDB (see `database_backup.sql`).
  - PHP uses `mysqli` with prepared statements and custom helpers (e.g. `bind_all` in `contacts.php`).
  - Local dev tooling also uses **Prisma** (see `crm-app/prisma/schema.prisma`) to inspect and seed the same MySQL database.

The **frontend must never depend on the local Docker/Node backend** in production.  
All runtime data must come from the **Loopia PHP API**.

---

## 2. Current CRM Data Model (Relevant Parts)

### 2.1 `Association` table (MySQL / Prisma)

From `database_backup.sql` and `crm-app/prisma/schema.prisma`, the core entity for the CRM UI is:

```sql
CREATE TABLE `Association` (
  `id` varchar(191) NOT NULL,
  `sourceSystem` varchar(191) NOT NULL,
  `municipalityId` varchar(191) DEFAULT NULL,
  `municipality` varchar(191) DEFAULT NULL,
  `scrapeRunId` varchar(191) DEFAULT NULL,
  `scrapedAt` datetime(3) NOT NULL,
  `detailUrl` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `orgNumber` varchar(191) DEFAULT NULL,
  `types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`types`)),
  `activities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`activities`)),
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`categories`)),
  `homepageUrl` varchar(191) DEFAULT NULL,
  `streetAddress` varchar(191) DEFAULT NULL,
  `postalCode` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `email` text DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`description`)),
  `descriptionFreeText` text DEFAULT NULL,
  `crmStatus` enum('UNCONTACTED','CONTACTED','INTERESTED','NEGOTIATION','MEMBER','LOST','INACTIVE') NOT NULL DEFAULT 'UNCONTACTED',
  `isMember` tinyint(1) NOT NULL DEFAULT 0,
  `memberSince` datetime(3) DEFAULT NULL,
  `pipeline` enum('PROSPECT','QUALIFIED','PROPOSAL_SENT','FOLLOW_UP','CLOSED_WON','CLOSED_LOST') NOT NULL DEFAULT 'PROSPECT',
  `assignedToId` varchar(191) DEFAULT NULL,
  `listPageIndex` int(11) DEFAULT NULL,
  `positionOnPage` int(11) DEFAULT NULL,
  `paginationModel` varchar(191) DEFAULT NULL,
  `filterState` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filterState`)),
  `extras` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `importBatchId` varchar(191) DEFAULT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Association_crmStatus_pipeline_idx` (`crmStatus`,`pipeline`),
  ...
) ENGINE=InnoDB ...
```

In Prisma (`crm-app/prisma/schema.prisma`):

```
enum CrmStatus {
  UNCONTACTED
  CONTACTED
  INTERESTED
  NEGOTIATION
  MEMBER
  LOST
  INACTIVE
}

enum Pipeline {
  PROSPECT
  QUALIFIED
  PROPOSAL_SENT
  FOLLOW_UP
  CLOSED_WON
  CLOSED_LOST
}

model Association {
  id           String     @id @default(cuid())
  ...
  crmStatus    CrmStatus  @default(UNCONTACTED)
  isMember     Boolean    @default(false)
  memberSince  DateTime?
  pipeline     Pipeline   @default(PROSPECT)
  assignedToId String?
  ...
}
```

### 2.2 Frontend usage

The main modal you showed corresponds to:

- `crm-app/components/modals/association-details-dialog.tsx`
- It defines the exact same enums client-side:

```
const CRM_STATUSES = [
  "UNCONTACTED",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATION",
  "MEMBER",
  "LOST",
  "INACTIVE",
] as const

const PIPELINES = [
  "PROSPECT",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "FOLLOW_UP",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const
```

Validation mirrors this in `crm-app/lib/validators/association.ts`.

The PHP API (`api/associations.php`) exposes:

- Filters on `crmStatus` and `pipeline`.
- A POST handler `handle_create_association()` that accepts `status` and `pipeline`.
- A PUT handler `handle_update_association()` that updates these fields.

Both the **database**, **Prisma schema**, **frontend**, and **PHP API** are tightly coupled to these enum values.

------

## 3. Known Problems With the Current Model

1. **`crmStatus` mixes concepts**
   - It currently holds:
     - Lead/contact states (`UNCONTACTED`, `CONTACTED`, `INTERESTED`, `NEGOTIATION`)
     - Membership/customer lifecycle (`MEMBER`, `LOST`, `INACTIVE`)
   - This makes it difficult to:
     - Run clean sales funnels.
     - Separate “sales pipeline” from “is this a paying member”.
2. **`pipeline` is underspecified**
   - Values: `PROSPECT`, `QUALIFIED`, `PROPOSAL_SENT`, `FOLLOW_UP`, `CLOSED_WON`, `CLOSED_LOST`.
   - There is no explicit **Discovery/Needs Analysis** step.
   - `FOLLOW_UP` is semantically vague (“anything after proposal”).
3. **No history**
   - Changing `crmStatus` or `pipeline` overwrites the previous value.
   - You cannot reconstruct:
     - When a lead became “INTERESTED”.
     - How long an association stayed in “NEGOTIATION”.
     - Who changed the stage.
4. **No explicit concept of onboarding pipeline**
   - Onboarding is implicit via `isMember`, `memberSince`, and `MEMBER/INACTIVE` in `crmStatus`.
   - There is no structured process like:
     - `READY_FOR_ONBOARDING → ONBOARDING_IN_PROGRESS → ONBOARDED`.
5. **Potential for HTTP 500s in PHP layer**
   - `api/associations.php` and `api/contacts.php` rely on `mysqli_stmt::bind_param`.
   - When parameters are not passed by reference (e.g. array entries, direct function calls), PHP throws
      `Argument #N could not be passed by reference` → HTTP 500.
   - Any schema or payload change that increases the number of bound parameters increases the risk of introducing new 500s if handled incorrectly.
6. **Static deployment constraint**
   - The frontend cannot rely on any server-side rendering logic at runtime.
   - All dynamic data (including pipeline options, status lists, etc.) must be:
     - Either embedded as static constants in the exported bundle, or
     - Fetched from the PHP API at runtime via XHR.

------

## 4. Target Conceptual Model

We want a clean separation between:

1. **Lead status (how “warm” the association is)**
2. **Sales pipeline (where the commercial process is)**
3. **Onboarding / member lifecycle (what kind of customer they are and how far they are in activation)**

### 4.1 Lead Status (per association)

Conceptually:

```
UNCONTACTED
CONTACTED
INTERESTED
NURTURING
MQL          (Marketing Qualified Lead)
SQL          (Sales Qualified Lead)
DISQUALIFIED
```

For now, we **reuse the existing `crmStatus` values** as the primary UI/status field, but the redesign introduces:

- A dedicated **lead status definition table** for metadata.
- A **status history table** to track changes over time.

This allows us to later refine or split `crmStatus` without losing data.

### 4.2 Sales Pipeline (per association)

New logical sales pipeline stages:

```
QUALIFIED_LEAD
DISCOVERY
PROPOSAL_SENT
NEGOTIATION
CLOSED_WON
CLOSED_LOST
```

Mapping from current enum values:

- `PROSPECT`      → `QUALIFIED_LEAD`
- `QUALIFIED`     → `DISCOVERY`
- `PROPOSAL_SENT` → `PROPOSAL_SENT`
- `FOLLOW_UP`     → `NEGOTIATION`
- `CLOSED_WON`    → `CLOSED_WON`
- `CLOSED_LOST`   → `CLOSED_LOST`

The actual `Association.pipeline` column will be migrated to use the **new enum values**, with data migrated using the mapping above.

We also introduce:

- A **pipeline stage definition table** for metadata (order, probability, “closed won/lost” flags).
- A **pipeline history table** for changes.

### 4.3 Onboarding / Member Lifecycle

Onboarding is treated as a **separate lifecycle axis**, not overloaded into `crmStatus` or `pipeline`:

Conceptually:

```
PROSPECT              (not yet a paying member)
READY_FOR_ONBOARDING  (deal won, onboarding not started)
ONBOARDING_IN_PROGRESS
ONBOARDED             (active)
INACTIVE_MEMBER       (temporarily inactive)
CHURNED               (terminated)
```

This is modeled as:

- A **lifecycle definition table**.
- A field on `Association` referencing the current lifecycle stage.
- A history table tracking lifecycle transitions.

------

## 5. Target Database Design (New Tables)

The redesign adds **metadata + history tables** while keeping `Association` as the main entity.

### 5.1 Lead status definition

```
CREATE TABLE `CrmLeadStatusDefinition` (
  `code`        varchar(50)  NOT NULL, -- e.g. 'UNCONTACTED', 'MQL'
  `label`       varchar(191) NOT NULL, -- human-readable label
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

This table is **authoritative** for which lead statuses are valid and in which order they should appear.

### 5.2 Sales pipeline stage definition

```
CREATE TABLE `CrmPipelineStageDefinition` (
  `code`              varchar(50)  NOT NULL, -- e.g. 'QUALIFIED_LEAD'
  `pipelineType`      varchar(50)  NOT NULL, -- e.g. 'SALES'
  `label`             varchar(191) NOT NULL,
  `description`       text         NULL,
  `sortOrder`         int          NOT NULL DEFAULT 0,
  `isClosedWon`       tinyint(1)   NOT NULL DEFAULT 0,
  `isClosedLost`      tinyint(1)   NOT NULL DEFAULT 0,
  `defaultProbability` int         NULL,     -- 0–100, nullable if not used
  `isActive`          tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`         datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`         datetime(3)  NOT NULL,
  PRIMARY KEY (`code`),
  KEY `CrmPipelineStageDefinition_pipelineType_sortOrder_idx` (`pipelineType`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.3 Lifecycle stage definition

```
CREATE TABLE `CrmLifecycleStageDefinition` (
  `code`        varchar(50)  NOT NULL, -- e.g. 'PROSPECT', 'ONBOARDED'
  `label`       varchar(191) NOT NULL,
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.4 Association lead status history

```
CREATE TABLE `AssociationLeadStatusHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStatus`    varchar(50)  NULL,
  `toStatus`      varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL, -- 'frontend', 'api', 'script', etc.
  PRIMARY KEY (`id`),
  KEY `AssociationLeadStatusHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationLeadStatusHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.5 Association pipeline history

```
CREATE TABLE `AssociationPipelineHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStage`     varchar(50)  NULL,
  `toStage`       varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL,
  PRIMARY KEY (`id`),
  KEY `AssociationPipelineHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationPipelineHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.6 Association lifecycle history

```
CREATE TABLE `AssociationLifecycleHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStage`     varchar(50)  NULL,
  `toStage`       varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL,
  PRIMARY KEY (`id`),
  KEY `AssociationLifecycleHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationLifecycleHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5.7 Optional: lifecycle field on `Association`

To make lifecycle directly queryable without joins:

```
ALTER TABLE `Association`
  ADD COLUMN `lifecycleStage` varchar(50) NULL AFTER `pipeline`;
```

This column would reference `CrmLifecycleStageDefinition.code` at the application level.

------

## 6. Frontend & API Integration Overview

### 6.1 Frontend

Key files:

- `crm-app/components/modals/association-details-dialog.tsx`
  - Displays **Status** and **Pipeline**.
  - Uses constant arrays `CRM_STATUSES` and `PIPELINES`.
- `crm-app/lib/validators/association.ts`
  - Validates `status` and `pipeline` fields against the same enums.
- `crm-app/lib/api.ts`
  - Wraps calls to `api/associations.php` and passes:
    - `status`, `crmStatuses`, `pipeline`, etc. as filter parameters.

### 6.2 PHP API

- `api/associations.php`:
  - `handle_list_associations()`:
    - Supports filters:
      - `status` (single)
      - `crmStatuses[]` (multiple)
      - `pipeline`, `pipelines[]` (single/multiple)
  - `handle_create_association()`:
    - Accepts initial `status` and `pipeline` in the JSON body.
  - `handle_update_association()`:
    - Updates `crmStatus` and `pipeline`, based on body keys.
- `api/contacts.php`:
  - Unrelated to pipeline, but known to be a source of HTTP 500s when `bind_param` is used incorrectly.
  - Any new changes must keep existing soft delete and filtering behaviour intact.

------

## 7. HTTP 500 Failure Modes to Watch

When implementing this redesign, the main risks that have historically caused HTTP 500s are:

1. **Misaligned enums**
   - MySQL `enum` values out of sync with:
     - Prisma `enum` definitions.
     - Frontend `CRM_STATUSES` and `PIPELINES` arrays.
     - PHP normalization functions (`normalize_association_status`, `normalize_pipeline`).
   - This results in:
     - Inserts failing due to invalid values.
     - Silent truncation (if not strict).
     - Inconsistent filters.
2. **`bind_param` misuse**
   - `mysqli_stmt::bind_param` requires parameters passed **by reference**.
   - Common error:
     - Passing array elements or function returns directly.
     - Dynamically building parameter lists incorrectly.
   - Leads to:
     - `Argument #N could not be passed by reference` → HTTP 500.
3. **Static export vs. API shape**
   - If the frontend bundle is built with a different enum set than the API/database, runtime calls can send invalid values.
   - Because the site is static, fixing this always requires a **full rebuild + redeploy**.

------

## 8. Non-goals / Explicit Boundaries

- No introduction of a new Node.js backend for production.
- No migration away from the existing PHP API for associations or contacts.
- No changes to authentication, user management, or scraping flows.
- No deletion of existing DB columns; they may be marked as legacy later, but the initial redesign must be **additive and compatible**.
- No experimental additional pipelines beyond:
  - Lead status
  - Sales pipeline
  - Onboarding / member lifecycle

This context file is the foundation for the implementation plan in `crm_pipeline_implementation_plan.md`.





ChatGPT can make mistakes. Check important info. See Cookie Preferences.