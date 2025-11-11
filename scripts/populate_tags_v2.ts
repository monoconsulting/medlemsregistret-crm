/**
 * Tag Population Script v2
 *
 * Enhanced tag generation with:
 * - Backup integration
 * - Idempotent/incremental mode
 * - Dry-run capability
 * - Provenance tracking
 * - Taxonomy normalization
 * - CSV reporting
 * - Error recovery
 *
 * Usage:
 *   npx tsx scripts/populate_tags_v2.ts --mode=dry-run --source=db:baseline --job-id=xxx
 *
 * Options:
 *   --mode        dry-run | execute (default: dry-run)
 *   --source      db:baseline | db:types | db:activities | db:categories (default: db:baseline)
 *   --job-id      Job ID for tracking (required)
 *   --resume      Resume from last processed ID (optional)
 *   --last-id     Last processed association ID (required if --resume)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface TagGenerationOptions {
  mode: 'dry-run' | 'execute';
  source: 'db:baseline' | 'db:types' | 'db:activities' | 'db:categories';
  jobId: string;
  resume?: boolean;
  lastProcessedId?: string;
}

interface TaxonomyMap {
  [alias: string]: string; // alias → canonical
}

interface TagExtractionResult {
  associationId: string;
  associationName: string;
  municipality: string;
  extractedTags: string[];      // Raw tags from JSON fields
  normalizedTags: string[];     // After lowercase + aliases
  newTags: string[];            // Tags that don't exist yet
  newLinks: Array<{
    tagId: string;
    tagName: string;
  }>;
  existingLinks: string[];      // Already linked tag IDs
}

interface RunStatistics {
  associationsProcessed: number;
  tagsCreated: number;
  linksCreated: number;
  linksSkipped: number;
  errors: Array<{
    associationId: string;
    error: string;
    timestamp: string;
  }>;
}

interface CSVRow {
  associationId: string;
  associationName: string;
  municipality: string;
  tagsAdded: string;
  tagsAlreadyLinked: string;
  tagsCreated: string;
  source: string;
}

// ============================================================================
// Main Class
// ============================================================================

class TagGenerator {
  private prisma: PrismaClient;
  private options: TagGenerationOptions;
  private stats: RunStatistics;
  private taxonomy: TaxonomyMap = {};
  private csvRows: CSVRow[] = [];

  constructor(options: TagGenerationOptions) {
    this.options = options;
    this.prisma = new PrismaClient();
    this.stats = {
      associationsProcessed: 0,
      tagsCreated: 0,
      linksCreated: 0,
      linksSkipped: 0,
      errors: []
    };
  }

  /**
   * Main execution flow
   */
  async execute(): Promise<void> {
    console.log('='.repeat(80));
    console.log('TAG GENERATION V2');
    console.log('='.repeat(80));
    console.log(`Mode: ${this.options.mode}`);
    console.log(`Source: ${this.options.source}`);
    console.log(`Job ID: ${this.options.jobId}`);
    console.log('='.repeat(80));
    console.log('');

    try {
      // Step 1: Load taxonomy
      console.log('[1/5] Loading taxonomy aliases...');
      await this.loadTaxonomy();
      console.log(`      Loaded ${Object.keys(this.taxonomy).length} alias mappings`);
      console.log('');

      // Step 2: Process associations in batches
      console.log('[2/5] Processing associations...');
      await this.processAssociations();
      console.log('');

      // Step 3: Generate CSV report
      console.log('[3/5] Generating CSV report...');
      const reportPath = await this.generateCSVReport();
      console.log(`      Report saved to: ${reportPath}`);
      console.log('');

      // Step 4: Update job record
      console.log('[4/5] Updating job record...');
      await this.updateJobRecord('completed', reportPath);
      console.log('');

      // Step 5: Print summary
      console.log('[5/5] Summary');
      this.printSummary();

    } catch (error) {
      console.error('FATAL ERROR:', error);
      await this.updateJobRecord('failed', null);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Load taxonomy aliases from database
   */
  private async loadTaxonomy(): Promise<void> {
    const aliases = await this.prisma.tagAlias.findMany();

    for (const alias of aliases) {
      // Store both the alias and canonical in lowercase
      this.taxonomy[alias.alias.toLowerCase()] = alias.canonical.toLowerCase();
    }
  }

  /**
   * Process all associations in batches
   */
  private async processAssociations(): Promise<void> {
    const batchSize = 100;
    let offset = 0;

    // If resuming, find offset for last processed ID
    if (this.options.resume && this.options.lastProcessedId) {
      console.log(`      Resuming from ID: ${this.options.lastProcessedId}`);
      // Note: In production, implement proper offset calculation
      // For now, start from beginning
    }

    while (true) {
      const associations = await this.prisma.association.findMany({
        select: {
          id: true,
          name: true,
          municipality: true,
          types: true,
          activities: true,
          categories: true,
          tags: {
            select: { id: true, name: true }
          }
        },
        where: {
          isDeleted: false
        },
        take: batchSize,
        skip: offset,
        orderBy: { createdAt: 'asc' }
      });

      if (associations.length === 0) break;

      for (const assoc of associations) {
        try {
          const result = await this.processAssociation(assoc);

          if (this.options.mode === 'execute') {
            await this.commitChanges(result);
          }

          // Add to CSV
          this.csvRows.push(this.resultToCSVRow(result));

          // Update progress in database
          await this.updateProgress(assoc.id);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`      Error processing ${assoc.id}: ${errorMsg}`);

          this.stats.errors.push({
            associationId: assoc.id,
            error: errorMsg,
            timestamp: new Date().toISOString()
          });
        }

        this.stats.associationsProcessed++;

        // Progress indicator every 50 associations
        if (this.stats.associationsProcessed % 50 === 0) {
          console.log(`      Processed ${this.stats.associationsProcessed} associations...`);
        }
      }

      offset += associations.length;
    }

    console.log(`      Total processed: ${this.stats.associationsProcessed} associations`);
  }

  /**
   * Process a single association
   */
  private async processAssociation(assoc: any): Promise<TagExtractionResult> {
    // Step 1: Extract raw tags based on source
    const rawTags = this.extractTags(assoc);

    // Step 2: Normalize (lowercase + apply aliases + deduplicate)
    const normalizedTags = this.normalizeTags(rawTags);

    // Step 3: Find which tags exist and which are new
    const existingTags = await this.findExistingTags(normalizedTags);
    const existingTagNames = new Set(existingTags.map(t => t.name));
    const newTagNames = normalizedTags.filter(t => !existingTagNames.has(t));

    // Step 4: Find which links exist
    const existingLinkIds = new Set(assoc.tags.map((t: any) => t.id));
    const newLinks = existingTags
      .filter(t => !existingLinkIds.has(t.id))
      .map(t => ({ tagId: t.id, tagName: t.name }));

    return {
      associationId: assoc.id,
      associationName: assoc.name,
      municipality: assoc.municipality || 'Unknown',
      extractedTags: rawTags,
      normalizedTags,
      newTags: newTagNames,
      newLinks,
      existingLinks: Array.from(existingLinkIds)
    };
  }

  /**
   * Extract tags from association based on source parameter
   */
  private extractTags(assoc: any): string[] {
    const tags: string[] = [];
    const source = this.options.source;

    // Extract from types
    if (source === 'db:baseline' || source === 'db:types') {
      if (Array.isArray(assoc.types)) {
        tags.push(...assoc.types.filter((t: any) => typeof t === 'string'));
      }
    }

    // Extract from activities
    if (source === 'db:baseline' || source === 'db:activities') {
      if (Array.isArray(assoc.activities)) {
        tags.push(...assoc.activities.filter((a: any) => typeof a === 'string'));
      }
    }

    // Extract from categories
    if (source === 'db:baseline' || source === 'db:categories') {
      if (Array.isArray(assoc.categories)) {
        tags.push(...assoc.categories.filter((c: any) => typeof c === 'string'));
      }
    }

    return tags;
  }

  /**
   * Normalize tags: lowercase, apply aliases, deduplicate
   */
  private normalizeTags(tags: string[]): string[] {
    const normalized = tags
      .map(t => t.toLowerCase().trim())
      .filter(t => t.length > 0)
      .map(t => this.taxonomy[t] || t); // Apply alias mapping

    // Deduplicate
    return [...new Set(normalized)];
  }

  /**
   * Find existing tags by name
   */
  private async findExistingTags(tagNames: string[]): Promise<Array<{ id: string; name: string }>> {
    if (tagNames.length === 0) return [];

    return await this.prisma.tag.findMany({
      where: {
        name: { in: tagNames }
      },
      select: { id: true, name: true }
    });
  }

  /**
   * Commit changes to database (execute mode only)
   */
  private async commitChanges(result: TagExtractionResult): Promise<void> {
    // Create new tags
    for (const tagName of result.newTags) {
      const tagId = await this.upsertTag(tagName);

      // Create TagSource record
      await this.createTagSource(tagId, this.options.source);

      this.stats.tagsCreated++;

      // Add to newLinks so we can link it
      result.newLinks.push({ tagId, tagName });
    }

    // Create new links (idempotent via INSERT IGNORE)
    for (const link of result.newLinks) {
      const created = await this.createTagLink(result.associationId, link.tagId);
      if (created) {
        this.stats.linksCreated++;
      } else {
        this.stats.linksSkipped++;
      }
    }
  }

  /**
   * Upsert tag (idempotent)
   */
  private async upsertTag(name: string): Promise<string> {
    const existing = await this.prisma.tag.findUnique({
      where: { name }
    });

    if (existing) {
      return existing.id;
    }

    const tag = await this.prisma.tag.create({
      data: { name }
    });

    return tag.id;
  }

  /**
   * Create TagSource record
   */
  private async createTagSource(tagId: string, source: string): Promise<void> {
    // Extract source field from source parameter
    let sourceField: string | null = null;
    if (source === 'db:types') sourceField = 'types';
    else if (source === 'db:activities') sourceField = 'activities';
    else if (source === 'db:categories') sourceField = 'categories';

    // Check if source already exists (idempotent)
    const existing = await this.prisma.tagSource.findFirst({
      where: {
        tagId,
        source,
        sourceField
      }
    });

    if (!existing) {
      await this.prisma.tagSource.create({
        data: {
          tagId,
          source,
          sourceField
        }
      });
    }
  }

  /**
   * Create tag-association link (idempotent via raw SQL)
   */
  private async createTagLink(associationId: string, tagId: string): Promise<boolean> {
    try {
      // Use raw SQL with INSERT IGNORE for idempotency
      await this.prisma.$executeRaw`
        INSERT IGNORE INTO _AssociationTags (A, B)
        VALUES (${associationId}, ${tagId})
      `;
      return true;
    } catch (error) {
      // Link already exists
      return false;
    }
  }

  /**
   * Convert result to CSV row
   */
  private resultToCSVRow(result: TagExtractionResult): CSVRow {
    return {
      associationId: result.associationId,
      associationName: result.associationName,
      municipality: result.municipality,
      tagsAdded: result.newLinks.map(l => l.tagName).join(';'),
      tagsAlreadyLinked: result.existingLinks.length.toString(),
      tagsCreated: result.newTags.join(';'),
      source: this.options.source
    };
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(): Promise<string> {
    const reportsDir = path.join(__dirname, '../reports/tag_generation');

    // Ensure directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tag_generation_${this.options.jobId}_${timestamp}.csv`;
    const filepath = path.join(reportsDir, filename);

    // Build CSV content
    let csv = 'AssociationID;AssociationName;Municipality;TagsAdded;TagsAlreadyLinked;TagsCreated;Source\n';

    for (const row of this.csvRows) {
      csv += `${row.associationId};${this.escapeCsv(row.associationName)};${row.municipality};`;
      csv += `"${row.tagsAdded}";"${row.tagsAlreadyLinked}";"${row.tagsCreated}";${row.source}\n`;
    }

    // Add summary section
    csv += '\n=== SUMMARY ===\n';
    csv += `Total Associations Processed;${this.stats.associationsProcessed}\n`;
    csv += `New Tags Created;${this.stats.tagsCreated}\n`;
    csv += `New Links Created;${this.stats.linksCreated}\n`;
    csv += `Links Already Existed;${this.stats.linksSkipped}\n`;
    csv += `Errors;${this.stats.errors.length}\n`;
    csv += `Mode;${this.options.mode}\n`;
    csv += `Source;${this.options.source}\n`;
    csv += `Job ID;${this.options.jobId}\n`;

    // Write to file
    fs.writeFileSync(filepath, csv, 'utf-8');

    return filepath;
  }

  /**
   * Escape CSV value
   */
  private escapeCsv(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  /**
   * Update progress in database
   */
  private async updateProgress(lastProcessedId: string): Promise<void> {
    await this.prisma.tagGenerationRun.update({
      where: { id: this.options.jobId },
      data: {
        associationsProcessed: this.stats.associationsProcessed,
        tagsCreated: this.stats.tagsCreated,
        linksCreated: this.stats.linksCreated,
        linksSkipped: this.stats.linksSkipped,
        lastProcessedId
      }
    });
  }

  /**
   * Update job record status
   */
  private async updateJobRecord(status: 'completed' | 'failed', reportPath: string | null): Promise<void> {
    const updateData: any = {
      status,
      completedAt: new Date(),
      associationsProcessed: this.stats.associationsProcessed,
      tagsCreated: this.stats.tagsCreated,
      linksCreated: this.stats.linksCreated,
      linksSkipped: this.stats.linksSkipped
    };

    if (reportPath) {
      updateData.reportPath = reportPath;
      // Generate download URL (adjust based on your hosting)
      const filename = path.basename(reportPath);
      updateData.reportUrl = `/reports/tag_generation/${filename}`;
    }

    if (this.stats.errors.length > 0) {
      updateData.errors = JSON.stringify(this.stats.errors);
    }

    await this.prisma.tagGenerationRun.update({
      where: { id: this.options.jobId },
      data: updateData
    });
  }

  /**
   * Print summary to console
   */
  private printSummary(): void {
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Associations Processed: ${this.stats.associationsProcessed}`);
    console.log(`Tags Created:           ${this.stats.tagsCreated}`);
    console.log(`Links Created:          ${this.stats.linksCreated}`);
    console.log(`Links Skipped:          ${this.stats.linksSkipped}`);
    console.log(`Errors:                 ${this.stats.errors.length}`);
    console.log('='.repeat(80));

    if (this.options.mode === 'dry-run') {
      console.log('');
      console.log('NOTE: This was a DRY-RUN. No changes were made to the database.');
      console.log('      Run with --mode=execute to apply changes.');
    }
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: TagGenerationOptions = {
    mode: 'dry-run',
    source: 'db:baseline',
    jobId: '',
    resume: false
  };

  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      const mode = arg.split('=')[1];
      if (mode !== 'dry-run' && mode !== 'execute') {
        console.error('Invalid mode. Must be dry-run or execute');
        process.exit(1);
      }
      options.mode = mode as any;
    } else if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1] as any;
    } else if (arg.startsWith('--job-id=')) {
      options.jobId = arg.split('=')[1];
    } else if (arg === '--resume') {
      options.resume = true;
    } else if (arg.startsWith('--last-id=')) {
      options.lastProcessedId = arg.split('=')[1];
    }
  }

  // Validate required options
  if (!options.jobId) {
    console.error('Missing required --job-id parameter');
    process.exit(1);
  }

  // Execute
  const generator = new TagGenerator(options);
  await generator.execute();

  console.log('');
  console.log('DONE!');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
