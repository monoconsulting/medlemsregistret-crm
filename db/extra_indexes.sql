-- Phase 1 Task 1.4.1 – supplemental indexes for the PHP API

CREATE INDEX IF NOT EXISTS idx_associations_name ON associations (name);
CREATE INDEX IF NOT EXISTS idx_associations_municipality ON associations (municipality_id);
CREATE INDEX IF NOT EXISTS idx_associations_type ON associations (type);
CREATE INDEX IF NOT EXISTS idx_associations_status ON associations (status);

CREATE INDEX IF NOT EXISTS idx_association_tags_association ON association_tags (association_id);
CREATE INDEX IF NOT EXISTS idx_association_tags_tag ON association_tags (tag_id);

-- Optional FULLTEXT index (only if supported by the target MySQL/MariaDB version)
-- CREATE FULLTEXT INDEX idx_associations_fulltext ON associations (name, description);
