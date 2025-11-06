-- Migration: Create municipalities and associations_main tables
-- Created: 2025-10-21
-- Description: Creates tables for storing Swedish municipal association registry data

-- ==================================================
-- 1. Create municipalities table
-- ==================================================
CREATE TABLE IF NOT EXISTS municipalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    url_main TEXT,
    url_register TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_municipalities_name ON municipalities(name);

COMMENT ON TABLE municipalities IS 'Swedish municipalities with their association registry URLs';
COMMENT ON COLUMN municipalities.id IS 'Primary key';
COMMENT ON COLUMN municipalities.name IS 'Municipality name (e.g., Sollentuna, Alingsås)';
COMMENT ON COLUMN municipalities.url_main IS 'Main municipality website URL';
COMMENT ON COLUMN municipalities.url_register IS 'Association registry URL';

-- ==================================================
-- 2. Create associations_main table
-- ==================================================
CREATE TABLE IF NOT EXISTS associations_main (
    id SERIAL PRIMARY KEY,

    -- Source metadata
    source_system VARCHAR(50) NOT NULL,  -- 'FRI', 'ActorSmartbook', or 'Rbok'
    municipality_id INTEGER REFERENCES municipalities(id) ON DELETE CASCADE,
    municipality_name VARCHAR(255) NOT NULL,
    scrape_run_id UUID NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Association core data
    name VARCHAR(500) NOT NULL,
    org_number VARCHAR(50),  -- Swedish Org.nr (NNNNNN-NNNN)
    types TEXT[],  -- Array of association types
    activities TEXT[],  -- Array of activities
    categories TEXT[],  -- Array of categories/subject tags
    homepage_url TEXT,
    detail_url TEXT NOT NULL,

    -- Contact information
    street_address TEXT,
    postal_code VARCHAR(20),
    city VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    description TEXT,

    -- Source navigation metadata
    list_page_index INTEGER NOT NULL DEFAULT 1,
    position_on_page INTEGER NOT NULL DEFAULT 0,
    pagination_model VARCHAR(50),  -- 'numeric_plus_next_last', 'first_prev_next_last', 'rbok_controls'
    filter_state JSONB,

    -- Additional platform-specific data
    extras JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_associations_source_system ON associations_main(source_system);
CREATE INDEX idx_associations_municipality_id ON associations_main(municipality_id);
CREATE INDEX idx_associations_municipality_name ON associations_main(municipality_name);
CREATE INDEX idx_associations_scrape_run_id ON associations_main(scrape_run_id);
CREATE INDEX idx_associations_org_number ON associations_main(org_number) WHERE org_number IS NOT NULL;
CREATE INDEX idx_associations_name ON associations_main(name);
CREATE INDEX idx_associations_types ON associations_main USING GIN(types);
CREATE INDEX idx_associations_activities ON associations_main USING GIN(activities);
CREATE INDEX idx_associations_categories ON associations_main USING GIN(categories);
CREATE INDEX idx_associations_extras ON associations_main USING GIN(extras);

COMMENT ON TABLE associations_main IS 'Main table for Swedish municipal association registry data';
COMMENT ON COLUMN associations_main.source_system IS 'Platform identifier: FRI, ActorSmartbook, or Rbok';
COMMENT ON COLUMN associations_main.municipality_id IS 'Foreign key to municipalities table';
COMMENT ON COLUMN associations_main.municipality_name IS 'Municipality name for denormalization';
COMMENT ON COLUMN associations_main.scrape_run_id IS 'UUID for the scrape run';
COMMENT ON COLUMN associations_main.scraped_at IS 'ISO 8601 timestamp (UTC) when scraped';
COMMENT ON COLUMN associations_main.name IS 'Association name';
COMMENT ON COLUMN associations_main.org_number IS 'Swedish organization number (Org.nr)';
COMMENT ON COLUMN associations_main.types IS 'Array of association types';
COMMENT ON COLUMN associations_main.activities IS 'Array of activities';
COMMENT ON COLUMN associations_main.categories IS 'Array of categories/subject tags';
COMMENT ON COLUMN associations_main.homepage_url IS 'External homepage URL';
COMMENT ON COLUMN associations_main.detail_url IS 'URL to the detail page';
COMMENT ON COLUMN associations_main.list_page_index IS '1-based page index where item was found';
COMMENT ON COLUMN associations_main.position_on_page IS '0-based row index within page';
COMMENT ON COLUMN associations_main.pagination_model IS 'Pagination type used';
COMMENT ON COLUMN associations_main.filter_state IS 'JSON of applied filters';
COMMENT ON COLUMN associations_main.extras IS 'Platform-specific additional fields';

-- ==================================================
-- 3. Create contacts table (one-to-many with associations)
-- ==================================================
CREATE TABLE IF NOT EXISTS association_contacts (
    id SERIAL PRIMARY KEY,
    association_id INTEGER NOT NULL REFERENCES associations_main(id) ON DELETE CASCADE,

    contact_person_name VARCHAR(255) NOT NULL,
    contact_person_role VARCHAR(255),  -- e.g., 'Ordförande', 'Kassör', 'Ledare'
    contact_person_email VARCHAR(255),
    contact_person_phone VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_association_id ON association_contacts(association_id);
CREATE INDEX idx_contacts_name ON association_contacts(contact_person_name);
CREATE INDEX idx_contacts_email ON association_contacts(contact_person_email) WHERE contact_person_email IS NOT NULL;

COMMENT ON TABLE association_contacts IS 'Contact persons for associations';
COMMENT ON COLUMN association_contacts.association_id IS 'Foreign key to associations_main';
COMMENT ON COLUMN association_contacts.contact_person_name IS 'Contact person name (labeled as Ansvarig, Föreningsansvarig, Kontaktperson, Kontakt)';
COMMENT ON COLUMN association_contacts.contact_person_role IS 'Role (e.g., Ordförande, Kassör, Ledare)';
COMMENT ON COLUMN association_contacts.contact_person_email IS 'Contact email';
COMMENT ON COLUMN association_contacts.contact_person_phone IS 'Contact phone';

-- ==================================================
-- 4. Create trigger function for updated_at
-- ==================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==================================================
-- 5. Create triggers for updated_at
-- ==================================================
CREATE TRIGGER update_municipalities_updated_at
    BEFORE UPDATE ON municipalities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_associations_main_updated_at
    BEFORE UPDATE ON associations_main
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_association_contacts_updated_at
    BEFORE UPDATE ON association_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 6. Insert sample municipalities (common ones from scraping docs)
-- ==================================================
INSERT INTO municipalities (name, url_main, url_register) VALUES
    ('Sollentuna', 'https://sollentuna.se', 'https://boka.sollentuna.se/forening/Default.aspx?page=1'),
    ('Halmstad', 'https://halmstad.se', NULL),
    ('Alingsås', 'https://alingsas.se', 'https://alingsas.actorsmartbook.se/Associations.aspx'),
    ('Älvdalen', 'https://alvdalen.se', NULL),
    ('Karlstad', 'https://karlstad.se', 'https://karlstad.rbok.se/foreningsregister'),
    ('Gävle', 'https://gavle.se', NULL)
ON CONFLICT (name) DO NOTHING;

-- ==================================================
-- 7. Create view for associations with contacts (denormalized)
-- ==================================================
CREATE OR REPLACE VIEW associations_with_contacts AS
SELECT
    a.id,
    a.source_system,
    a.municipality_id,
    a.municipality_name,
    a.scrape_run_id,
    a.scraped_at,
    a.name,
    a.org_number,
    a.types,
    a.activities,
    a.categories,
    a.homepage_url,
    a.detail_url,
    a.street_address,
    a.postal_code,
    a.city,
    a.email,
    a.phone,
    a.description,
    a.list_page_index,
    a.position_on_page,
    a.pagination_model,
    a.filter_state,
    a.extras,
    a.created_at,
    a.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'contact_person_name', c.contact_person_name,
                'contact_person_role', c.contact_person_role,
                'contact_person_email', c.contact_person_email,
                'contact_person_phone', c.contact_person_phone
            ) ORDER BY c.id
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
    ) AS contacts
FROM associations_main a
LEFT JOIN association_contacts c ON c.association_id = a.id
GROUP BY a.id;

COMMENT ON VIEW associations_with_contacts IS 'Denormalized view of associations with their contacts as JSON array';
