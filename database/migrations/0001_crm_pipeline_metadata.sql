-- 0001_crm_pipeline_metadata.sql

-- 1. Create Lead Status Definition Table
CREATE TABLE `CrmLeadStatusDefinition` (
  `code`        varchar(50)  NOT NULL, -- e.g. 'UNCONTACTED', 'MQL'
  `label`       varchar(191) NOT NULL, -- human-readable label
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create Pipeline Stage Definition Table
CREATE TABLE `CrmPipelineStageDefinition` (
  `code`              varchar(50)  NOT NULL, -- e.g. 'QUALIFIED_LEAD'
  `pipelineType`      varchar(50)  NOT NULL, -- e.g. 'SALES'
  `label`             varchar(191) NOT NULL,
  `description`       text         NULL,
  `sortOrder`         int          NOT NULL DEFAULT 0,
  `isClosedWon`       tinyint(1)   NOT NULL DEFAULT 0,
  `isClosedLost`      tinyint(1)   NOT NULL DEFAULT 0,
  `defaultProbability` int         NULL,     -- 0–100, nullable if not used
  `isActive`          tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`         datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`         datetime(3)  NOT NULL,
  PRIMARY KEY (`code`),
  KEY `CrmPipelineStageDefinition_pipelineType_sortOrder_idx` (`pipelineType`,`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Lifecycle Stage Definition Table
CREATE TABLE `CrmLifecycleStageDefinition` (
  `code`        varchar(50)  NOT NULL, -- e.g. 'PROSPECT', 'ONBOARDED'
  `label`       varchar(191) NOT NULL,
  `description` text         NULL,
  `sortOrder`   int          NOT NULL DEFAULT 0,
  `isActive`    tinyint(1)   NOT NULL DEFAULT 1,
  `createdAt`   datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `updatedAt`   datetime(3)  NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Association Lead Status History Table
CREATE TABLE `AssociationLeadStatusHistory` (
  `id`            varchar(191) NOT NULL,
  `associationId` varchar(191) NOT NULL,
  `fromStatus`    varchar(50)  NULL,
  `toStatus`      varchar(50)  NOT NULL,
  `changedAt`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
  `changedByUserId` varchar(191) NULL,
  `source`        varchar(50)  NULL, -- 'frontend', 'api', 'script', etc.
  PRIMARY KEY (`id`),
  KEY `AssociationLeadStatusHistory_associationId_changedAt_idx` (`associationId`,`changedAt`),
  CONSTRAINT `AssociationLeadStatusHistory_associationId_fkey`
    FOREIGN KEY (`associationId`) REFERENCES `Association` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Association Pipeline History Table
CREATE TABLE `AssociationPipelineHistory` (
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

-- 6. Create Association Lifecycle History Table
CREATE TABLE `AssociationLifecycleHistory` (
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

-- 7. Add lifecycleStage to Association
ALTER TABLE `Association`
  ADD COLUMN `lifecycleStage` varchar(50) NULL AFTER `pipeline`;
