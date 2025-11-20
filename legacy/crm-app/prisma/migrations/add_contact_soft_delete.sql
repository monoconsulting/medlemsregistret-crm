-- ============================================================================
-- Migration: Add Soft Delete to Contact Table
-- Date: 2025-11-19
-- Description: Add deletedAt column to Contact table to support soft deletes
-- ============================================================================

-- Add deletedAt column to Contact table
ALTER TABLE Contact
ADD COLUMN deletedAt DATETIME(3) NULL DEFAULT NULL
AFTER updatedAt;

-- Add index on deletedAt for performance
ALTER TABLE Contact
ADD INDEX idx_deletedAt (deletedAt);

-- ============================================================================
-- Verification queries (run after migration)
-- ============================================================================

-- Verify column was added
-- DESCRIBE Contact;

-- Check existing contacts (should all have NULL deletedAt)
-- SELECT COUNT(*) as total_contacts,
--        COUNT(deletedAt) as deleted_contacts
-- FROM Contact;

-- ============================================================================
-- Rollback SQL (if needed)
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE Contact DROP INDEX idx_deletedAt;
-- ALTER TABLE Contact DROP COLUMN deletedAt;
