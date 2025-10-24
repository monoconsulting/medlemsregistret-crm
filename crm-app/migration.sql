-- DropForeignKey
ALTER TABLE `DescriptionSection` DROP FOREIGN KEY `DescriptionSection_associationId_fkey`;

-- AlterTable
ALTER TABLE `Municipality` ADD COLUMN `region` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Association` DROP COLUMN `descriptionFreeText`;

-- DropTable
DROP TABLE `DescriptionSection`;

-- CreateIndex
CREATE INDEX `Municipality_region_idx` ON `Municipality`(`region` ASC);

-- CreateIndex
CREATE INDEX `GroupMembership_associationId_fkey` ON `GroupMembership`(`associationId` ASC);

