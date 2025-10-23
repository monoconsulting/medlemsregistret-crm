import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration from docker-compose.yml
const DB_CONFIG = {
  host: 'localhost',
  port: 15432,  // External port from docker-compose
  database: 'nocobase',
  user: 'nocobase',
  password: 'nocobase'
};

interface AssociationRecord {
  source_system: string;
  municipality: string;
  scrape_run_id: string;
  scraped_at: string;
  association: {
    name: string;
    org_number: string | null;
    types: string[];
    activities: string[];
    categories: string[];
    homepage_url: string | null;
    detail_url: string;
    street_address: string | null;
    postal_code: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    description: string | null;
  };
  contacts: Array<{
    contact_person_name: string;
    contact_person_role: string | null;
    contact_person_email: string | null;
    contact_person_phone: string | null;
  }>;
  source_navigation: {
    list_page_index: number;
    position_on_page: number;
    pagination_model: string;
    filter_state: any;
  };
  extras: Record<string, any>;
}

async function getMunicipalityId(client: Client, municipalityName: string): Promise<number> {
  const result = await client.query(
    'SELECT id FROM municipalities WHERE name = $1',
    [municipalityName]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Municipality doesn't exist, create it
  const insertResult = await client.query(
    'INSERT INTO municipalities (name) VALUES ($1) RETURNING id',
    [municipalityName]
  );

  return insertResult.rows[0].id;
}

async function insertAssociation(client: Client, record: AssociationRecord): Promise<number> {
  const municipalityId = await getMunicipalityId(client, record.municipality);

  const insertQuery = `
    INSERT INTO associations_main (
      source_system,
      municipality_id,
      municipality_name,
      scrape_run_id,
      scraped_at,
      name,
      org_number,
      types,
      activities,
      categories,
      homepage_url,
      detail_url,
      street_address,
      postal_code,
      city,
      email,
      phone,
      description,
      list_page_index,
      position_on_page,
      pagination_model,
      filter_state,
      extras
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23
    ) RETURNING id
  `;

  const values = [
    record.source_system,
    municipalityId,
    record.municipality,
    record.scrape_run_id,
    record.scraped_at,
    record.association.name,
    record.association.org_number,
    record.association.types,
    record.association.activities,
    record.association.categories,
    record.association.homepage_url,
    record.association.detail_url,
    record.association.street_address,
    record.association.postal_code,
    record.association.city,
    record.association.email,
    record.association.phone,
    record.association.description,
    record.source_navigation.list_page_index,
    record.source_navigation.position_on_page,
    record.source_navigation.pagination_model,
    record.source_navigation.filter_state ? JSON.stringify(record.source_navigation.filter_state) : null,
    JSON.stringify(record.extras)
  ];

  const result = await client.query(insertQuery, values);
  return result.rows[0].id;
}

async function insertContacts(client: Client, associationId: number, contacts: AssociationRecord['contacts']): Promise<void> {
  if (contacts.length === 0) return;

  for (const contact of contacts) {
    const insertQuery = `
      INSERT INTO association_contacts (
        association_id,
        contact_person_name,
        contact_person_role,
        contact_person_email,
        contact_person_phone
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    const values = [
      associationId,
      contact.contact_person_name,
      contact.contact_person_role,
      contact.contact_person_email,
      contact.contact_person_phone
    ];

    await client.query(insertQuery, values);
  }
}

async function importJsonFile(filePath: string): Promise<void> {
  const client = new Client(DB_CONFIG);

  try {
    console.log(`\n=== Importing ${path.basename(filePath)} ===\n`);

    // Read JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records: AssociationRecord[] = JSON.parse(fileContent);

    console.log(`Found ${records.length} records in file`);

    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Begin transaction
    await client.query('BEGIN');

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        // Insert association
        const associationId = await insertAssociation(client, record);

        // Insert contacts
        await insertContacts(client, associationId, record.contacts);

        imported++;

        if ((i + 1) % 10 === 0 || i === records.length - 1) {
          console.log(`Processed ${i + 1}/${records.length} records...`);
        }
      } catch (error) {
        errors++;
        console.error(`Error importing record ${i + 1} (${record.association.name}):`, error instanceof Error ? error.message : error);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log(`\n=== Import Summary ===`);
    console.log(`Total records: ${records.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    // Rollback on error
    try {
      await client.query('ROLLBACK');
    } catch {}

    console.error('FATAL ERROR:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    await client.end();
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx tsx import_to_db.ts <json-file>');
    console.error('Example: npx tsx import_to_db.ts Borås_associations_abc123.json');
    process.exit(1);
  }

  const jsonFile = args[0];
  const jsonPath = path.isAbsolute(jsonFile) ? jsonFile : path.join(__dirname, jsonFile);

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found: ${jsonPath}`);
    process.exit(1);
  }

  try {
    await importJsonFile(jsonPath);
    console.log('\nImport completed successfully!');
  } catch (error) {
    console.error('\nImport failed!');
    process.exit(1);
  }
}

main().catch(console.error);
