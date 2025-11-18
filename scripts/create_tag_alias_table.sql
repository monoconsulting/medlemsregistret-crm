-- ============================================================================
-- Create TagAlias Table for Tag Normalization
-- ============================================================================
-- This table maps various tag aliases to their canonical (standard) forms
-- Examples: "FOTBOLL" -> "fotboll", "Sport" -> "idrott"
-- ============================================================================

-- Drop existing table if it exists (to fix collation)
DROP TABLE IF EXISTS `TagAlias`;

CREATE TABLE `TagAlias` (
  `id` VARCHAR(191) NOT NULL,
  `alias` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Case-sensitive alias for matching exact tag variants',
  `canonical` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NULL COMMENT 'Category for grouping aliases (e.g., sport, culture, social)',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdBy` VARCHAR(191) NULL COMMENT 'User who created this alias',

  PRIMARY KEY (`id`),
  UNIQUE INDEX `alias_unique` (`alias`),
  INDEX `idx_canonical` (`canonical`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Seed Common Tag Aliases (Swedish Association Types)
-- ============================================================================

-- Sport & Idrott
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_sport_001', 'sport', 'idrott', 'sport', NOW()),
('alias_sport_002', 'Sport', 'idrott', 'sport', NOW()),
('alias_sport_003', 'SPORT', 'idrott', 'sport', NOW()),
('alias_sport_004', 'idrottsförening', 'idrott', 'sport', NOW()),
('alias_sport_005', 'Idrottsförening', 'idrott', 'sport', NOW()),
('alias_sport_006', 'Idrott', 'idrott', 'sport', NOW()),
('alias_sport_007', 'IDROTT', 'idrott', 'sport', NOW());

-- Fotboll
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_fotboll_001', 'Football', 'fotboll', 'sport', NOW()),
('alias_fotboll_002', 'FOTBOLL', 'fotboll', 'sport', NOW()),
('alias_fotboll_003', 'Fotboll', 'fotboll', 'sport', NOW());

-- Musik & Music
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_musik_001', 'Music', 'musik', 'culture', NOW()),
('alias_musik_002', 'MUSIK', 'musik', 'culture', NOW()),
('alias_musik_003', 'Musik', 'musik', 'culture', NOW()),
('alias_musik_004', 'musikförening', 'musik', 'culture', NOW()),
('alias_musik_005', 'Musikförening', 'musik', 'culture', NOW());

-- Kultur & Culture
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_kultur_001', 'Culture', 'kultur', 'culture', NOW()),
('alias_kultur_002', 'KULTUR', 'kultur', 'culture', NOW()),
('alias_kultur_003', 'Kultur', 'kultur', 'culture', NOW()),
('alias_kultur_004', 'kulturförening', 'kultur', 'culture', NOW()),
('alias_kultur_005', 'Kulturförening', 'kultur', 'culture', NOW());

-- Barn & Ungdom
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_barn_001', 'Barn', 'barn', 'youth', NOW()),
('alias_barn_002', 'BARN', 'barn', 'youth', NOW()),
('alias_barn_003', 'Barnverksamhet', 'barn', 'youth', NOW()),
('alias_ungdom_001', 'Ungdom', 'ungdom', 'youth', NOW()),
('alias_ungdom_002', 'UNGDOM', 'ungdom', 'youth', NOW()),
('alias_ungdom_003', 'Ungdomsverksamhet', 'ungdom', 'youth', NOW()),
('alias_ungdom_004', 'ungdomsförening', 'ungdom', 'youth', NOW());

-- Social & Socialt
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_social_001', 'Social', 'socialt', 'social', NOW()),
('alias_social_002', 'SOCIAL', 'socialt', 'social', NOW()),
('alias_social_003', 'Sociala', 'socialt', 'social', NOW()),
('alias_social_004', 'socialförening', 'socialt', 'social', NOW());

-- Miljö & Environment
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_miljo_001', 'Miljö', 'miljö', 'environment', NOW()),
('alias_miljo_002', 'MILJÖ', 'miljö', 'environment', NOW()),
('alias_miljo_003', 'Environment', 'miljö', 'environment', NOW()),
('alias_miljo_004', 'miljöförening', 'miljö', 'environment', NOW());

-- Ideell & Non-profit
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_ideell_001', 'Ideell', 'ideell', 'nonprofit', NOW()),
('alias_ideell_002', 'IDEELL', 'ideell', 'nonprofit', NOW()),
('alias_ideell_003', 'ideell förening', 'ideell', 'nonprofit', NOW()),
('alias_ideell_004', 'Ideell förening', 'ideell', 'nonprofit', NOW());

-- Bildning & Education
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_bildning_001', 'Bildning', 'bildning', 'education', NOW()),
('alias_bildning_002', 'BILDNING', 'bildning', 'education', NOW()),
('alias_bildning_003', 'bildningsförening', 'bildning', 'education', NOW()),
('alias_bildning_004', 'studieförening', 'bildning', 'education', NOW()),
('alias_bildning_005', 'Studieförening', 'bildning', 'education', NOW());

-- Friluftsliv & Outdoor
INSERT INTO `TagAlias` (`id`, `alias`, `canonical`, `category`, `createdAt`) VALUES
('alias_friluft_001', 'Friluftsliv', 'friluftsliv', 'outdoor', NOW()),
('alias_friluft_002', 'FRILUFTSLIV', 'friluftsliv', 'outdoor', NOW()),
('alias_friluft_003', 'friluftsförening', 'friluftsliv', 'outdoor', NOW()),
('alias_friluft_004', 'Outdoor', 'friluftsliv', 'outdoor', NOW());

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the data:
-- SELECT category, COUNT(*) as alias_count FROM TagAlias GROUP BY category;
