-- Rename columns in three steps due to MySQL limitations when reusing new names
ALTER TABLE `Municipality` CHANGE COLUMN `latitude` `latitude_tmp` DOUBLE NULL;
ALTER TABLE `Municipality` CHANGE COLUMN `longitude` `latitude` DOUBLE NULL;
ALTER TABLE `Municipality` CHANGE COLUMN `latitude_tmp` `longitude` DOUBLE NULL;
