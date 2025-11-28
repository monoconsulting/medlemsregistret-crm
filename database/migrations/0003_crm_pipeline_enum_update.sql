-- 0003_crm_pipeline_enum_update.sql

-- 1. Map existing rows to new values
UPDATE `Association` SET `pipeline` = 'QUALIFIED_LEAD' WHERE `pipeline` = 'PROSPECT';
UPDATE `Association` SET `pipeline` = 'DISCOVERY'      WHERE `pipeline` = 'QUALIFIED';
UPDATE `Association` SET `pipeline` = 'NEGOTIATION'    WHERE `pipeline` = 'FOLLOW_UP';

-- 2. Alter the enum definition
ALTER TABLE `Association`
  MODIFY `pipeline` enum(
    'QUALIFIED_LEAD',
    'DISCOVERY',
    'PROPOSAL_SENT',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST'
  ) NOT NULL DEFAULT 'QUALIFIED_LEAD';
