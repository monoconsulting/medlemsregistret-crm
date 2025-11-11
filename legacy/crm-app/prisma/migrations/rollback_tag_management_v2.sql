-- ============================================================================
-- Rollback: Remove Tag Management v2 Tables
-- Date: 2025-11-11
-- Description: Rollback script to remove tag management v2 tables
-- WARNING: This will delete all TagSource, TagAlias, and TagGenerationRun data
-- ============================================================================

-- Before running this rollback, you should:
-- 1. Create a backup of your database
-- 2. Verify you want to lose all provenance, taxonomy, and audit data
-- 3. Ensure no tag generation jobs are currently running

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS=0;

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS TagGenerationRun;
DROP TABLE IF EXISTS TagAlias;
DROP TABLE IF EXISTS TagSource;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- Verification (should return 0 tables)
-- ============================================================================

-- SELECT COUNT(*) as tables_remaining FROM information_schema.tables
-- WHERE table_schema = DATABASE()
-- AND table_name IN ('TagSource', 'TagAlias', 'TagGenerationRun');

-- ============================================================================
-- Note: This rollback does NOT affect:
-- ============================================================================
-- - Tag table (remains unchanged)
-- - _AssociationTags table (remains unchanged)
-- - Any existing tags or tag-association links
--
-- What IS lost:
-- - All tag provenance data (TagSource)
-- - All taxonomy alias mappings (TagAlias)
-- - All tag generation job history (TagGenerationRun)
