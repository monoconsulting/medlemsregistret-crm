-- Run this in BOTH local and Loopia databases (adjust names if needed)
CREATE INDEX IF NOT EXISTS idx_assoc_name           ON associations(name);
CREATE INDEX IF NOT EXISTS idx_assoc_municipality   ON associations(municipality_id);
CREATE INDEX IF NOT EXISTS idx_assoc_type           ON associations(type);
CREATE INDEX IF NOT EXISTS idx_assoc_status         ON associations(status);
CREATE INDEX IF NOT EXISTS idx_at_assoc             ON association_tags(association_id);
CREATE INDEX IF NOT EXISTS idx_at_tag               ON association_tags(tag_id);
-- Optional fulltext (if supported)
-- ALTER TABLE associations ADD FULLTEXT ft_assoc_name_desc (name, description);
