-- ============================================================================
-- Create Tag Generation Logging Tables
-- ============================================================================
-- This script creates the logging tables needed for tag generation tracking
-- Run this on the Loopia database to enable full logging functionality
-- ============================================================================

-- Table: TagGenerationRun
-- Tracks tag generation job executions
CREATE TABLE IF NOT EXISTS `TagGenerationRun` (
  `id` VARCHAR(191) NOT NULL,
  `status` VARCHAR(50) NOT NULL COMMENT 'running, completed, failed, dry-run',
  `mode` VARCHAR(50) NOT NULL COMMENT 'dry-run, execute',
  `source` VARCHAR(100) NOT NULL COMMENT 'db:baseline, db:types, db:activities, db:categories',
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,

  -- Statistics
  `associationsProcessed` INT NOT NULL DEFAULT 0,
  `tagsCreated` INT NOT NULL DEFAULT 0,
  `linksCreated` INT NOT NULL DEFAULT 0,
  `linksSkipped` INT NOT NULL DEFAULT 0,
  `errors` JSON NULL,

  -- Resume capability
  `lastProcessedId` VARCHAR(191) NULL,
  `currentBatch` INT NOT NULL DEFAULT 0,

  -- Output artifacts
  `reportPath` VARCHAR(500) NULL,
  `reportUrl` VARCHAR(500) NULL,
  `summary` JSON NULL,

  -- Attribution
  `triggeredBy` VARCHAR(191) NULL,
  `triggeredByName` VARCHAR(255) NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_startedAt` (`startedAt`),
  INDEX `idx_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: TagGenerationLog
-- Detailed logs for each step in the tag generation process
CREATE TABLE IF NOT EXISTS `TagGenerationLog` (
  `id` VARCHAR(191) NOT NULL,
  `jobId` VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `level` VARCHAR(50) NOT NULL COMMENT 'DEBUG, INFO, WARNING, ERROR',
  `category` VARCHAR(100) NOT NULL COMMENT 'INIT, DB_READ, TAXONOMY_LOAD, ASSOCIATION_PROCESS, TAG_MATCH, TAG_CREATE, TAG_LINK, PROGRESS_UPDATE, REPORT_WRITE, ERROR, COMPLETE',
  `message` TEXT NOT NULL,
  `data` JSON NULL COMMENT 'Structured data for search/filtering',

  PRIMARY KEY (`id`),
  INDEX `idx_jobId_timestamp` (`jobId`, `timestamp`),
  INDEX `idx_level` (`level`),
  INDEX `idx_category` (`category`),
  INDEX `idx_timestamp` (`timestamp`),

  CONSTRAINT `fk_TagGenerationLog_jobId`
    FOREIGN KEY (`jobId`)
    REFERENCES `TagGenerationRun` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Run these to verify the tables were created successfully:

-- SELECT COUNT(*) as TagGenerationRun_exists FROM information_schema.tables
-- WHERE table_schema = DATABASE() AND table_name = 'TagGenerationRun';

-- SELECT COUNT(*) as TagGenerationLog_exists FROM information_schema.tables
-- WHERE table_schema = DATABASE() AND table_name = 'TagGenerationLog';

-- SHOW CREATE TABLE TagGenerationRun;
-- SHOW CREATE TABLE TagGenerationLog;
