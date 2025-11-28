-- =============================================================================
-- CRM Pipeline Migration - FULL SCRIPT
-- Run this in phpMyAdmin on Loopia
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Create Definition Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CrmLeadStatusDefinition` (
  `code`        varchar(50)  NOT NULL,
  `label`       varchar(191) NOT NULL,
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CrmPipelineStageDefinition` (
  `code`              varchar(50)  NOT NULL,
  `pipelineType`      varchar(50)  NOT NULL,
  `label`             varchar(191) NOT NULL,
  `description`       text         NULL,
  `sortOrder`         int          NOT NULL DEFAULT 0,
  `isClosedWon`       tinyint(1)   NOT NULL DEFAULT 0,
  `isClosedLost`      tinyint(1)   NOT NULL DEFAULT 0,
  `defaultProbability` int         NULL,
  `isActive`          tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`         datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`         datetime(3)  NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`code`),
  KEY `CrmPipelineStageDefinition_pipelineType_sortOrder_idx` (`pipelineType`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CrmLifecycleStageDefinition` (
  `code`        varchar(50)  NOT NULL,
  `label`       varchar(191) NOT NULL,
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PART 2: Create History Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `AssociationLeadStatusHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStatus`    varchar(50)  NULL,
  `toStatus`      varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL,
  PRIMARY KEY (`id`),
  KEY `AssociationLeadStatusHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationLeadStatusHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AssociationPipelineHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStage`     varchar(50)  NULL,
  `toStage`       varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL,
  PRIMARY KEY (`id`),
  KEY `AssociationPipelineHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationPipelineHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AssociationLifecycleHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStage`     varchar(50)  NULL,
  `toStage`       varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL,
  PRIMARY KEY (`id`),
  KEY `AssociationLifecycleHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationLifecycleHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PART 3: Add lifecycleStage column to Association
-- -----------------------------------------------------------------------------

ALTER TABLE `Association`
  ADD COLUMN IF NOT EXISTS `lifecycleStage` varchar(50) NULL AFTER `pipeline`;

-- -----------------------------------------------------------------------------
-- PART 4: Seed Definition Data
-- -----------------------------------------------------------------------------

INSERT INTO `CrmLeadStatusDefinition` (`code`, `label`, `description`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('UNCONTACTED', 'Uncontacted', 'No outbound contact has been made.', 10, 1, NOW(3), NOW(3)),
  ('CONTACTED', 'Contacted', 'Initial contact attempt has been made.', 20, 1, NOW(3), NOW(3)),
  ('INTERESTED', 'Interested', 'The association has shown explicit interest.', 30, 1, NOW(3), NOW(3)),
  ('NURTURING', 'Nurturing', 'Long-term nurturing with content and follow-ups.', 40, 1, NOW(3), NOW(3)),
  ('MQL', 'Marketing Qualified Lead', 'Qualified by marketing based on engagement.', 50, 1, NOW(3), NOW(3)),
  ('SQL', 'Sales Qualified Lead', 'Qualified by sales and ready for pipeline.', 60, 1, NOW(3), NOW(3)),
  ('DISQUALIFIED', 'Disqualified', 'Not relevant or not a fit.', 70, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = VALUES(`updatedAt`);

INSERT INTO `CrmPipelineStageDefinition`
(`code`, `pipelineType`, `label`, `description`, `sortOrder`, `isClosedWon`, `isClosedLost`, `defaultProbability`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('QUALIFIED_LEAD', 'SALES', 'Qualified lead', 'Lead is qualified and ready for sales.', 10, 0, 0, 20, 1, NOW(3), NOW(3)),
  ('DISCOVERY', 'SALES', 'Discovery', 'Needs analysis and discovery meetings.', 20, 0, 0, 40, 1, NOW(3), NOW(3)),
  ('PROPOSAL_SENT', 'SALES', 'Proposal sent', 'Proposal or demo has been presented.', 30, 0, 0, 60, 1, NOW(3), NOW(3)),
  ('NEGOTIATION', 'SALES', 'Negotiation', 'Commercial terms being negotiated.', 40, 0, 0, 75, 1, NOW(3), NOW(3)),
  ('CLOSED_WON', 'SALES', 'Closed won', 'Deal successfully closed.', 90, 1, 0, 100, 1, NOW(3), NOW(3)),
  ('CLOSED_LOST', 'SALES', 'Closed lost', 'Deal lost.', 100, 0, 1, 0, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `sortOrder` = VALUES(`sortOrder`),
  `isClosedWon` = VALUES(`isClosedWon`),
  `isClosedLost` = VALUES(`isClosedLost`),
  `defaultProbability` = VALUES(`defaultProbability`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = VALUES(`updatedAt`);

INSERT INTO `CrmLifecycleStageDefinition`
(`code`, `label`, `description`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
  ('PROSPECT', 'Prospect', 'Not yet a paying member.', 10, 1, NOW(3), NOW(3)),
  ('READY_FOR_ONBOARDING', 'Ready for onboarding', 'Deal won and ready for onboarding.', 20, 1, NOW(3), NOW(3)),
  ('ONBOARDING_IN_PROGRESS', 'Onboarding in progress', 'Implementation and setup ongoing.', 30, 1, NOW(3), NOW(3)),
  ('ONBOARDED', 'Onboarded', 'Customer is fully onboarded and active.', 40, 1, NOW(3), NOW(3)),
  ('INACTIVE_MEMBER', 'Inactive member', 'Temporarily inactive member.', 50, 1, NOW(3), NOW(3)),
  ('CHURNED', 'Churned', 'Membership terminated.', 60, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `description` = VALUES(`description`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = VALUES(`updatedAt`);

-- -----------------------------------------------------------------------------
-- PART 5: Migrate Pipeline Enum Values
-- -----------------------------------------------------------------------------

UPDATE `Association` SET `pipeline` = 'QUALIFIED_LEAD' WHERE `pipeline` = 'PROSPECT';
UPDATE `Association` SET `pipeline` = 'DISCOVERY'      WHERE `pipeline` = 'QUALIFIED';
UPDATE `Association` SET `pipeline` = 'NEGOTIATION'    WHERE `pipeline` = 'FOLLOW_UP';

ALTER TABLE `Association`
  MODIFY `pipeline` enum(
    'QUALIFIED_LEAD',
    'DISCOVERY',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST'
  ) NOT NULL DEFAULT 'QUALIFIED_LEAD';

-- =============================================================================
-- DONE! All migrations completed.
-- =============================================================================
