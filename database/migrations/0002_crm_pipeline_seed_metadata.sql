-- 0002_crm_pipeline_seed_metadata.sql

-- 1. Seed CrmLeadStatusDefinition
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

-- 2. Seed CrmPipelineStageDefinition (pipelineType = 'SALES')
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

-- 3. Seed CrmLifecycleStageDefinition
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
