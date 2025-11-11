# Tag Management System - Implementation Plan

**Version:** 1.0
**Date:** 2025-11-11
**Author:** AI Assistant
**Status:** Planning Phase

---

## Executive Summary

This document outlines the comprehensive architecture and implementation plan for extending the existing tag management system. The enhancement transforms the current baseline tag population script (`populate_tags.bat`) into a production-grade, idempotent tag generation system with:

- **Backup integration** with existing database backup infrastructure
- **Idempotent/incremental mode** for safe repeated executions
- **Dry-run reporting** for change preview and audit trails
- **Provenance tracking** to distinguish baseline tags from future AI-generated tags
- **Taxonomy guardrails** with alias mapping to canonical names
- **Robust error handling** with recovery mechanisms
- **Web UI integration** for on-demand tag generation from the CRM application

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [System Architecture](#2-system-architecture)
3. [Database Schema Extensions](#3-database-schema-extensions)
4. [Script Enhancement: populate_tags_v2](#4-script-enhancement-populate_tags_v2)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend UI Components](#6-frontend-ui-components)
7. [Taxonomy Management](#7-taxonomy-management)
8. [Reporting & Audit Trail](#8-reporting--audit-trail)
9. [Error Handling & Recovery](#9-error-handling--recovery)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Plan](#11-deployment-plan)
12. [Implementation Task List](#12-implementation-task-list)

---

## 1. Current State Analysis

### 1.1 Existing Implementation

**Scripts:**
- `scripts/populate_tags.bat` - Windows batch wrapper
- `legacy/crm-app/prisma/populate-tags.ts` - Core population logic
- `scripts/dbbackup_full.bat` - Database backup utility

**Current populate-tags.ts Logic:**
```typescript
// Batch processing (100 associations at a time)
while (associations = fetch_batch(offset, limit)) {
  for each association:
    1. Extract arrays from types, activities, categories (JSON fields)
    2. Normalize to lowercase
    3. Deduplicate
    4. Upsert tags (create if not exists)
    5. Overwrite association.tags relation (set operation)
  offset += batchSize
}
```

**Database Schema:**
```sql
-- Tag table
Tag {
  id: varchar(191) PRIMARY KEY (cuid)
  name: varchar(191) UNIQUE
  color: varchar(191) DEFAULT '#3b82f6'
  createdAt: datetime(3)
}

-- Many-to-many pivot
_AssociationTags {
  A: varchar(191)  -- associationId
  B: varchar(191)  -- tagId
  PRIMARY KEY (A, B)
}
```

**API Endpoint:**
- `api/tags.php` - List, create, attach, detach tags

**Frontend Components:**
- `crm-app/components/tag-selector.tsx` - Multi-select tag UI with create functionality

### 1.2 Limitations of Current System

1. **No provenance tracking** - Cannot distinguish baseline tags from manually created or future AI tags
2. **Overwrites existing tags** - `set` operation replaces all tags on association
3. **No dry-run mode** - Changes are immediately committed to database
4. **No reporting** - No summary of what was changed
5. **No taxonomy normalization** - Spelling variants create duplicate tags
6. **No error recovery** - Script fails completely on any error
7. **No backup integration** - Manual backup required before running
8. **No UI access** - Only accessible via command-line script

### 1.3 Target Loopia Database

**Connection Details (from .env):**
```
Host: mysql513.loopia.se
Port: 3306
User: walla3jk@m383902
Database: medlemsregistret_se_db_4
```

---

## 2. System Architecture

### 2.1 Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CRM Application                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js)                                   │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ /tags (new page)                                │ │  │
│  │  │  ├─ Tab: Översikt (existing tags)               │ │  │
│  │  │  ├─ Tab: Generera nya taggar                    │ │  │
│  │  │  │   └─ Button: "Generera baslinje-taggar"     │ │  │
│  │  │  ├─ Tab: Taxonomi (alias mappings)             │ │  │
│  │  │  └─ Tab: Rapporter (execution logs)            │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                        ↓                              │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ API Client (lib/api.ts)                         │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PHP Backend (api/)                                   │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ /api/tags.php (existing)                        │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │ /api/tag_generation.php (new)                   │ │  │
│  │  │  ├─ POST /generate (trigger generation)         │ │  │
│  │  │  ├─ GET /status/:jobId (check progress)         │ │  │
│  │  │  └─ GET /reports (list execution logs)          │ │  │
│  │  ├─────────────────────────────────────────────────┤ │  │
│  │  │ /api/tag_taxonomy.php (new)                     │ │  │
│  │  │  ├─ GET / (list aliases)                        │ │  │
│  │  │  ├─ POST / (create alias mapping)               │ │  │
│  │  │  └─ DELETE /:id (remove alias)                  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tag Generation Engine (TypeScript)                   │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ scripts/populate_tags_v2.ts (new)               │ │  │
│  │  │  ├─ Backup integration                          │ │  │
│  │  │  ├─ Dry-run mode                                │ │  │
│  │  │  ├─ Idempotent upsert                           │ │  │
│  │  │  ├─ Taxonomy normalization                      │ │  │
│  │  │  ├─ Provenance tracking                         │ │  │
│  │  │  ├─ Progress reporting                          │ │  │
│  │  │  └─ Error recovery                              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Loopia MySQL Database                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tag                    (existing)                     │  │
│  │ _AssociationTags       (existing)                     │  │
│  │ TagSource              (new - provenance)             │  │
│  │ TagAlias               (new - taxonomy)               │  │
│  │ TagGenerationRun       (new - audit log)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Execution Flow

```
User clicks "Generera baslinje-taggar"
         ↓
Frontend shows confirmation dialog:
  "Detta kommer att:
   - Ta backup av databasen
   - Generera taggar från föreningsdata
   - Länka taggar till föreningar
   Vill du fortsätta?"
         ↓
POST /api/tag_generation.php
  body: { mode: "dry-run" | "execute", source: "db:baseline" }
         ↓
PHP validates admin role + CSRF
         ↓
[IF mode=execute] Run dbbackup_full.bat
         ↓
PHP spawns TypeScript script via shell_exec:
  npx tsx scripts/populate_tags_v2.ts --mode=MODE --source=SOURCE --job-id=JOB_ID
         ↓
Script execution:
  1. Connect to Loopia database
  2. Load taxonomy aliases
  3. Batch fetch associations
  4. For each association:
     a. Extract types, activities, categories
     b. Normalize via taxonomy (aliases → canonical)
     c. Deduplicate
     d. [IF dry-run] Log planned changes
     e. [IF execute] Upsert tags + create links
     f. Track provenance (source="db:baseline")
  5. Generate CSV report
  6. Write TagGenerationRun record
  7. Return summary JSON
         ↓
PHP streams progress to client (SSE or polling)
         ↓
Frontend displays:
  - Progress bar
  - Real-time counts (new tags, new links, affected associations)
  - Link to download CSV report
         ↓
[IF dry-run] Show preview table with "Apply Changes" button
[IF execute] Show success message with summary
```

### 2.3 Data Flow Diagrams

#### 2.3.1 Tag Extraction Pipeline

```
Association Record
├─ types: ["Idrottsklubb", "Fotboll"]
├─ activities: ["Träning", "Matcher"]
└─ categories: ["Sport"]
         ↓
    Extract Arrays
         ↓
Raw Tags: ["Idrottsklubb", "Fotboll", "Träning", "Matcher", "Sport"]
         ↓
    Normalize to Lowercase
         ↓
["idrottsklubb", "fotboll", "träning", "matcher", "sport"]
         ↓
    Apply Taxonomy Aliases
         ↓
["idrottsklubb", "fotboll", "träning", "match", "sport"]
   (matcher → match via alias)
         ↓
    Deduplicate
         ↓
Final Tags: ["idrottsklubb", "fotboll", "träning", "match", "sport"]
         ↓
    Upsert to Tag table (with source=db:baseline)
         ↓
    Link to Association (_AssociationTags)
```

#### 2.3.2 Idempotent Link Creation

```
Association A has existing tags: [T1, T2]
New extraction produces: [T2, T3, T4]

Current behavior (BAD):
  SET operation → Replace all → Result: [T2, T3, T4]
  ⚠️ T1 is removed (not idempotent!)

New behavior (GOOD):
  MERGE operation → Add missing → Result: [T1, T2, T3, T4]
  ✅ T1 is preserved
  ✅ INSERT IGNORE INTO _AssociationTags for each new link
```

---

## 3. Database Schema Extensions

### 3.1 TagSource Table (Provenance Tracking)

```prisma
model TagSource {
  id            String   @id @default(cuid())
  tagId         String
  source        String   // "db:baseline", "db:types", "ai:web", "manual"
  sourceField   String?  // "types", "activities", "categories", null for manual
  confidence    Float?   // For AI-generated tags (0.0-1.0)
  createdAt     DateTime @default(now())
  createdBy     String?  // userId for manual tags

  tag           Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@index([tagId])
  @@index([source])
  @@index([createdAt])
}
```

**Purpose:** Track where each tag came from to enable:
- Filtering baseline tags vs AI tags
- Auditing tag creation sources
- Future cleanup of low-confidence AI tags
- Attribution for manually created tags

**SQL Schema:**
```sql
CREATE TABLE TagSource (
  id VARCHAR(191) PRIMARY KEY,
  tagId VARCHAR(191) NOT NULL,
  source VARCHAR(50) NOT NULL,
  sourceField VARCHAR(50),
  confidence DECIMAL(3,2),
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191),
  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
  INDEX idx_tagId (tagId),
  INDEX idx_source (source),
  INDEX idx_createdAt (createdAt)
);
```

### 3.2 TagAlias Table (Taxonomy Management)

```prisma
model TagAlias {
  id            String   @id @default(cuid())
  alias         String   @unique  // "matcher", "fotbollsmatch"
  canonical     String              // "match"
  category      String?             // "sport", "culture", etc.
  createdAt     DateTime @default(now())
  createdBy     String?  // userId

  @@index([canonical])
  @@index([category])
}
```

**Purpose:** Normalize spelling variants and synonyms to canonical tag names:
- "matcher" → "match"
- "fotbollsmatch" → "match"
- "konsert" → "musik"

**SQL Schema:**
```sql
CREATE TABLE TagAlias (
  id VARCHAR(191) PRIMARY KEY,
  alias VARCHAR(191) UNIQUE NOT NULL,
  canonical VARCHAR(191) NOT NULL,
  category VARCHAR(50),
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191),
  INDEX idx_canonical (canonical),
  INDEX idx_category (category)
);
```

### 3.3 TagGenerationRun Table (Audit Log)

```prisma
model TagGenerationRun {
  id                    String   @id @default(cuid())
  status                String   // "running", "completed", "failed", "dry-run"
  mode                  String   // "dry-run", "execute"
  source                String   // "db:baseline", "ai:web"
  startedAt             DateTime @default(now())
  completedAt           DateTime?

  // Statistics
  associationsProcessed Int      @default(0)
  tagsCreated           Int      @default(0)
  linksCreated          Int      @default(0)
  linksSkipped          Int      @default(0)  // Already existed
  errors                Json?    // Array of error objects

  // Resume capability
  lastProcessedId       String?  // For recovery
  currentBatch          Int      @default(0)

  // Output artifacts
  reportPath            String?  // Path to CSV report
  reportUrl             String?  // Download URL
  summary               Json?    // Summary statistics

  // Attribution
  triggeredBy           String?  // userId or "system"
  triggeredByName       String?

  @@index([status])
  @@index([startedAt])
  @@index([source])
}
```

**Purpose:** Complete audit trail of all tag generation runs:
- Track success/failure status
- Store execution statistics
- Enable recovery from failures (resume from lastProcessedId)
- Link to downloadable reports
- Attribution for compliance

**SQL Schema:**
```sql
CREATE TABLE TagGenerationRun (
  id VARCHAR(191) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  startedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completedAt DATETIME(3),

  associationsProcessed INT NOT NULL DEFAULT 0,
  tagsCreated INT NOT NULL DEFAULT 0,
  linksCreated INT NOT NULL DEFAULT 0,
  linksSkipped INT NOT NULL DEFAULT 0,
  errors JSON,

  lastProcessedId VARCHAR(191),
  currentBatch INT NOT NULL DEFAULT 0,

  reportPath VARCHAR(500),
  reportUrl VARCHAR(500),
  summary JSON,

  triggeredBy VARCHAR(191),
  triggeredByName VARCHAR(191),

  INDEX idx_status (status),
  INDEX idx_startedAt (startedAt),
  INDEX idx_source (source)
);
```

### 3.4 Database Migration Script

**File:** `legacy/crm-app/prisma/migrations/add_tag_management_v2.sql`

```sql
-- Migration: Add Tag Management v2 Tables
-- Date: 2025-11-11
-- Description: Add provenance tracking, taxonomy, and audit logging for tags

-- 1. TagSource - Track tag origins
CREATE TABLE IF NOT EXISTS TagSource (
  id VARCHAR(191) PRIMARY KEY,
  tagId VARCHAR(191) NOT NULL,
  source VARCHAR(50) NOT NULL,
  sourceField VARCHAR(50),
  confidence DECIMAL(3,2),
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191),
  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
  INDEX idx_tagId (tagId),
  INDEX idx_source (source),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TagAlias - Taxonomy normalization
CREATE TABLE IF NOT EXISTS TagAlias (
  id VARCHAR(191) PRIMARY KEY,
  alias VARCHAR(191) UNIQUE NOT NULL,
  canonical VARCHAR(191) NOT NULL,
  category VARCHAR(50),
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191),
  INDEX idx_canonical (canonical),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TagGenerationRun - Audit log
CREATE TABLE IF NOT EXISTS TagGenerationRun (
  id VARCHAR(191) PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  startedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completedAt DATETIME(3),

  associationsProcessed INT NOT NULL DEFAULT 0,
  tagsCreated INT NOT NULL DEFAULT 0,
  linksCreated INT NOT NULL DEFAULT 0,
  linksSkipped INT NOT NULL DEFAULT 0,
  errors JSON,

  lastProcessedId VARCHAR(191),
  currentBatch INT NOT NULL DEFAULT 0,

  reportPath VARCHAR(500),
  reportUrl VARCHAR(500),
  summary JSON,

  triggeredBy VARCHAR(191),
  triggeredByName VARCHAR(191),

  INDEX idx_status (status),
  INDEX idx_startedAt (startedAt),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed common aliases (Swedish sports/culture terms)
INSERT INTO TagAlias (id, alias, canonical, category) VALUES
  (CONCAT('alias_', UUID()), 'matcher', 'match', 'sport'),
  (CONCAT('alias_', UUID()), 'fotbollsmatch', 'match', 'sport'),
  (CONCAT('alias_', UUID()), 'fotbollsmatcher', 'match', 'sport'),
  (CONCAT('alias_', UUID()), 'konsert', 'musik', 'kultur'),
  (CONCAT('alias_', UUID()), 'konserter', 'musik', 'kultur'),
  (CONCAT('alias_', UUID()), 'föreställning', 'teater', 'kultur'),
  (CONCAT('alias_', UUID()), 'föreställningar', 'teater', 'kultur'),
  (CONCAT('alias_', UUID()), 'träningspass', 'träning', 'sport'),
  (CONCAT('alias_', UUID()), 'träna', 'träning', 'sport')
ON DUPLICATE KEY UPDATE alias=alias;
```

---

## 4. Script Enhancement: populate_tags_v2

### 4.1 New Script Architecture

**File:** `scripts/populate_tags_v2.ts`

```typescript
// Core structure (pseudocode)

interface TagGenerationOptions {
  mode: 'dry-run' | 'execute';
  source: 'db:baseline' | 'db:types' | 'db:activities' | 'db:categories';
  jobId: string;
  resume?: boolean;
  lastProcessedId?: string;
}

interface TagExtractionResult {
  associationId: string;
  extractedTags: string[];  // Raw tags from JSON fields
  normalizedTags: string[]; // After lowercase + aliases
  newTags: string[];        // Tags that don't exist yet
  newLinks: Array<{ tagId: string; tagName: string }>; // Links to create
  existingLinks: string[];  // Already linked tags
}

class TagGenerator {
  constructor(private options: TagGenerationOptions) {}

  async execute(): Promise<TagGenerationRunResult> {
    // 1. Initialize job record
    const run = await this.initializeRun();

    try {
      // 2. Load taxonomy aliases
      const taxonomy = await this.loadTaxonomy();

      // 3. Batch process associations
      let offset = this.options.resume ? this.getResumeOffset() : 0;

      while (true) {
        const associations = await this.fetchBatch(offset);
        if (associations.length === 0) break;

        for (const assoc of associations) {
          try {
            const result = await this.processAssociation(assoc, taxonomy);

            if (this.options.mode === 'execute') {
              await this.commitChanges(result);
            } else {
              await this.logDryRun(result);
            }

            await this.updateProgress(run.id, assoc.id);
          } catch (err) {
            await this.logError(run.id, assoc.id, err);
          }
        }

        offset += associations.length;
      }

      // 4. Generate report
      const report = await this.generateReport(run.id);

      // 5. Complete run
      await this.completeRun(run.id, report);

      return { success: true, runId: run.id, report };

    } catch (error) {
      await this.failRun(run.id, error);
      throw error;
    }
  }

  private async processAssociation(
    assoc: Association,
    taxonomy: TaxonomyMap
  ): Promise<TagExtractionResult> {
    // Extract from JSON fields based on source
    const rawTags = this.extractTags(assoc);

    // Normalize: lowercase + apply aliases
    const normalizedTags = rawTags
      .map(t => t.toLowerCase().trim())
      .map(t => taxonomy[t] || t)  // Apply alias mapping
      .filter(t => t.length > 0);

    // Deduplicate
    const uniqueTags = [...new Set(normalizedTags)];

    // Check which tags exist
    const existingTags = await this.findExistingTags(uniqueTags);
    const newTags = uniqueTags.filter(t => !existingTags.has(t));

    // Check which links exist
    const existingLinks = await this.findExistingLinks(assoc.id);
    const newLinks = existingTags
      .filter(t => !existingLinks.has(t.id))
      .map(t => ({ tagId: t.id, tagName: t.name }));

    return {
      associationId: assoc.id,
      extractedTags: rawTags,
      normalizedTags: uniqueTags,
      newTags,
      newLinks,
      existingLinks: Array.from(existingLinks)
    };
  }

  private extractTags(assoc: Association): string[] {
    const tags: string[] = [];

    // Extract based on source parameter
    const source = this.options.source;

    if (source === 'db:baseline' || source === 'db:types') {
      if (Array.isArray(assoc.types)) {
        tags.push(...assoc.types);
      }
    }

    if (source === 'db:baseline' || source === 'db:activities') {
      if (Array.isArray(assoc.activities)) {
        tags.push(...assoc.activities);
      }
    }

    if (source === 'db:baseline' || source === 'db:categories') {
      if (Array.isArray(assoc.categories)) {
        tags.push(...assoc.categories);
      }
    }

    return tags;
  }

  private async commitChanges(result: TagExtractionResult): Promise<void> {
    // Upsert new tags
    for (const tagName of result.newTags) {
      const tagId = await this.upsertTag(tagName);

      // Create TagSource record
      await this.createTagSource(tagId, this.options.source);
    }

    // Create new links (INSERT IGNORE for idempotency)
    for (const link of result.newLinks) {
      await this.createTagLink(result.associationId, link.tagId);
    }
  }

  private async generateReport(runId: string): Promise<string> {
    // Query statistics from database
    const stats = await this.getRunStatistics(runId);

    // Generate CSV report
    const csvPath = `reports/tag_generation_${runId}.csv`;
    await this.writeCsvReport(csvPath, stats);

    return csvPath;
  }
}

// CLI entry point
async function main() {
  const args = parseArgs(process.argv);

  const options: TagGenerationOptions = {
    mode: args.mode || 'dry-run',
    source: args.source || 'db:baseline',
    jobId: args.jobId || generateId(),
    resume: args.resume || false,
    lastProcessedId: args.lastProcessedId
  };

  const generator = new TagGenerator(options);
  const result = await generator.execute();

  // Output JSON for PHP to parse
  console.log(JSON.stringify(result));

  process.exit(0);
}

main().catch(err => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
```

### 4.2 Taxonomy Loading

```typescript
interface TaxonomyMap {
  [alias: string]: string;  // alias → canonical
}

async function loadTaxonomy(db: PrismaClient): Promise<TaxonomyMap> {
  const aliases = await db.tagAlias.findMany();

  const map: TaxonomyMap = {};
  for (const alias of aliases) {
    map[alias.alias.toLowerCase()] = alias.canonical.toLowerCase();
  }

  return map;
}
```

### 4.3 Idempotent Tag Creation

```typescript
async function upsertTag(db: PrismaClient, name: string): Promise<string> {
  // Try to find existing
  const existing = await db.tag.findUnique({ where: { name } });
  if (existing) {
    return existing.id;
  }

  // Create new
  const tag = await db.tag.create({
    data: {
      id: generateId(),
      name,
      color: generateRandomColor() // or default
    }
  });

  return tag.id;
}

async function createTagSource(
  db: PrismaClient,
  tagId: string,
  source: string,
  sourceField?: string
): Promise<void> {
  // Only create if doesn't exist (idempotent)
  const existing = await db.tagSource.findFirst({
    where: { tagId, source, sourceField }
  });

  if (!existing) {
    await db.tagSource.create({
      data: {
        id: generateId(),
        tagId,
        source,
        sourceField
      }
    });
  }
}
```

### 4.4 Idempotent Link Creation

```typescript
async function createTagLink(
  db: PrismaClient,
  associationId: string,
  tagId: string
): Promise<boolean> {
  // Use INSERT IGNORE pattern via raw SQL
  const result = await db.$executeRaw`
    INSERT IGNORE INTO _AssociationTags (A, B)
    VALUES (${associationId}, ${tagId})
  `;

  return result > 0;  // true if new link created
}
```

### 4.5 CSV Report Format

```csv
AssociationID,AssociationName,Municipality,TagsAdded,TagsAlreadyLinked,TagsCreated,Source
cm3x1y2z3...,Sollentuna Fotbollsklubb,Sollentuna,"fotboll,sport,träning","idrottsklubb","sport,träning",db:baseline
cm3x1y2z4...,Järfälla Kulturförening,Järfälla,"kultur,musik","teater","musik",db:baseline
...
```

**Metadata section (at end):**
```csv

=== SUMMARY ===
Total Associations Processed,1250
New Tags Created,347
New Links Created,4532
Links Already Existed,2103
Execution Time (seconds),45.3
Mode,execute
Source,db:baseline
Triggered By,admin@example.com
Started At,2025-11-11T14:30:00Z
Completed At,2025-11-11T14:30:45Z
```

### 4.6 Batch File Wrapper (Enhanced)

**File:** `scripts/populate_tags_v2.bat`

```batch
@echo off
REM ============================================================================
REM Populate Tags v2 - With Backup and Reporting
REM ============================================================================

echo.
echo ===============================================================================
echo POPULATE TAGS V2 - Enhanced Tag Generation
echo ===============================================================================
echo.
echo This script will:
echo 1. Create a full database backup
echo 2. Generate tags from association data
echo 3. Create audit trail and CSV report
echo.
echo Mode: %1 (dry-run or execute)
echo Source: %2 (db:baseline, db:types, db:activities, db:categories)
echo.

set MODE=%1
if "%MODE%"=="" set MODE=dry-run

set SOURCE=%2
if "%SOURCE%"=="" set SOURCE=db:baseline

echo Mode: %MODE%
echo Source: %SOURCE%
echo.

if "%MODE%"=="execute" (
  echo WARNING: This will modify the database!
  echo.
  pause

  echo.
  echo [1/4] Creating database backup...
  call scripts\dbbackup_full.bat
  if errorlevel 1 (
    echo ERROR: Backup failed! Aborting.
    pause
    exit /b 1
  )
  echo Backup completed successfully.
  echo.
)

echo.
echo [2/4] Running tag generation...
cd /d "%~dp0.."
npx tsx scripts/populate_tags_v2.ts --mode=%MODE% --source=%SOURCE%

if errorlevel 1 (
  echo.
  echo ERROR: Tag generation failed!
  pause
  exit /b 1
)

echo.
echo [3/4] Tag generation completed.
echo.

if "%MODE%"=="execute" (
  echo [4/4] Report saved to: reports/tag_generation_*.csv
) else (
  echo [4/4] Dry-run report saved. Review and run with --mode=execute to apply.
)

echo.
echo ===============================================================================
echo COMPLETED SUCCESSFULLY
echo ===============================================================================
echo.
pause
```

---

## 5. API Endpoints

### 5.1 Tag Generation API

**File:** `api/tag_generation.php`

```php
<?php
/**
 * Tag Generation API
 *
 * POST /api/tag_generation.php
 *   - Trigger tag generation job
 *   - Body: { mode: "dry-run" | "execute", source: "db:baseline" }
 *
 * GET /api/tag_generation.php?jobId=xxx
 *   - Get status of running job
 *
 * GET /api/tag_generation.php?action=reports
 *   - List all generation runs
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// All operations require admin role
require_auth();
ensure_role('ADMIN');

if ($method === 'GET') {
  $action = $_GET['action'] ?? 'status';

  if ($action === 'reports') {
    handle_list_reports();
  } else if (isset($_GET['jobId'])) {
    handle_get_status($_GET['jobId']);
  } else {
    json_out(400, ['error' => 'Missing jobId or action parameter']);
  }
}

if ($method === 'POST') {
  require_csrf();
  rate_limit('tag-generation', 5, 3600); // Max 5 runs per hour

  $body = read_json();
  handle_trigger_generation($body);
}

json_out(405, ['error' => 'Method not allowed']);

// === Handlers ===

function handle_trigger_generation(array $body): void {
  $mode = $body['mode'] ?? 'dry-run';
  $source = $body['source'] ?? 'db:baseline';

  if (!in_array($mode, ['dry-run', 'execute'])) {
    json_out(400, ['error' => 'Invalid mode']);
  }

  if (!in_array($source, ['db:baseline', 'db:types', 'db:activities', 'db:categories'])) {
    json_out(400, ['error' => 'Invalid source']);
  }

  // Create job record
  $jobId = generate_id();
  $user = get_current_user();

  $stmt = db()->prepare('
    INSERT INTO TagGenerationRun
    (id, status, mode, source, startedAt, triggeredBy, triggeredByName)
    VALUES (?, "running", ?, ?, NOW(), ?, ?)
  ');
  $stmt->bind_param('sssss', $jobId, $mode, $source, $user['id'], $user['name']);
  $stmt->execute();

  // Build command
  $scriptPath = __DIR__ . '/../scripts/populate_tags_v2.ts';
  $cmd = sprintf(
    'npx tsx %s --mode=%s --source=%s --job-id=%s > /dev/null 2>&1 &',
    escapeshellarg($scriptPath),
    escapeshellarg($mode),
    escapeshellarg($source),
    escapeshellarg($jobId)
  );

  // Execute in background
  if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    pclose(popen("start /B " . $cmd, "r"));
  } else {
    exec($cmd);
  }

  log_event('api', 'tag-generation.triggered', [
    'jobId' => $jobId,
    'mode' => $mode,
    'source' => $source
  ]);

  json_out(200, [
    'jobId' => $jobId,
    'status' => 'running',
    'message' => 'Tag generation started'
  ]);
}

function handle_get_status(string $jobId): void {
  $stmt = db()->prepare('
    SELECT
      id, status, mode, source, startedAt, completedAt,
      associationsProcessed, tagsCreated, linksCreated, linksSkipped,
      reportPath, reportUrl, summary, errors
    FROM TagGenerationRun
    WHERE id = ?
  ');
  $stmt->bind_param('s', $jobId);
  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result->fetch_assoc();

  if (!$row) {
    json_out(404, ['error' => 'Job not found']);
  }

  // Parse JSON fields
  $row['summary'] = $row['summary'] ? json_decode($row['summary'], true) : null;
  $row['errors'] = $row['errors'] ? json_decode($row['errors'], true) : [];

  json_out(200, $row);
}

function handle_list_reports(): void {
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

  $stmt = db()->prepare('
    SELECT
      id, status, mode, source, startedAt, completedAt,
      associationsProcessed, tagsCreated, linksCreated,
      triggeredByName, reportUrl
    FROM TagGenerationRun
    ORDER BY startedAt DESC
    LIMIT ? OFFSET ?
  ');
  $stmt->bind_param('ii', $limit, $offset);
  $stmt->execute();
  $result = $stmt->get_result();

  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }

  json_out(200, ['items' => $items]);
}
```

### 5.2 Taxonomy Management API

**File:** `api/tag_taxonomy.php`

```php
<?php
/**
 * Tag Taxonomy API
 *
 * GET /api/tag_taxonomy.php
 *   - List all aliases
 *
 * POST /api/tag_taxonomy.php
 *   - Create alias: { alias, canonical, category? }
 *
 * DELETE /api/tag_taxonomy.php?id=xxx
 *   - Delete alias
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

require_auth();
ensure_role('ADMIN'); // Only admins can manage taxonomy

if ($method === 'GET') {
  handle_list_aliases();
}

if ($method === 'POST') {
  require_csrf();
  $body = read_json();
  handle_create_alias($body);
}

if ($method === 'DELETE') {
  require_csrf();
  $id = $_GET['id'] ?? '';
  handle_delete_alias($id);
}

json_out(405, ['error' => 'Method not allowed']);

// === Handlers ===

function handle_list_aliases(): void {
  $category = $_GET['category'] ?? null;

  $sql = 'SELECT id, alias, canonical, category, createdAt FROM TagAlias';
  $params = [];
  $types = '';

  if ($category) {
    $sql .= ' WHERE category = ?';
    $params[] = $category;
    $types = 's';
  }

  $sql .= ' ORDER BY canonical, alias';

  $stmt = db()->prepare($sql);
  if ($category) {
    $stmt->bind_param($types, ...$params);
  }
  $stmt->execute();
  $result = $stmt->get_result();

  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }

  json_out(200, ['items' => $items]);
}

function handle_create_alias(array $body): void {
  $alias = trim($body['alias'] ?? '');
  $canonical = trim($body['canonical'] ?? '');
  $category = isset($body['category']) ? trim($body['category']) : null;

  if ($alias === '' || $canonical === '') {
    json_out(400, ['error' => 'Alias and canonical are required']);
  }

  // Normalize to lowercase
  $alias = strtolower($alias);
  $canonical = strtolower($canonical);

  // Check if alias already exists
  $stmt = db()->prepare('SELECT id FROM TagAlias WHERE alias = ?');
  $stmt->bind_param('s', $alias);
  $stmt->execute();
  if ($stmt->get_result()->num_rows > 0) {
    json_out(400, ['error' => 'Alias already exists']);
  }

  $id = generate_id();
  $userId = get_current_user()['id'];

  $stmt = db()->prepare('
    INSERT INTO TagAlias (id, alias, canonical, category, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  ');
  $stmt->bind_param('sssss', $id, $alias, $canonical, $category, $userId);
  $stmt->execute();

  log_event('api', 'tag-taxonomy.created', ['id' => $id, 'alias' => $alias]);

  json_out(200, ['id' => $id]);
}

function handle_delete_alias(string $id): void {
  if ($id === '') {
    json_out(400, ['error' => 'ID is required']);
  }

  $stmt = db()->prepare('DELETE FROM TagAlias WHERE id = ?');
  $stmt->bind_param('s', $id);
  $stmt->execute();

  log_event('api', 'tag-taxonomy.deleted', ['id' => $id]);

  json_out(200, ['success' => true]);
}
```

---

## 6. Frontend UI Components

### 6.1 Page Structure

**File:** `crm-app/app/tags/page.tsx`

```typescript
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/layout/app-layout"
import { TagOverviewTab } from "@/components/tags/tag-overview-tab"
import { TagGenerationTab } from "@/components/tags/tag-generation-tab"
import { TagTaxonomyTab } from "@/components/tags/tag-taxonomy-tab"
import { TagReportsTab } from "@/components/tags/tag-reports-tab"

export default function TagsPage() {
  return (
    <AppLayout
      title="Tagghantering"
      description="Hantera taggar, generera nya och konfigurera taxonomi"
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="generate">Generera nya taggar</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomi</TabsTrigger>
          <TabsTrigger value="reports">Rapporter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TagOverviewTab />
        </TabsContent>

        <TabsContent value="generate">
          <TagGenerationTab />
        </TabsContent>

        <TabsContent value="taxonomy">
          <TagTaxonomyTab />
        </TabsContent>

        <TabsContent value="reports">
          <TagReportsTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
```

### 6.2 Tag Generation Tab

**File:** `crm-app/components/tags/tag-generation-tab.tsx`

```typescript
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Download, Play } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function TagGenerationTab() {
  const [mode, setMode] = useState<'dry-run' | 'execute'>('dry-run')
  const [source, setSource] = useState<string>('db:baseline')
  const [isRunning, setIsRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      setIsRunning(true)

      const result = await api.triggerTagGeneration({ mode, source })
      setJobId(result.jobId)

      toast({
        title: "Taggenerering startad",
        description: `Jobb-ID: ${result.jobId}`
      })

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusData = await api.getTagGenerationStatus(result.jobId)
          setStatus(statusData)

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(pollInterval)
            setIsRunning(false)

            if (statusData.status === 'completed') {
              toast({
                title: "Taggenerering klar",
                description: `${statusData.tagsCreated} nya taggar, ${statusData.linksCreated} nya länkar`
              })
            } else {
              toast({
                title: "Taggenerering misslyckades",
                variant: "destructive"
              })
            }
          }
        } catch (err) {
          clearInterval(pollInterval)
          setIsRunning(false)
        }
      }, 2000)

    } catch (error) {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte starta taggenerering",
        variant: "destructive"
      })
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generera baslinje-taggar</CardTitle>
          <CardDescription>
            Skapa taggar automatiskt från föreningsdata (types, activities, categories)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Läge</label>
              <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry-run">Dry-run (förhandsgranska)</SelectItem>
                  <SelectItem value="execute">Verkställ ändringar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Källa</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="db:baseline">Baslinje (alla fält)</SelectItem>
                  <SelectItem value="db:types">Endast Types</SelectItem>
                  <SelectItem value="db:activities">Endast Activities</SelectItem>
                  <SelectItem value="db:categories">Endast Categories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'execute' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Detta kommer att:
                <ul className="list-disc list-inside mt-2">
                  <li>Ta en fullständig backup av databasen</li>
                  <li>Skapa nya taggar från föreningsdata</li>
                  <li>Länka taggar till föreningar (idempotent)</li>
                  <li>Generera en CSV-rapport</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isRunning}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Kör..." : mode === 'dry-run' ? "Förhandsgranska" : "Generera taggar"}
          </Button>
        </CardContent>
      </Card>

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="font-medium">
                  {status.status === 'completed' && <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />}
                  {status.status}
                </span>
              </div>

              {status.status === 'running' && (
                <Progress value={(status.associationsProcessed / 1500) * 100} />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Föreningar processade</div>
                  <div className="text-2xl font-bold">{status.associationsProcessed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nya taggar</div>
                  <div className="text-2xl font-bold">{status.tagsCreated}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nya länkar</div>
                  <div className="text-2xl font-bold">{status.linksCreated}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Redan länkade</div>
                  <div className="text-2xl font-bold">{status.linksSkipped}</div>
                </div>
              </div>
            </div>

            {status.reportUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a href={status.reportUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  Ladda ner rapport (CSV)
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 6.3 Taxonomy Management Tab

**File:** `crm-app/components/tags/tag-taxonomy-tab.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function TagTaxonomyTab() {
  const [aliases, setAliases] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [newAlias, setNewAlias] = useState("")
  const [newCanonical, setNewCanonical] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadAliases()
  }, [])

  const loadAliases = async () => {
    try {
      const data = await api.listTagAliases()
      setAliases(data.items)
    } catch (err) {
      toast({
        title: "Fel",
        description: "Kunde inte ladda alias",
        variant: "destructive"
      })
    }
  }

  const handleCreate = async () => {
    try {
      await api.createTagAlias({
        alias: newAlias,
        canonical: newCanonical,
        category: newCategory || null
      })

      toast({
        title: "Alias skapat",
        description: `${newAlias} → ${newCanonical}`
      })

      setNewAlias("")
      setNewCanonical("")
      setNewCategory("")
      setIsOpen(false)
      loadAliases()
    } catch (err) {
      toast({
        title: "Fel",
        description: err instanceof Error ? err.message : "Kunde inte skapa alias",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta alias?")) return

    try {
      await api.deleteTagAlias(id)
      toast({ title: "Alias borttaget" })
      loadAliases()
    } catch (err) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort alias",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxonomi-alias</CardTitle>
        <CardDescription>
          Definiera alias som automatiskt mappar till kanoniska taggnamn
        </CardDescription>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nytt alias
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa nytt alias</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alias (variant)</label>
                <Input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  placeholder="matcher"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kanoniskt namn</label>
                <Input
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                  placeholder="match"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kategori (valfritt)</label>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="sport"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Skapa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Kanoniskt namn</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aliases.map((alias) => (
              <TableRow key={alias.id}>
                <TableCell className="font-mono">{alias.alias}</TableCell>
                <TableCell className="font-medium">{alias.canonical}</TableCell>
                <TableCell>{alias.category || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(alias.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

### 6.4 API Client Extensions

**File:** `crm-app/lib/api.ts` (additions)

```typescript
// Add to existing api.ts

export interface TagGenerationJob {
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'dry-run';
  mode: 'dry-run' | 'execute';
  source: string;
  associationsProcessed: number;
  tagsCreated: number;
  linksCreated: number;
  linksSkipped: number;
  reportUrl?: string;
  errors?: any[];
}

export interface TagAlias {
  id: string;
  alias: string;
  canonical: string;
  category?: string;
  createdAt: string;
}

class ApiClient {
  // ... existing methods ...

  async triggerTagGeneration(params: {
    mode: 'dry-run' | 'execute';
    source: string;
  }): Promise<{ jobId: string; status: string }> {
    return jsonFetch('/api/tag_generation.php', {
      method: 'POST',
      body: params
    }, true);
  }

  async getTagGenerationStatus(jobId: string): Promise<TagGenerationJob> {
    return jsonFetch(`/api/tag_generation.php?jobId=${jobId}`, {
      method: 'GET'
    });
  }

  async listTagGenerationReports(): Promise<{ items: TagGenerationJob[] }> {
    return jsonFetch('/api/tag_generation.php?action=reports', {
      method: 'GET'
    });
  }

  async listTagAliases(category?: string): Promise<{ items: TagAlias[] }> {
    const url = category
      ? `/api/tag_taxonomy.php?category=${encodeURIComponent(category)}`
      : '/api/tag_taxonomy.php';
    return jsonFetch(url, { method: 'GET' });
  }

  async createTagAlias(params: {
    alias: string;
    canonical: string;
    category?: string | null;
  }): Promise<{ id: string }> {
    return jsonFetch('/api/tag_taxonomy.php', {
      method: 'POST',
      body: params
    }, true);
  }

  async deleteTagAlias(id: string): Promise<{ success: boolean }> {
    return jsonFetch(`/api/tag_taxonomy.php?id=${id}`, {
      method: 'DELETE'
    }, true);
  }
}
```

---

## 7. Taxonomy Management

### 7.1 Initial Seed Data

Common Swedish association terminology aliases to include in migration:

```typescript
const INITIAL_ALIASES = [
  // Sport variations
  { alias: 'matcher', canonical: 'match', category: 'sport' },
  { alias: 'fotbollsmatch', canonical: 'match', category: 'sport' },
  { alias: 'fotbollsmatcher', canonical: 'match', category: 'sport' },
  { alias: 'tävling', canonical: 'tavling', category: 'sport' },
  { alias: 'tävlingar', canonical: 'tavling', category: 'sport' },
  { alias: 'träningspass', canonical: 'traning', category: 'sport' },
  { alias: 'träna', canonical: 'traning', category: 'sport' },

  // Culture variations
  { alias: 'konsert', canonical: 'musik', category: 'kultur' },
  { alias: 'konserter', canonical: 'musik', category: 'kultur' },
  { alias: 'musikevenemang', canonical: 'musik', category: 'kultur' },
  { alias: 'föreställning', canonical: 'teater', category: 'kultur' },
  { alias: 'föreställningar', canonical: 'teater', category: 'kultur' },
  { alias: 'teaterpjäs', canonical: 'teater', category: 'kultur' },

  // Organization types
  { alias: 'idrottsklubb', canonical: 'idrott', category: 'typ' },
  { alias: 'idrottsförening', canonical: 'idrott', category: 'typ' },
  { alias: 'kulturförening', canonical: 'kultur', category: 'typ' },
  { alias: 'kultursällskap', canonical: 'kultur', category: 'typ' },

  // Activities
  { alias: 'möte', canonical: 'mote', category: 'aktivitet' },
  { alias: 'möten', canonical: 'mote', category: 'aktivitet' },
  { alias: 'samling', canonical: 'mote', category: 'aktivitet' },
  { alias: 'samlingar', canonical: 'mote', category: 'aktivitet' },
];
```

### 7.2 Taxonomy Expansion Strategy

**Phase 1 (MVP):** Manual curation via UI
- Admin adds aliases as they discover duplicates
- Report shows "suggested aliases" based on similarity analysis

**Phase 2 (Future):** AI-powered suggestions
- Analyze existing tag distribution
- Suggest merges for similar tags (Levenshtein distance < 3)
- User approves/rejects suggestions

**Phase 3 (Advanced):** Semantic grouping
- Use embeddings to find conceptually similar tags
- Auto-categorize tags into hierarchies

---

## 8. Reporting & Audit Trail

### 8.1 Report Storage

**Location:** `reports/tag_generation/`

**Naming:** `tag_generation_{JOB_ID}_{TIMESTAMP}.csv`

**Retention:** Keep last 90 days, archive older reports

### 8.2 Report Content Structure

```csv
=== TAG GENERATION REPORT ===
Job ID: cm3x1y2z3abc
Mode: execute
Source: db:baseline
Started: 2025-11-11T14:30:00Z
Completed: 2025-11-11T14:30:45Z
Triggered By: admin@example.com

=== STATISTICS ===
Total Associations Processed: 1250
New Tags Created: 347
New Links Created: 4532
Links Already Existed: 2103
Errors: 0

=== DETAILED RESULTS ===
AssociationID,AssociationName,Municipality,TagsAdded,TagsAlreadyLinked,TagsCreated,Source
cm3x1y2z3...,Sollentuna Fotbollsklubb,Sollentuna,"fotboll;sport;träning","idrottsklubb","sport;träning",db:baseline
...

=== NEW TAGS CREATED ===
TagID,TagName,Source,Count
cm4a1b2c3...,padel,db:baseline,23
cm4a1b2c4...,esport,db:baseline,17
...

=== ERRORS (IF ANY) ===
AssociationID,Error,Timestamp
cm3x1y2z5...,Failed to parse activities JSON,2025-11-11T14:32:15Z
```

### 8.3 Web UI Report Viewer

Display reports in table format with:
- Filter by date range
- Search by job ID
- Download CSV
- View summary statistics
- Link to affected associations

---

## 9. Error Handling & Recovery

### 9.1 Error Categories

1. **Database connection errors**
   - Retry with exponential backoff (3 attempts)
   - Log to TagGenerationRun.errors
   - Mark job as "failed"

2. **Data parsing errors**
   - Skip association, log error
   - Continue processing
   - Include in error report

3. **Constraint violations**
   - Handle duplicate key errors gracefully (INSERT IGNORE)
   - Log as warning, not error

4. **Script crashes**
   - Job remains in "running" state
   - Manual resume via --resume flag + --last-processed-id

### 9.2 Resume Mechanism

```bash
# If script crashes at association ID "cm3x1y2z3abc"
npx tsx scripts/populate_tags_v2.ts \
  --mode=execute \
  --source=db:baseline \
  --job-id=ORIGINAL_JOB_ID \
  --resume \
  --last-processed-id=cm3x1y2z3abc
```

Script logic:
```typescript
if (options.resume && options.lastProcessedId) {
  // Find offset where this ID appears
  const offset = await getOffsetForId(options.lastProcessedId);
  console.log(`Resuming from offset ${offset}`);
  startOffset = offset + 1; // Skip already processed
}
```

### 9.3 Rollback Strategy

**For dry-run:** No rollback needed (read-only)

**For execute mode:**
1. Restore from backup created before run:
   ```bash
   mysql -h mysql513.loopia.se -u walla3jk@m383902 -p \
     medlemsregistret_se_db_4 < .dbbackup/MCRM_medlemsregistret_se_db_4_YYYY-MM-DD_HH-mm.sql
   ```

2. Or manual cleanup:
   ```sql
   -- Delete tags created in this run
   DELETE FROM Tag WHERE id IN (
     SELECT DISTINCT tagId FROM TagSource WHERE source = 'db:baseline' AND createdAt > 'RUN_START_TIME'
   );

   -- Delete links created in this run (harder, requires audit log)
   -- Recommendation: Restore from backup instead
   ```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**File:** `scripts/__tests__/populate_tags_v2.test.ts`

```typescript
describe('TagGenerator', () => {
  describe('extractTags', () => {
    it('should extract from types, activities, categories', () => {
      const assoc = {
        types: ['Idrottsklubb', 'Fotboll'],
        activities: ['Träning'],
        categories: ['Sport']
      };
      const result = extractTags(assoc, 'db:baseline');
      expect(result).toEqual(['Idrottsklubb', 'Fotboll', 'Träning', 'Sport']);
    });

    it('should only extract from specified source', () => {
      const assoc = {
        types: ['Idrottsklubb'],
        activities: ['Träning'],
        categories: ['Sport']
      };
      const result = extractTags(assoc, 'db:types');
      expect(result).toEqual(['Idrottsklubb']);
    });
  });

  describe('normalizeTags', () => {
    it('should lowercase and deduplicate', () => {
      const tags = ['Fotboll', 'FOTBOLL', 'fotboll'];
      const result = normalizeTags(tags, {});
      expect(result).toEqual(['fotboll']);
    });

    it('should apply taxonomy aliases', () => {
      const tags = ['matcher', 'Träning'];
      const taxonomy = { 'matcher': 'match' };
      const result = normalizeTags(tags, taxonomy);
      expect(result).toEqual(['match', 'träning']);
    });
  });

  describe('idempotency', () => {
    it('should not create duplicate tags', async () => {
      await upsertTag('fotboll');
      const count1 = await countTags();
      await upsertTag('fotboll');
      const count2 = await countTags();
      expect(count1).toBe(count2);
    });

    it('should not create duplicate links', async () => {
      await createTagLink('assoc1', 'tag1');
      const count1 = await countLinks('assoc1');
      await createTagLink('assoc1', 'tag1');
      const count2 = await countLinks('assoc1');
      expect(count1).toBe(count2);
    });
  });
});
```

### 10.2 Integration Tests

**File:** `web/tests/tag-generation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Tag Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to tags page', async ({ page }) => {
    await page.click('a[href="/tags"]');
    await expect(page).toHaveURL('/tags');
    await expect(page.locator('h1')).toContainText('Tagghantering');
  });

  test('should show generation tab', async ({ page }) => {
    await page.goto('/tags');
    await page.click('[data-value="generate"]');
    await expect(page.locator('text=Generera baslinje-taggar')).toBeVisible();
  });

  test('should run dry-run generation', async ({ page }) => {
    await page.goto('/tags');
    await page.click('[data-value="generate"]');

    // Select dry-run mode
    await page.click('[data-testid="mode-select"]');
    await page.click('text=Dry-run');

    // Trigger generation
    await page.click('button:has-text("Förhandsgranska")');

    // Wait for completion
    await expect(page.locator('text=completed')).toBeVisible({ timeout: 60000 });

    // Check statistics
    await expect(page.locator('[data-testid="tags-created"]')).not.toHaveText('0');
  });

  test('should create taxonomy alias', async ({ page }) => {
    await page.goto('/tags');
    await page.click('[data-value="taxonomy"]');
    await page.click('button:has-text("Nytt alias")');

    await page.fill('[placeholder="matcher"]', 'testmatch');
    await page.fill('[placeholder="match"]', 'test');
    await page.fill('[placeholder="sport"]', 'test-category');

    await page.click('button:has-text("Skapa")');

    await expect(page.locator('text=testmatch')).toBeVisible();
  });
});
```

### 10.3 Manual Testing Checklist

- [ ] Run dry-run on Loopia database
- [ ] Verify CSV report is generated
- [ ] Check no data is modified in dry-run mode
- [ ] Run execute mode with backup
- [ ] Verify tags are created
- [ ] Verify links are created
- [ ] Run execute mode again (test idempotency)
- [ ] Verify no duplicate tags/links created
- [ ] Test resume mechanism after simulated crash
- [ ] Verify error handling for malformed JSON
- [ ] Test with empty association fields
- [ ] Test taxonomy alias application
- [ ] Verify provenance tracking (TagSource records)
- [ ] Test UI: all tabs load correctly
- [ ] Test UI: generation progress updates
- [ ] Test UI: report download works
- [ ] Test UI: alias CRUD operations

---

## 11. Deployment Plan

### 11.1 Phase 1: Database Migration (Week 1)

**Tasks:**
1. Review and test migration SQL locally
2. Create backup of Loopia database
3. Run migration on Loopia:
   ```bash
   mysql -h mysql513.loopia.se -u walla3jk@m383902 -p \
     medlemsregistret_se_db_4 < migrations/add_tag_management_v2.sql
   ```
4. Verify tables created correctly
5. Seed initial taxonomy aliases

**Rollback:** Drop new tables if migration fails

### 11.2 Phase 2: Backend API (Week 1-2)

**Tasks:**
1. Implement `api/tag_generation.php`
2. Implement `api/tag_taxonomy.php`
3. Test endpoints via Postman/curl
4. Deploy to production server
5. Update API documentation

**Testing:**
- Unit test each endpoint handler
- Integration test with Loopia database
- Load test with 1000+ associations

### 11.3 Phase 3: Script Implementation (Week 2)

**Tasks:**
1. Implement `scripts/populate_tags_v2.ts`
2. Implement taxonomy loading
3. Implement idempotent upsert logic
4. Implement CSV report generation
5. Create batch wrapper `scripts/populate_tags_v2.bat`
6. Test locally with test database
7. Test on Loopia database (dry-run only)

**Testing:**
- Unit tests for all functions
- Integration test with real data
- Dry-run on production
- Full run on staging

### 11.4 Phase 4: Frontend UI (Week 3)

**Tasks:**
1. Create `/tags` page structure
2. Implement TagGenerationTab component
3. Implement TagTaxonomyTab component
4. Implement TagReportsTab component
5. Add API client methods
6. Test UI interactions
7. Deploy to production

**Testing:**
- Component unit tests
- E2E tests via Playwright
- Manual QA on all features

### 11.5 Phase 5: Production Run (Week 4)

**Tasks:**
1. Create full database backup
2. Run dry-run on production
3. Review dry-run report with stakeholders
4. Run execute mode on production
5. Verify results
6. Document process
7. Train users

**Monitoring:**
- Watch for errors in logs
- Monitor database size (expect ~10% increase)
- Check report accuracy
- Gather user feedback

---

## 12. Implementation Task List

### 12.1 Database Tasks

- [ ] **DB-1:** Write migration SQL for TagSource table
- [ ] **DB-2:** Write migration SQL for TagAlias table
- [ ] **DB-3:** Write migration SQL for TagGenerationRun table
- [ ] **DB-4:** Create seed data for initial aliases
- [ ] **DB-5:** Test migration on local database
- [ ] **DB-6:** Create backup script integration test
- [ ] **DB-7:** Run migration on Loopia (staging)
- [ ] **DB-8:** Verify tables and indexes created
- [ ] **DB-9:** Run migration on Loopia (production)
- [ ] **DB-10:** Document rollback procedure

### 12.2 Backend API Tasks

- [ ] **API-1:** Implement `tag_generation.php` - POST trigger handler
- [ ] **API-2:** Implement `tag_generation.php` - GET status handler
- [ ] **API-3:** Implement `tag_generation.php` - GET reports handler
- [ ] **API-4:** Implement background job execution (Windows/Linux)
- [ ] **API-5:** Implement `tag_taxonomy.php` - GET list handler
- [ ] **API-6:** Implement `tag_taxonomy.php` - POST create handler
- [ ] **API-7:** Implement `tag_taxonomy.php` - DELETE handler
- [ ] **API-8:** Add admin role checks to all endpoints
- [ ] **API-9:** Add CSRF protection
- [ ] **API-10:** Add rate limiting
- [ ] **API-11:** Test endpoints with Postman
- [ ] **API-12:** Write PHP unit tests
- [ ] **API-13:** Document API contracts in `docs/api_contract.md`

### 12.3 Script Tasks

- [ ] **SCRIPT-1:** Create `scripts/populate_tags_v2.ts` skeleton
- [ ] **SCRIPT-2:** Implement CLI argument parsing
- [ ] **SCRIPT-3:** Implement database connection (Loopia)
- [ ] **SCRIPT-4:** Implement taxonomy loading function
- [ ] **SCRIPT-5:** Implement tag extraction logic
- [ ] **SCRIPT-6:** Implement normalization (lowercase + aliases)
- [ ] **SCRIPT-7:** Implement deduplication
- [ ] **SCRIPT-8:** Implement idempotent tag upsert
- [ ] **SCRIPT-9:** Implement idempotent link creation
- [ ] **SCRIPT-10:** Implement TagSource record creation
- [ ] **SCRIPT-11:** Implement batch processing loop
- [ ] **SCRIPT-12:** Implement progress tracking
- [ ] **SCRIPT-13:** Implement error handling and logging
- [ ] **SCRIPT-14:** Implement resume mechanism
- [ ] **SCRIPT-15:** Implement CSV report generation
- [ ] **SCRIPT-16:** Implement TagGenerationRun record updates
- [ ] **SCRIPT-17:** Create batch wrapper `populate_tags_v2.bat`
- [ ] **SCRIPT-18:** Integrate backup call (dbbackup_full.bat)
- [ ] **SCRIPT-19:** Write unit tests for all functions
- [ ] **SCRIPT-20:** Test with local database
- [ ] **SCRIPT-21:** Test dry-run on Loopia
- [ ] **SCRIPT-22:** Test execute on Loopia (staging)
- [ ] **SCRIPT-23:** Verify idempotency (run twice)
- [ ] **SCRIPT-24:** Test resume mechanism
- [ ] **SCRIPT-25:** Document script usage in README

### 12.4 Frontend Tasks

- [ ] **FE-1:** Create `crm-app/app/tags/page.tsx` with tab structure
- [ ] **FE-2:** Implement TagOverviewTab (list all tags)
- [ ] **FE-3:** Implement TagGenerationTab skeleton
- [ ] **FE-4:** Add mode selector (dry-run/execute)
- [ ] **FE-5:** Add source selector (baseline/types/activities/categories)
- [ ] **FE-6:** Add generate button with confirmation dialog
- [ ] **FE-7:** Implement job status polling
- [ ] **FE-8:** Add progress bar and statistics display
- [ ] **FE-9:** Add CSV report download link
- [ ] **FE-10:** Implement TagTaxonomyTab skeleton
- [ ] **FE-11:** Add alias table display
- [ ] **FE-12:** Add create alias dialog
- [ ] **FE-13:** Add delete alias confirmation
- [ ] **FE-14:** Implement TagReportsTab
- [ ] **FE-15:** Add reports list with filters
- [ ] **FE-16:** Add report detail view
- [ ] **FE-17:** Update `lib/api.ts` with new methods
- [ ] **FE-18:** Add TypeScript interfaces for new types
- [ ] **FE-19:** Write component unit tests
- [ ] **FE-20:** Test all UI interactions manually
- [ ] **FE-21:** Create Playwright E2E tests
- [ ] **FE-22:** Run E2E tests and capture reports
- [ ] **FE-23:** Fix any UI bugs found
- [ ] **FE-24:** Add loading states and error handling
- [ ] **FE-25:** Add tooltips and help text

### 12.5 Testing Tasks

- [ ] **TEST-1:** Write unit tests for taxonomy loading
- [ ] **TEST-2:** Write unit tests for tag extraction
- [ ] **TEST-3:** Write unit tests for normalization
- [ ] **TEST-4:** Write unit tests for idempotency
- [ ] **TEST-5:** Write integration test for full pipeline
- [ ] **TEST-6:** Write Playwright test for navigation
- [ ] **TEST-7:** Write Playwright test for dry-run execution
- [ ] **TEST-8:** Write Playwright test for taxonomy CRUD
- [ ] **TEST-9:** Run all tests and verify 100% pass
- [ ] **TEST-10:** Generate test report per TEST_RULES.md

### 12.6 Documentation Tasks

- [ ] **DOC-1:** Update CLAUDE.md with new commands
- [ ] **DOC-2:** Update api_contract.md with new endpoints
- [ ] **DOC-3:** Create user guide for tag generation UI
- [ ] **DOC-4:** Create admin guide for taxonomy management
- [ ] **DOC-5:** Document error codes and recovery procedures
- [ ] **DOC-6:** Update SYSTEM_ARCHITECTURE.md
- [ ] **DOC-7:** Create worklog entry per WORKLOG_AI_INSTRUCTION.md

### 12.7 Deployment Tasks

- [ ] **DEPLOY-1:** Create Git feature branch `feature/tag-management-v2`
- [ ] **DEPLOY-2:** Commit database migration
- [ ] **DEPLOY-3:** Commit backend API changes
- [ ] **DEPLOY-4:** Commit script implementation
- [ ] **DEPLOY-5:** Commit frontend changes
- [ ] **DEPLOY-6:** Commit tests
- [ ] **DEPLOY-7:** Commit documentation
- [ ] **DEPLOY-8:** Create pull request to `dev`
- [ ] **DEPLOY-9:** Code review and approval
- [ ] **DEPLOY-10:** Merge to `dev`
- [ ] **DEPLOY-11:** Deploy to staging environment
- [ ] **DEPLOY-12:** Run full test suite on staging
- [ ] **DEPLOY-13:** Create backup of production database
- [ ] **DEPLOY-14:** Deploy to production
- [ ] **DEPLOY-15:** Run dry-run on production
- [ ] **DEPLOY-16:** Review dry-run report
- [ ] **DEPLOY-17:** Run execute mode on production
- [ ] **DEPLOY-18:** Verify results
- [ ] **DEPLOY-19:** Monitor for 48 hours
- [ ] **DEPLOY-20:** Document lessons learned

---

## 13. Risk Analysis

### 13.1 High-Risk Areas

1. **Database size growth**
   - Risk: Tags + links could significantly increase DB size
   - Mitigation: Monitor growth, implement tag cleanup for unused tags
   - Estimated impact: +10-15% database size

2. **Script performance**
   - Risk: Processing 1500+ associations could take 5+ minutes
   - Mitigation: Batch processing, progress tracking, resume capability
   - Estimated time: ~60 seconds for full run

3. **Data quality**
   - Risk: Malformed JSON in types/activities/categories breaks extraction
   - Mitigation: Try-catch around JSON parsing, log errors, continue processing
   - Expected error rate: <1%

4. **Taxonomy conflicts**
   - Risk: Multiple aliases for same term could cause confusion
   - Mitigation: Unique constraint on alias field, UI validation
   - Recovery: Manual cleanup via UI

### 13.2 Medium-Risk Areas

1. **UI complexity**
   - Risk: Users find tag generation interface confusing
   - Mitigation: Clear help text, confirmation dialogs, dry-run default
   - Training: Create video walkthrough

2. **Background job monitoring**
   - Risk: Long-running jobs appear stuck
   - Mitigation: Real-time progress updates, timeout after 10 minutes
   - Alert: Email admin if job fails

3. **Report storage**
   - Risk: CSV reports accumulate and fill disk
   - Mitigation: 90-day retention policy, auto-cleanup script
   - Monitoring: Disk usage alerts

### 13.3 Low-Risk Areas

1. **API rate limiting**
   - Risk: User spams generation button
   - Mitigation: Rate limit (5 runs/hour) + disable button during execution

2. **CSRF attacks**
   - Risk: Malicious site triggers tag generation
   - Mitigation: CSRF tokens on all write operations

---

## 14. Success Criteria

### 14.1 Functional Requirements

- [ ] User can trigger baseline tag generation from UI
- [ ] System creates backup before execution
- [ ] Dry-run mode shows preview without changes
- [ ] Execute mode creates tags and links idempotently
- [ ] CSV report is generated and downloadable
- [ ] Taxonomy aliases are applied during generation
- [ ] Admin can manage aliases via UI
- [ ] Job status is tracked and displayed
- [ ] Errors are logged and reported
- [ ] System can resume from crashes

### 14.2 Non-Functional Requirements

- [ ] Generation completes in <2 minutes for 1500 associations
- [ ] Idempotency: Running twice produces same result
- [ ] No data loss during errors
- [ ] All operations logged for audit
- [ ] UI responsive on desktop and tablet
- [ ] API rate limiting prevents abuse
- [ ] Documentation complete and accurate

### 14.3 Quality Metrics

- [ ] Test coverage >80%
- [ ] Zero critical bugs in production
- [ ] <1% data parsing error rate
- [ ] 100% backup success rate
- [ ] User satisfaction >4/5 in feedback

---

## 15. Future Enhancements

### 15.1 Phase 2 Features (Not in MVP)

1. **AI-powered tag generation**
   - Extract tags from association descriptions via LLM
   - Source: `ai:web`
   - Confidence scoring
   - Human review workflow

2. **Tag merging/cleanup**
   - Find similar tags (fuzzy matching)
   - Batch merge operations
   - Redirect old tag IDs to canonical

3. **Tag hierarchies**
   - Parent-child relationships
   - e.g., "fotboll" → child of "idrott"
   - Hierarchical filtering in UI

4. **Scheduled generation**
   - Cron job to run nightly
   - Process only new/updated associations
   - Email summary to admins

5. **Tag suggestions**
   - Recommend tags based on similar associations
   - Machine learning similarity model

### 15.2 Technical Debt

- Consider moving script to PHP for consistency
- Implement queue system for background jobs (vs. shell_exec)
- Add webhook support for external integrations
- Implement GraphQL API for frontend

---

## 16. Appendix

### 16.1 Glossary

- **Baslinje-taggar**: Tags generated from existing association data fields
- **Idempotent**: Operation can be repeated without changing result
- **Taxonomy**: System of canonical names and aliases
- **Provenance**: Origin/source of data
- **Dry-run**: Preview mode that doesn't modify data

### 16.2 References

- Current implementation: `legacy/crm-app/prisma/populate-tags.ts`
- Database backup: `scripts/dbbackup_full.bat`
- API bootstrap: `api/bootstrap.php`
- Test rules: `docs/TEST_RULES.md`

### 16.3 Contact

- Project Lead: [User]
- Developer: AI Assistant
- Database: Loopia MySQL (mysql513.loopia.se)

---

**End of Implementation Plan**

**Next Steps:**
1. Review this plan with stakeholders
2. Get approval for database schema changes
3. Create Git feature branch
4. Begin implementation following task list order
5. Track progress in project management tool
