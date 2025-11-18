-- AlterTable
ALTER TABLE `Group` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Group_isDeleted_idx` ON `Group`(`isDeleted`);

