-- ============================================================================
-- Migration: Add Tag Management v2 Tables
-- Date: 2025-11-11
-- Description: Add provenance tracking, taxonomy, and audit logging for tags
-- ============================================================================

-- 1. TagSource - Track tag origins and provenance
CREATE TABLE IF NOT EXISTS TagSource (
  id VARCHAR(191) PRIMARY KEY,
  tagId VARCHAR(191) NOT NULL,
  source VARCHAR(50) NOT NULL COMMENT 'db:baseline, db:types, db:activities, db:categories, ai:web, manual',
  sourceField VARCHAR(50) COMMENT 'types, activities, categories - null for manual/ai tags',
  confidence DECIMAL(3,2) COMMENT 'For AI-generated tags (0.00-1.00)',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191) COMMENT 'userId for manual tags',

  FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
  INDEX idx_tagId (tagId),
  INDEX idx_source (source),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks the origin and provenance of each tag';

-- 2. TagAlias - Taxonomy normalization mappings
CREATE TABLE IF NOT EXISTS TagAlias (
  id VARCHAR(191) PRIMARY KEY,
  alias VARCHAR(191) UNIQUE NOT NULL COMMENT 'Variant spelling or synonym',
  canonical VARCHAR(191) NOT NULL COMMENT 'Canonical tag name to map to',
  category VARCHAR(50) COMMENT 'Optional category: sport, kultur, typ, aktivitet',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  createdBy VARCHAR(191) COMMENT 'userId who created this alias',

  INDEX idx_canonical (canonical),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Maps tag aliases to canonical names for taxonomy normalization';

-- 3. TagGenerationRun - Audit log for tag generation jobs
CREATE TABLE IF NOT EXISTS TagGenerationRun (
  id VARCHAR(191) PRIMARY KEY,
  status VARCHAR(20) NOT NULL COMMENT 'running, completed, failed, dry-run',
  mode VARCHAR(20) NOT NULL COMMENT 'dry-run or execute',
  source VARCHAR(50) NOT NULL COMMENT 'db:baseline, db:types, db:activities, db:categories',
  startedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completedAt DATETIME(3),

  -- Statistics
  associationsProcessed INT NOT NULL DEFAULT 0,
  tagsCreated INT NOT NULL DEFAULT 0,
  linksCreated INT NOT NULL DEFAULT 0,
  linksSkipped INT NOT NULL DEFAULT 0 COMMENT 'Links that already existed',
  errors JSON COMMENT 'Array of error objects',

  -- Resume capability
  lastProcessedId VARCHAR(191) COMMENT 'Last association ID processed - for recovery',
  currentBatch INT NOT NULL DEFAULT 0,

  -- Output artifacts
  reportPath VARCHAR(500) COMMENT 'Local file path to CSV report',
  reportUrl VARCHAR(500) COMMENT 'Download URL for report',
  summary JSON COMMENT 'Summary statistics object',

  -- Attribution
  triggeredBy VARCHAR(191) COMMENT 'userId who triggered this run',
  triggeredByName VARCHAR(191) COMMENT 'User name for display',

  INDEX idx_status (status),
  INDEX idx_startedAt (startedAt),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log and metadata for all tag generation runs';

-- 4. Seed common Swedish aliases
INSERT INTO TagAlias (id, alias, canonical, category) VALUES
  -- Sport variations (matcher → match)
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'matcher', 'match', 'sport'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'fotbollsmatch', 'match', 'sport'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'fotbollsmatcher', 'match', 'sport'),

  -- Competition/training
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'tävling', 'tavling', 'sport'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'tävlingar', 'tavling', 'sport'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'träningspass', 'traning', 'sport'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'träna', 'traning', 'sport'),

  -- Culture variations (konsert → musik)
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'konsert', 'musik', 'kultur'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'konserter', 'musik', 'kultur'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'musikevenemang', 'musik', 'kultur'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'föreställning', 'teater', 'kultur'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'föreställningar', 'teater', 'kultur'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'teaterpjäs', 'teater', 'kultur'),

  -- Organization types
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'idrottsklubb', 'idrott', 'typ'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'idrottsförening', 'idrott', 'typ'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'kulturförening', 'kultur', 'typ'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'kultursällskap', 'kultur', 'typ'),

  -- Meeting/gathering activities
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'möte', 'mote', 'aktivitet'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'möten', 'mote', 'aktivitet'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'samling', 'mote', 'aktivitet'),
  (CONCAT('alias_', REPLACE(UUID(), '-', '')), 'samlingar', 'mote', 'aktivitet')
ON DUPLICATE KEY UPDATE alias=alias;

-- ============================================================================
-- Verification queries (run after migration)
-- ============================================================================

-- SELECT COUNT(*) as tagSource_count FROM TagSource;
-- SELECT COUNT(*) as tagAlias_count FROM TagAlias;
-- SELECT COUNT(*) as tagGenerationRun_count FROM TagGenerationRun;
-- SHOW CREATE TABLE TagSource;
-- SHOW CREATE TABLE TagAlias;
-- SHOW CREATE TABLE TagGenerationRun;
