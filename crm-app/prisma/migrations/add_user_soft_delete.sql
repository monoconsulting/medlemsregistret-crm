-- Add soft delete and timestamp columns to User table
ALTER TABLE `User` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `User` ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `User` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Add indexes
CREATE INDEX `User_isDeleted_idx` ON `User`(`isDeleted`);
CREATE INDEX `User_email_idx` ON `User`(`email`);
