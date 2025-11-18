-- AlterTable
-- Add soft delete column for Contact to align with contacts.php API expectations
ALTER TABLE `Contact`
  ADD COLUMN `deletedAt` DATETIME(3) NULL;
