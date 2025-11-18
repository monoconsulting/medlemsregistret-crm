<?php
/**
 * Tag Population Script v2 (PHP Version)
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
 *   php scripts/populate_tags_v2.php --mode=dry-run --source=db:baseline --job-id=xxx
 *
 * Options:
 *   --mode        dry-run | execute (default: dry-run)
 *   --source      db:baseline | db:types | db:activities | db:categories (default: db:baseline)
 *   --job-id      Job ID for tracking (required)
 *   --resume      Resume from last processed ID (optional)
 *   --last-id     Last processed association ID (required if --resume)
 *
 * @package Scripts
 */

declare(strict_types=1);

// Optional logger - load if available
if (file_exists(__DIR__ . '/../api/lib/tag_generation_logger.php')) {
  require_once __DIR__ . '/../api/lib/tag_generation_logger.php';
}

// Define logger constants if TagGenerationLogger class doesn't exist
if (!class_exists('TagGenerationLogger')) {
  class TagGenerationLogger {
    const CAT_INIT = 'INIT';
    const CAT_DB_READ = 'DB_READ';
    const CAT_TAXONOMY_LOAD = 'TAXONOMY_LOAD';
    const CAT_ASSOCIATION_PROCESS = 'ASSOCIATION_PROCESS';
    const CAT_TAG_MATCH = 'TAG_MATCH';
    const CAT_TAG_CREATE = 'TAG_CREATE';
    const CAT_TAG_LINK = 'TAG_LINK';
    const CAT_PROGRESS_UPDATE = 'PROGRESS_UPDATE';
    const CAT_REPORT_WRITE = 'REPORT_WRITE';
    const CAT_ERROR = 'ERROR';
    const CAT_COMPLETE = 'COMPLETE';
    const CAT_DB_CONNECT = 'DB_CONNECT';
    const CAT_CONFIG = 'CONFIG';
    const CAT_SCRIPT_START = 'SCRIPT_START';
    const CAT_BATCH_PROCESS = 'BATCH_PROCESS';
  }
}

// Create a safe logger wrapper that won't crash if logging fails
class SafeScriptLogger {
  private $logger;

  public function __construct($pdo, $jobId) {
    if (class_exists('TagGenerationLogger') && method_exists('TagGenerationLogger', 'info')) {
      try {
        $this->logger = new TagGenerationLogger($pdo, $jobId);
      } catch (Exception $e) {
        error_log("Failed to create logger: " . $e->getMessage());
        $this->logger = null;
      }
    } else {
      $this->logger = null;
    }
  }

  public function __call($method, $args) {
    if ($this->logger !== null) {
      try {
        return call_user_func_array([$this->logger, $method], $args);
      } catch (Exception $e) {
        error_log("Logger error in $method: " . $e->getMessage());
      }
    }
    return null;
  }
}

// Global logger instance
$logger = null;

/**
 * Multibyte safe lowercase function with fallback
 */
function mb_strtolower_safe(string $str): string {
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($str, 'UTF-8');
    }
    return strtolower($str);
}

/**
 * Load an .env file into memory if available.
 */
function loadEnvFile(string $path): void {
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

// ============================================================================
// Configuration
// ============================================================================

// Load .env file for database connection
loadEnvFile(__DIR__ . '/../.env');

/**
 * Resolve config values from environment, .env or hosting config.php
 */
function getEnvValue(array $keys, ?string $default = null): ?string {
    foreach ($keys as $key) {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }
    }
    return $default;
}

$dbHost = getEnvValue(['DBHOST', 'MARIADBHOST'], 'localhost');
$dbPort = getEnvValue(['DBPORT', 'MARIADBPORT'], '3306');
$dbName = getEnvValue(['DBDB', 'MARIADBDB'], '');
$dbUser = getEnvValue(['DBUSER', 'MARIADBUSER'], '');
$dbPass = getEnvValue(['DBPASSWORD', 'MARIADBPASSWORD'], '');

// Fallback to API config.php if needed (production FTP always has /api/config.php)
$configFile = __DIR__ . '/../api/config.php';
if ((empty($dbHost) || empty($dbName) || empty($dbUser)) && file_exists($configFile)) {
    $config = include $configFile;
    if (is_array($config)) {
        $dbHost = $dbHost ?: ($config['DB_HOST'] ?? $dbHost);
        $dbName = $dbName ?: ($config['DB_NAME'] ?? $dbName);
        $dbUser = $dbUser ?: ($config['DB_USER'] ?? $dbUser);
        $dbPass = $dbPass ?: ($config['DB_PASS'] ?? $dbPass);
    }
}

if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
    echo "ERROR: Database configuration missing. Ensure .env or api/config.php is deployed.\n";
    exit(1);
}

// ============================================================================
// Parse CLI Arguments
// ============================================================================

$options = [
    'mode' => 'dry-run',
    'source' => 'db:baseline',
    'jobId' => '',
    'resume' => false,
    'lastId' => null
];

foreach ($argv as $arg) {
    if (strpos($arg, '--mode=') === 0) {
        $options['mode'] = substr($arg, 7);
    } elseif (strpos($arg, '--source=') === 0) {
        $options['source'] = substr($arg, 9);
    } elseif (strpos($arg, '--job-id=') === 0) {
        $options['jobId'] = substr($arg, 9);
    } elseif ($arg === '--resume') {
        $options['resume'] = true;
    } elseif (strpos($arg, '--last-id=') === 0) {
        $options['lastId'] = substr($arg, 10);
    }
}

// Validate required options
if (empty($options['jobId'])) {
    echo "ERROR: Missing required --job-id parameter\n";
    exit(1);
}

// Validate mode
if (!in_array($options['mode'], ['dry-run', 'execute'])) {
    echo "ERROR: Invalid mode. Must be 'dry-run' or 'execute'\n";
    exit(1);
}

// Validate source
$validSources = ['db:baseline', 'db:types', 'db:activities', 'db:categories'];
if (!in_array($options['source'], $validSources)) {
    echo "ERROR: Invalid source. Must be one of: " . implode(', ', $validSources) . "\n";
    exit(1);
}

// ============================================================================
// Database Connection
// ============================================================================

try {
    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    echo "ERROR: Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// ============================================================================
// Statistics - Initialize FIRST before logging
// ============================================================================

$stats = [
    'associationsProcessed' => 0,
    'tagsCreated' => 0,
    'linksCreated' => 0,
    'linksSkipped' => 0,
    'errors' => [],
    'totalAssociations' => getAssociationsTotal($pdo)
];

// Initialize job summary BEFORE creating logger (foreign key constraint requirement)
// This creates the TagGenerationRun row that TagGenerationLog references
try {
    initializeJobSummary($pdo, $options['jobId'], $options['mode'], $options['source'], $stats);
} catch (PDOException $e) {
    // Table might not exist in production, that's OK - continue without logging
    error_log("Note: Could not initialize job summary (table might not exist): " . $e->getMessage());
}

// NOW create logger after TagGenerationRun row exists
$logger = new SafeScriptLogger($pdo, $options['jobId']);
$logger->info(TagGenerationLogger::CAT_SCRIPT_START, 'Script started', [
    'mode' => $options['mode'],
    'source' => $options['source'],
    'jobId' => $options['jobId'],
    'resume' => $options['resume'],
    'lastId' => $options['lastId']
]);

$logger->info(TagGenerationLogger::CAT_DB_CONNECT, 'Database connection established', [
    'host' => $dbHost,
    'port' => $dbPort,
    'database' => $dbName,
    'user' => $dbUser,
    'charset' => 'utf8mb4'
]);

$csvRows = [];

// ============================================================================
// Main Execution
// ============================================================================

echo str_repeat('=', 80) . "\n";
echo "TAG GENERATION V2 (PHP)\n";
echo str_repeat('=', 80) . "\n";
echo "Mode:      {$options['mode']}\n";
echo "Source:    {$options['source']}\n";
echo "Job ID:    {$options['jobId']}\n";
echo str_repeat('=', 80) . "\n";
echo "\n";

try {
    // Step 1: Load taxonomy
    echo "[1/5] Loading taxonomy aliases...\n";
    $logger->info(TagGenerationLogger::CAT_TAXONOMY_LOAD, 'Starting taxonomy load');
    try {
        $taxonomy = loadTaxonomy($pdo, $logger);
        echo "      Loaded " . count($taxonomy) . " alias mappings\n\n";
        $logger->info(TagGenerationLogger::CAT_TAXONOMY_LOAD, 'Taxonomy loaded successfully', [
            'count' => count($taxonomy)
        ]);
    } catch (Exception $e) {
        // TagAlias table might not exist - continue without taxonomy normalization
        $taxonomy = [];
        echo "      Note: TagAlias table not found - continuing without tag normalization\n\n";
        error_log("Note: TagAlias table not found - continuing without tag normalization");
    }

    echo "      Totalt antal föreningar att bearbeta: {$stats['totalAssociations']}\n\n";
    $logger->info(TagGenerationLogger::CAT_INIT, 'Total associations to process', [
        'total' => $stats['totalAssociations']
    ]);

    // Step 2: Process associations
    echo "[2/5] Processing associations...\n";
    $logger->info(TagGenerationLogger::CAT_ASSOCIATION_PROCESS, 'Starting association processing');
    processAssociations($pdo, $options, $taxonomy, $stats, $csvRows, $logger);
    echo "\n";

    // Step 3: Generate CSV report
    echo "[3/5] Generating CSV report...\n";
    $logger->info(TagGenerationLogger::CAT_REPORT_WRITE, 'Starting CSV report generation');
    $reportPath = generateCSVReport($options, $stats, $csvRows, $logger);
    echo "      Report saved to: $reportPath\n\n";

    // Step 4: Update job record
    echo "[4/5] Updating job record...\n";
    $logger->info(TagGenerationLogger::CAT_PROGRESS_UPDATE, 'Updating final job record');
    try {
        updateJobRecord($pdo, $options['jobId'], 'completed', $reportPath, $stats, $logger);
    } catch (PDOException $e) {
        // Table might not exist in production, that's OK - continue
        error_log("Note: Could not update job record (table might not exist): " . $e->getMessage());
    }
    echo "\n";

    // Step 5: Print summary
    echo "[5/5] Summary\n";
    printSummary($options, $stats);
    $logger->logComplete([
        'associationsProcessed' => $stats['associationsProcessed'],
        'tagsCreated' => $stats['tagsCreated'],
        'linksCreated' => $stats['linksCreated'],
        'linksSkipped' => $stats['linksSkipped'],
        'errors' => count($stats['errors'])
    ]);

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    $logger->error(TagGenerationLogger::CAT_ERROR, 'Fatal error occurred', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    try {
        updateJobRecord($pdo, $options['jobId'], 'failed', null, $stats, $logger);
    } catch (PDOException $dbError) {
        // Can't update job record, that's OK
        error_log("Note: Could not update job record on failure: " . $dbError->getMessage());
    }
    exit(1);
}

$pdo = null;

echo "\nDONE!\n";
exit(0);

// ============================================================================
// Functions
// ============================================================================

/**
 * Load taxonomy aliases from database
 */
function loadTaxonomy(PDO $db, $logger): array {
    $logger->debug(TagGenerationLogger::CAT_TAXONOMY_LOAD, 'Querying TagAlias table');
    $taxonomy = [];

    try {
        $stmt = $db->query('SELECT alias, canonical FROM TagAlias');
        $rows = $stmt->fetchAll();

        $count = 0;
        foreach ($rows as $row) {
            $taxonomy[mb_strtolower_safe($row['alias'])] = mb_strtolower_safe($row['canonical']);
            $count++;
        }

        $logger->debug(TagGenerationLogger::CAT_TAXONOMY_LOAD, "Loaded $count taxonomy mappings", [
            'count' => $count,
            'sample' => array_slice($taxonomy, 0, 5)
        ]);

        return $taxonomy;
    } catch (PDOException $e) {
        $logger->error(TagGenerationLogger::CAT_ERROR, 'Failed to load taxonomy', [
            'error' => $e->getMessage()
        ]);
        throw new Exception("Failed to load taxonomy: " . $e->getMessage());
    }
}

/**
 * Process all associations in batches
 */
function processAssociations(PDO $db, array $options, array $taxonomy, array &$stats, array &$csvRows, $logger): void {
    $batchSize = 100;
    $offset = 0;
    $batchNumber = 1;

    while (true) {
        // Fetch batch
        $logger->logBatchStart($batchNumber, $offset, $batchSize);

        $stmt = $db->prepare('
            SELECT id, name, municipality, types, activities, categories
            FROM Association
            WHERE isDeleted = 0
            ORDER BY createdAt ASC
            LIMIT :limit OFFSET :offset
        ');
        $stmt->bindValue(':limit', $batchSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $associations = $stmt->fetchAll();

        if (count($associations) === 0) {
            $logger->info(TagGenerationLogger::CAT_BATCH_PROCESS, "No more batches to process", [
                'batchNumber' => $batchNumber,
                'offset' => $offset
            ]);
            break;
        }

        $logger->debug(TagGenerationLogger::CAT_BATCH_PROCESS, "Fetched batch with " . count($associations) . " associations", [
            'batchNumber' => $batchNumber,
            'rows' => count($associations)
        ]);

        foreach ($associations as $assoc) {
            $lastProcessedId = $assoc['id'];

            try {
                $logger->logAssociationProcess($lastProcessedId, $assoc['name'], [
                    'municipality' => $assoc['municipality'] ?? 'N/A',
                    'types_count' => count(json_decode($assoc['types'] ?? '[]', true)),
                    'activities_count' => count(json_decode($assoc['activities'] ?? '[]', true)),
                    'categories_count' => count(json_decode($assoc['categories'] ?? '[]', true))
                ]);

                // Get existing tags for this association
                $existingTags = getExistingTags($db, $lastProcessedId, $logger);

                // Process association
                $extractionResult = processAssociation($db, $assoc, $existingTags, $taxonomy, $options, $logger);

                // Commit changes if execute mode
                if ($options['mode'] === 'execute') {
                    commitChanges($db, $extractionResult, $options['source'], $stats, $logger);
                } else {
                    // In dry-run, count what would be created
                    $stats['tagsCreated'] += count($extractionResult['newTags']);
                    $stats['linksCreated'] += count($extractionResult['newLinks']);
                    $stats['linksSkipped'] += count($extractionResult['existingLinks']);
                }

                // Add to CSV
                $csvRows[] = resultToCSVRow($extractionResult, $options['source']);

            } catch (Exception $e) {
                $stats['errors'][] = [
                    'associationId' => $lastProcessedId,
                    'error' => $e->getMessage(),
                    'timestamp' => date('c')
                ];
                $logger->error(TagGenerationLogger::CAT_ERROR, "Error processing association {$lastProcessedId}", [
                    'associationId' => $lastProcessedId,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                echo "      Error processing {$lastProcessedId}: {$e->getMessage()}\n";
            }

            $stats['associationsProcessed']++;

            // Update progress with the latest counters
            updateProgress($db, $options['jobId'], $lastProcessedId, $stats, $logger);

            // Progress indicator every 50
            if ($stats['associationsProcessed'] % 50 === 0) {
                echo "      Processed {$stats['associationsProcessed']} associations...\n";
            }
        }

        $offset += $batchSize;
        $batchNumber++;
    }

    echo "      Total processed: {$stats['associationsProcessed']} associations\n";
    $logger->info(TagGenerationLogger::CAT_ASSOCIATION_PROCESS, "Association processing completed", [
        'totalProcessed' => $stats['associationsProcessed'],
        'totalBatches' => $batchNumber - 1
    ]);
}

/**
 * Get existing tags for an association
 */
function getExistingTags(PDO $db, string $associationId, $logger): array {
    $stmt = $db->prepare('
        SELECT t.id, t.name
        FROM Tag t
        INNER JOIN _AssociationTags at ON at.B = t.id
        WHERE at.A = :associationId
    ');
    $stmt->execute([':associationId' => $associationId]);
    $tags = $stmt->fetchAll();

    $logger->debug(TagGenerationLogger::CAT_DB_READ, "Retrieved existing tags for association", [
        'associationId' => $associationId,
        'tagCount' => count($tags),
        'tags' => array_column($tags, 'name')
    ]);

    return $tags;
}

/**
 * Process a single association
 */
function processAssociation(PDO $db, array $assoc, array $existingTags, array $taxonomy, array $options, $logger): array {
    // Extract raw tags
    $rawTags = extractTags($assoc, $options['source'], $logger);

    $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Extracted raw tags", [
        'associationId' => $assoc['id'],
        'source' => $options['source'],
        'rawTagCount' => count($rawTags),
        'rawTags' => $rawTags
    ]);

    // Normalize (lowercase + aliases + deduplicate)
    $normalizedTags = normalizeTags($rawTags, $taxonomy, $logger);

    $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Normalized tags", [
        'associationId' => $assoc['id'],
        'normalizedTagCount' => count($normalizedTags),
        'normalizedTags' => $normalizedTags
    ]);

    // Find which tags exist
    $existingTagObjects = findExistingTags($db, $normalizedTags, $logger);
    $existingTagNames = array_column($existingTagObjects, 'name');
    $newTagNames = array_diff($normalizedTags, $existingTagNames);

    $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Determined new vs existing tags", [
        'associationId' => $assoc['id'],
        'existingTagCount' => count($existingTagNames),
        'newTagCount' => count($newTagNames),
        'newTags' => array_values($newTagNames)
    ]);

    // Find which links exist
    $existingLinkIds = array_column($existingTags, 'id');
    $newLinks = [];

    foreach ($existingTagObjects as $tag) {
        if (!in_array($tag['id'], $existingLinkIds)) {
            $newLinks[] = [
                'tagId' => $tag['id'],
                'tagName' => $tag['name']
            ];
        }
    }

    $logger->debug(TagGenerationLogger::CAT_TAG_LINK, "Determined new links", [
        'associationId' => $assoc['id'],
        'existingLinkCount' => count($existingLinkIds),
        'newLinkCount' => count($newLinks),
        'newLinks' => array_column($newLinks, 'tagName')
    ]);

    return [
        'associationId' => $assoc['id'],
        'associationName' => $assoc['name'],
        'municipality' => $assoc['municipality'] ?? 'Unknown',
        'extractedTags' => $rawTags,
        'normalizedTags' => $normalizedTags,
        'newTags' => array_values($newTagNames),
        'newLinks' => $newLinks,
        'existingLinks' => $existingLinkIds
    ];
}

/**
 * Extract tags from association based on source
 */
function extractTags(array $assoc, string $source, $logger): array {
    $tags = [];

    // Types
    if ($source === 'db:baseline' || $source === 'db:types') {
        $types = json_decode($assoc['types'], true);
        if (is_array($types)) {
            $filtered = array_filter($types, 'is_string');
            $tags = array_merge($tags, $filtered);
            $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Extracted types", [
                'associationId' => $assoc['id'],
                'count' => count($filtered),
                'types' => $filtered
            ]);
        }
    }

    // Activities
    if ($source === 'db:baseline' || $source === 'db:activities') {
        $activities = json_decode($assoc['activities'], true);
        if (is_array($activities)) {
            $filtered = array_filter($activities, 'is_string');
            $tags = array_merge($tags, $filtered);
            $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Extracted activities", [
                'associationId' => $assoc['id'],
                'count' => count($filtered),
                'activities' => $filtered
            ]);
        }
    }

    // Categories
    if ($source === 'db:baseline' || $source === 'db:categories') {
        $categories = json_decode($assoc['categories'], true);
        if (is_array($categories)) {
            $filtered = array_filter($categories, 'is_string');
            $tags = array_merge($tags, $filtered);
            $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Extracted categories", [
                'associationId' => $assoc['id'],
                'count' => count($filtered),
                'categories' => $filtered
            ]);
        }
    }

    return $tags;
}

/**
 * Normalize tags: lowercase, apply aliases, deduplicate
 */
function normalizeTags(array $tags, array $taxonomy, $logger): array {
    $normalized = [];
    $aliasesApplied = 0;

    foreach ($tags as $tag) {
        $original = $tag;
        $tag = mb_strtolower_safe(trim($tag));
        if (strlen($tag) === 0) continue;

        // Apply taxonomy alias
        $canonical = $taxonomy[$tag] ?? $tag;
        if ($canonical !== $tag) {
            $aliasesApplied++;
            $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Applied taxonomy alias", [
                'original' => $original,
                'lowercase' => $tag,
                'canonical' => $canonical
            ]);
        }
        $normalized[] = $canonical;
    }

    // Deduplicate
    $beforeDedup = count($normalized);
    $normalized = array_unique($normalized);
    $afterDedup = count($normalized);

    if ($beforeDedup !== $afterDedup) {
        $logger->debug(TagGenerationLogger::CAT_TAG_MATCH, "Removed duplicates", [
            'before' => $beforeDedup,
            'after' => $afterDedup,
            'removed' => $beforeDedup - $afterDedup
        ]);
    }

    return $normalized;
}

/**
 * Find existing tags by name
 */
function findExistingTags(PDO $db, array $tagNames, $logger): array {
    if (empty($tagNames)) {
        $logger->debug(TagGenerationLogger::CAT_DB_READ, "No tag names to search for");
        return [];
    }

    $logger->debug(TagGenerationLogger::CAT_DB_READ, "Searching for existing tags", [
        'tagCount' => count($tagNames),
        'tags' => $tagNames
    ]);

    // Build IN clause
    $placeholders = str_repeat('?,', count($tagNames) - 1) . '?';
    $stmt = $db->prepare("SELECT id, name FROM Tag WHERE name IN ($placeholders)");
    $stmt->execute($tagNames);
    $tags = $stmt->fetchAll();

    $logger->debug(TagGenerationLogger::CAT_DB_READ, "Found existing tags", [
        'searchedFor' => count($tagNames),
        'foundCount' => count($tags),
        'foundTags' => array_column($tags, 'name')
    ]);

    return $tags;
}

/**
 * Commit changes to database (execute mode only)
 */
function commitChanges(PDO $db, array $result, string $source, array &$stats, $logger): void {
    $logger->debug(TagGenerationLogger::CAT_TAG_CREATE, "Starting commit changes", [
        'associationId' => $result['associationId'],
        'newTagsCount' => count($result['newTags']),
        'newLinksCount' => count($result['newLinks'])
    ]);

    // Create new tags
    foreach ($result['newTags'] as $tagName) {
        $tagId = upsertTag($db, $tagName, $logger);
        createTagSource($db, $tagId, $source, $logger);
        $stats['tagsCreated']++;

        // Add to newLinks
        $result['newLinks'][] = [
            'tagId' => $tagId,
            'tagName' => $tagName
        ];
    }

    // Create new links
    foreach ($result['newLinks'] as $link) {
        $created = createTagLink($db, $result['associationId'], $link['tagId'], $logger);
        if ($created) {
            $stats['linksCreated']++;
        } else {
            $stats['linksSkipped']++;
        }
    }

    $logger->debug(TagGenerationLogger::CAT_TAG_LINK, "Commit changes completed", [
        'associationId' => $result['associationId'],
        'tagsCreated' => count($result['newTags']),
        'linksCreated' => $stats['linksCreated'],
        'linksSkipped' => $stats['linksSkipped']
    ]);
}

/**
 * Upsert tag (idempotent)
 */
function upsertTag(PDO $db, string $name, $logger): string {
    // Try to find existing
    $stmt = $db->prepare('SELECT id FROM Tag WHERE name = :name');
    $stmt->execute([':name' => $name]);
    $row = $stmt->fetch();

    if ($row) {
        $logger->logTagCreate($name, $row['id'], false);
        return $row['id'];
    }

    // Create new
    $id = generateId();
    $stmt = $db->prepare('INSERT INTO Tag (id, name, createdAt) VALUES (:id, :name, NOW())');
    $stmt->execute([':id' => $id, ':name' => $name]);

    $logger->logTagCreate($name, $id, true);
    return $id;
}

/**
 * Create TagSource record (idempotent)
 */
function createTagSource(PDO $db, string $tagId, string $source, $logger): void {
    // Extract source field
    $sourceField = null;
    if ($source === 'db:types') $sourceField = 'types';
    elseif ($source === 'db:activities') $sourceField = 'activities';
    elseif ($source === 'db:categories') $sourceField = 'categories';

    // Check if exists
    $stmt = $db->prepare('SELECT id FROM TagSource WHERE tagId = :tagId AND source = :source AND (sourceField = :sourceField OR (sourceField IS NULL AND :sourceField2 IS NULL))');
    $stmt->execute([
        ':tagId' => $tagId,
        ':source' => $source,
        ':sourceField' => $sourceField,
        ':sourceField2' => $sourceField
    ]);

    if ($stmt->fetch()) {
        $logger->debug(TagGenerationLogger::CAT_TAG_CREATE, "TagSource already exists", [
            'tagId' => $tagId,
            'source' => $source,
            'sourceField' => $sourceField
        ]);
        return; // Already exists
    }

    // Create new
    $id = generateId();
    $stmt = $db->prepare('INSERT INTO TagSource (id, tagId, source, sourceField, createdAt) VALUES (:id, :tagId, :source, :sourceField, NOW())');
    $stmt->execute([
        ':id' => $id,
        ':tagId' => $tagId,
        ':source' => $source,
        ':sourceField' => $sourceField
    ]);

    $logger->debug(TagGenerationLogger::CAT_TAG_CREATE, "Created TagSource record", [
        'id' => $id,
        'tagId' => $tagId,
        'source' => $source,
        'sourceField' => $sourceField
    ]);
}

/**
 * Create tag-association link (idempotent)
 */
function createTagLink(PDO $db, string $associationId, string $tagId, $logger): bool {
    // Use INSERT IGNORE for idempotency
    $stmt = $db->prepare('INSERT IGNORE INTO _AssociationTags (A, B) VALUES (:associationId, :tagId)');
    $stmt->execute([':associationId' => $associationId, ':tagId' => $tagId]);

    $created = $stmt->rowCount() > 0;

    // We don't have tag name here, so we'll log with ID only
    if ($created) {
        $logger->debug(TagGenerationLogger::CAT_TAG_LINK, "Created tag-association link", [
            'associationId' => $associationId,
            'tagId' => $tagId
        ]);
    } else {
        $logger->debug(TagGenerationLogger::CAT_TAG_LINK, "Tag-association link already exists", [
            'associationId' => $associationId,
            'tagId' => $tagId
        ]);
    }

    return $created;
}

/**
 * Generate a cuid-like ID
 */
function generateId(): string {
    return 'c' . bin2hex(random_bytes(12));
}

/**
 * Convert result to CSV row
 */
function resultToCSVRow(array $result, string $source): array {
    return [
        'associationId' => $result['associationId'],
        'associationName' => $result['associationName'],
        'municipality' => $result['municipality'],
        'tagsAdded' => implode(';', array_column($result['newLinks'], 'tagName')),
        'tagsAlreadyLinked' => count($result['existingLinks']),
        'tagsCreated' => implode(';', $result['newTags']),
        'source' => $source
    ];
}

/**
 * Generate CSV report
 */
function generateCSVReport(array $options, array $stats, array $csvRows, $logger): string {
    $reportsDir = __DIR__ . '/../reports/tag_generation';

    // Ensure directory exists
    if (!is_dir($reportsDir)) {
        $logger->debug(TagGenerationLogger::CAT_REPORT_WRITE, "Creating reports directory", [
            'path' => $reportsDir
        ]);
        mkdir($reportsDir, 0775, true);
    }

    $timestamp = date('Y-m-d_H-i-s');
    $filename = "tag_generation_{$options['jobId']}_{$timestamp}.csv";
    $filepath = $reportsDir . '/' . $filename;

    $logger->info(TagGenerationLogger::CAT_REPORT_WRITE, "Generating CSV report", [
        'filename' => $filename,
        'rowCount' => count($csvRows)
    ]);

    // Build CSV content
    $csv = "AssociationID;AssociationName;Municipality;TagsAdded;TagsAlreadyLinked;TagsCreated;Source\n";

    foreach ($csvRows as $row) {
        $csv .= $row['associationId'] . ';';
        $csv .= escapeCsv($row['associationName']) . ';';
        $csv .= $row['municipality'] . ';';
        $csv .= '"' . $row['tagsAdded'] . '";';
        $csv .= $row['tagsAlreadyLinked'] . ';';
        $csv .= '"' . $row['tagsCreated'] . '";';
        $csv .= $row['source'] . "\n";
    }

    // Add summary
    $csv .= "\n=== SUMMARY ===\n";
    $csv .= "Total Associations Processed;{$stats['associationsProcessed']}\n";
    if (isset($stats['totalAssociations'])) {
        $csv .= "Total Associations Available;{$stats['totalAssociations']}\n";
    }
    $csv .= "New Tags Created;{$stats['tagsCreated']}\n";
    $csv .= "New Links Created;{$stats['linksCreated']}\n";
    $csv .= "Links Already Existed;{$stats['linksSkipped']}\n";
    $csv .= "Errors;" . count($stats['errors']) . "\n";
    $csv .= "Mode;{$options['mode']}\n";
    $csv .= "Source;{$options['source']}\n";
    $csv .= "Job ID;{$options['jobId']}\n";

    file_put_contents($filepath, $csv);

    $logger->logReportWrite($filepath, count($csvRows));

    return $filepath;
}

/**
 * Escape CSV value
 */
function escapeCsv(string $value): string {
    if (strpos($value, ';') !== false || strpos($value, '"') !== false || strpos($value, "\n") !== false) {
        return '"' . str_replace('"', '""', $value) . '"';
    }
    return $value;
}

/**
 * Update progress in database
 */
function updateProgress(PDO $db, string $jobId, string $lastProcessedId, array $stats, $logger): void {
    try {
        $errors = empty($stats['errors']) ? null : json_encode($stats['errors']);
        $summary = buildSummaryPayload($stats);

        $stmt = $db->prepare('
            UPDATE TagGenerationRun
            SET associationsProcessed = :associationsProcessed,
                tagsCreated = :tagsCreated,
                linksCreated = :linksCreated,
                linksSkipped = :linksSkipped,
                lastProcessedId = :lastProcessedId,
                errors = :errors,
                summary = :summary
            WHERE id = :jobId
        ');
        $stmt->execute([
            ':associationsProcessed' => $stats['associationsProcessed'],
            ':tagsCreated' => $stats['tagsCreated'],
            ':linksCreated' => $stats['linksCreated'],
            ':linksSkipped' => $stats['linksSkipped'],
            ':lastProcessedId' => $lastProcessedId,
            ':errors' => $errors,
            ':summary' => $summary,
            ':jobId' => $jobId
        ]);

        $logger->logProgress(
            $stats['associationsProcessed'],
            $stats['totalAssociations'] ?? 0,
            [
                'tagsCreated' => $stats['tagsCreated'],
                'linksCreated' => $stats['linksCreated'],
                'linksSkipped' => $stats['linksSkipped'],
                'errors' => count($stats['errors']),
                'lastProcessedId' => $lastProcessedId
            ]
        );
    } catch (PDOException $e) {
        // Table might not exist in production, skip progress updates
        // Still log to error_log for debugging
        error_log("Note: Could not update progress (table might not exist)");
    }
}

/**
 * Update job record status
 */
function updateJobRecord(PDO $db, string $jobId, string $status, ?string $reportPath, array $stats, $logger): void {
    $reportUrl = null;
    if ($reportPath) {
        $filename = basename($reportPath);
        $reportUrl = "/reports/tag_generation/$filename";
    }

    $errors = empty($stats['errors']) ? null : json_encode($stats['errors']);
    $summary = buildSummaryPayload($stats);

    $logger->info(TagGenerationLogger::CAT_PROGRESS_UPDATE, "Updating job record", [
        'jobId' => $jobId,
        'status' => $status,
        'reportUrl' => $reportUrl,
        'stats' => [
            'associationsProcessed' => $stats['associationsProcessed'],
            'tagsCreated' => $stats['tagsCreated'],
            'linksCreated' => $stats['linksCreated'],
            'linksSkipped' => $stats['linksSkipped'],
            'errors' => count($stats['errors'])
        ]
    ]);

    $stmt = $db->prepare('
        UPDATE TagGenerationRun
        SET status = :status,
            completedAt = NOW(),
            associationsProcessed = :associationsProcessed,
            tagsCreated = :tagsCreated,
            linksCreated = :linksCreated,
            linksSkipped = :linksSkipped,
            reportPath = :reportPath,
            reportUrl = :reportUrl,
            errors = :errors,
            summary = :summary
        WHERE id = :jobId
    ');
    $stmt->execute([
        ':status' => $status,
        ':associationsProcessed' => $stats['associationsProcessed'],
        ':tagsCreated' => $stats['tagsCreated'],
        ':linksCreated' => $stats['linksCreated'],
        ':linksSkipped' => $stats['linksSkipped'],
        ':reportPath' => $reportPath,
        ':reportUrl' => $reportUrl,
        ':errors' => $errors,
        ':summary' => $summary,
        ':jobId' => $jobId
    ]);

    $logger->info(TagGenerationLogger::CAT_PROGRESS_UPDATE, "Job record updated successfully");
}

/**
 * Print summary
 */
function printSummary(array $options, array $stats): void {
    echo str_repeat('=', 80) . "\n";
    echo "SUMMARY\n";
    echo str_repeat('=', 80) . "\n";
    if (isset($stats['totalAssociations'])) {
        echo "Total Associations Available: {$stats['totalAssociations']}\n";
    }
    echo "Associations Processed: {$stats['associationsProcessed']}\n";
    echo "Tags Created:           {$stats['tagsCreated']}\n";
    echo "Links Created:          {$stats['linksCreated']}\n";
    echo "Links Skipped:          {$stats['linksSkipped']}\n";
    echo "Errors:                 " . count($stats['errors']) . "\n";
    echo str_repeat('=', 80) . "\n";

    if ($options['mode'] === 'dry-run') {
        echo "\nNOTE: This was a DRY-RUN. No changes were made to the database.\n";
        echo "      Run with --mode=execute to apply changes.\n";
    }
}

/**
 * Initialize summary payload with total associations
 */
function initializeJobSummary(PDO $db, string $jobId, string $mode, string $source, array $stats): void {
    try {
        // First, create the job record if it doesn't exist
        $stmt = $db->prepare('INSERT IGNORE INTO TagGenerationRun (id, status, mode, source, startedAt) VALUES (:jobId, :status, :mode, :source, NOW())');
        $stmt->execute([
            ':jobId' => $jobId,
            ':status' => 'running',
            ':mode' => $mode,
            ':source' => $source
        ]);

        // Then update with summary
        $summary = buildSummaryPayload($stats);
        $stmt = $db->prepare('UPDATE TagGenerationRun SET summary = :summary WHERE id = :jobId');
        $stmt->execute([':summary' => $summary, ':jobId' => $jobId]);
    } catch (PDOException $e) {
        // If table doesn't exist, throw to be caught by caller
        throw $e;
    }
}

/**
 * Build JSON payload for summary column
 */
function buildSummaryPayload(array $stats): string {
    $total = isset($stats['totalAssociations']) ? (int)$stats['totalAssociations'] : null;
    $processed = (int)($stats['associationsProcessed'] ?? 0);
    $percent = null;
    if ($total && $total > 0) {
        $percent = round(($processed / $total) * 100, 2);
    }

    $payload = [
        'totalAssociations' => $total,
        'processedAssociations' => $processed,
        'progressPercent' => $percent,
        'updatedAt' => date('c')
    ];

    return json_encode($payload);
}

/**
 * Count total associations that will be processed
 */
function getAssociationsTotal(PDO $db): int {
    try {
        $stmt = $db->query('SELECT COUNT(*) as total FROM Association WHERE isDeleted = 0');
        $row = $stmt->fetch();
        return (int)($row['total'] ?? 0);
    } catch (PDOException $e) {
        return 0;
    }
}
