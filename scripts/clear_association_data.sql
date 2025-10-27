-- Script to clear all association data from the CRM database
-- This will DELETE all scraped association data while preserving:
-- - Municipality reference data
-- - User accounts
-- - Tags
-- - Groups (empty groups without memberships)
-- - Database structure (tables, views, triggers)

-- Disable foreign key checks temporarily for faster deletion
SET FOREIGN_KEY_CHECKS = 0;

-- Clear all association-related data (ordered to respect foreign keys)
-- These cascades should handle most deletions, but we'll be explicit for safety

-- Clear activities related to associations
DELETE FROM Activity WHERE associationId IS NOT NULL;

-- Clear tasks related to associations
DELETE FROM Task WHERE associationId IS NOT NULL;

-- Clear notes
DELETE FROM Note;

-- Clear group memberships (associations in groups)
DELETE FROM GroupMembership;

-- Clear description sections
DELETE FROM DescriptionSection;

-- Clear contacts (has cascade delete, but being explicit)
DELETE FROM Contact;

-- Clear the join table for association tags
DELETE FROM _AssociationTags;

-- Clear main associations table
DELETE FROM Association;

-- Clear import batches (metadata about imports)
DELETE FROM ImportBatch;

-- Clear scrape runs (metadata about scraping)
DELETE FROM ScrapeRun;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show summary of remaining data
SELECT 'Associations' as TableName, COUNT(*) as RemainingRows FROM Association
UNION ALL
SELECT 'Contacts', COUNT(*) FROM Contact
UNION ALL
SELECT 'DescriptionSections', COUNT(*) FROM DescriptionSection
UNION ALL
SELECT 'Notes', COUNT(*) FROM Note
UNION ALL
SELECT 'Activities', COUNT(*) FROM Activity
UNION ALL
SELECT 'Tasks', COUNT(*) FROM Task
UNION ALL
SELECT 'GroupMemberships', COUNT(*) FROM GroupMembership
UNION ALL
SELECT 'ImportBatches', COUNT(*) FROM ImportBatch
UNION ALL
SELECT 'ScrapeRuns', COUNT(*) FROM ScrapeRun
UNION ALL
SELECT '---' as TableName, 0 as RemainingRows
UNION ALL
SELECT 'Municipalities (preserved)', COUNT(*) FROM Municipality
UNION ALL
SELECT 'Users (preserved)', COUNT(*) FROM User
UNION ALL
SELECT 'Tags (preserved)', COUNT(*) FROM Tag
UNION ALL
SELECT 'Groups (preserved)', COUNT(*) FROM `Group`;
