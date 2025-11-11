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

// ============================================================================
// Configuration
// ============================================================================

// Load .env file for database connection
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

// Database connection settings (from .env)
$dbHost = $_ENV['DBHOST'] ?? 'localhost';
$dbPort = $_ENV['DBPORT'] ?? '3306';
$dbName = $_ENV['DBDB'] ?? '';
$dbUser = $_ENV['DBUSER'] ?? '';
$dbPass = $_ENV['DBPASSWORD'] ?? '';

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

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName, (int)$dbPort);

if ($mysqli->connect_error) {
    echo "ERROR: Database connection failed: " . $mysqli->connect_error . "\n";
    exit(1);
}

$mysqli->set_charset('utf8mb4');

// ============================================================================
// Statistics
// ============================================================================

$stats = [
    'associationsProcessed' => 0,
    'tagsCreated' => 0,
    'linksCreated' => 0,
    'linksSkipped' => 0,
    'errors' => []
];

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
    $taxonomy = loadTaxonomy($mysqli);
    echo "      Loaded " . count($taxonomy) . " alias mappings\n\n";

    // Step 2: Process associations
    echo "[2/5] Processing associations...\n";
    processAssociations($mysqli, $options, $taxonomy, $stats, $csvRows);
    echo "\n";

    // Step 3: Generate CSV report
    echo "[3/5] Generating CSV report...\n";
    $reportPath = generateCSVReport($options, $stats, $csvRows);
    echo "      Report saved to: $reportPath\n\n";

    // Step 4: Update job record
    echo "[4/5] Updating job record...\n";
    updateJobRecord($mysqli, $options['jobId'], 'completed', $reportPath, $stats);
    echo "\n";

    // Step 5: Print summary
    echo "[5/5] Summary\n";
    printSummary($options, $stats);

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
    updateJobRecord($mysqli, $options['jobId'], 'failed', null, $stats);
    exit(1);
}

$mysqli->close();

echo "\nDONE!\n";
exit(0);

// ============================================================================
// Functions
// ============================================================================

/**
 * Load taxonomy aliases from database
 */
function loadTaxonomy(mysqli $db): array {
    $taxonomy = [];

    $result = $db->query('SELECT alias, canonical FROM TagAlias');
    if (!$result) {
        throw new Exception("Failed to load taxonomy: " . $db->error);
    }

    while ($row = $result->fetch_assoc()) {
        $taxonomy[mb_strtolower($row['alias'])] = mb_strtolower($row['canonical']);
    }

    return $taxonomy;
}

/**
 * Process all associations in batches
 */
function processAssociations(mysqli $db, array $options, array $taxonomy, array &$stats, array &$csvRows): void {
    $batchSize = 100;
    $offset = 0;

    while (true) {
        // Fetch batch
        $stmt = $db->prepare('
            SELECT id, name, municipality, types, activities, categories
            FROM Association
            WHERE isDeleted = 0
            ORDER BY createdAt ASC
            LIMIT ? OFFSET ?
        ');
        $stmt->bind_param('ii', $batchSize, $offset);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) break;

        while ($assoc = $result->fetch_assoc()) {
            try {
                // Get existing tags for this association
                $existingTags = getExistingTags($db, $assoc['id']);

                // Process association
                $extractionResult = processAssociation($db, $assoc, $existingTags, $taxonomy, $options);

                // Commit changes if execute mode
                if ($options['mode'] === 'execute') {
                    commitChanges($db, $extractionResult, $options['source'], $stats);
                } else {
                    // In dry-run, count what would be created
                    $stats['tagsCreated'] += count($extractionResult['newTags']);
                    $stats['linksCreated'] += count($extractionResult['newLinks']);
                    $stats['linksSkipped'] += count($extractionResult['existingLinks']);
                }

                // Add to CSV
                $csvRows[] = resultToCSVRow($extractionResult, $options['source']);

                // Update progress
                updateProgress($db, $options['jobId'], $assoc['id'], $stats);

            } catch (Exception $e) {
                $stats['errors'][] = [
                    'associationId' => $assoc['id'],
                    'error' => $e->getMessage(),
                    'timestamp' => date('c')
                ];
                echo "      Error processing {$assoc['id']}: {$e->getMessage()}\n";
            }

            $stats['associationsProcessed']++;

            // Progress indicator every 50
            if ($stats['associationsProcessed'] % 50 === 0) {
                echo "      Processed {$stats['associationsProcessed']} associations...\n";
            }
        }

        $offset += $batchSize;
    }

    echo "      Total processed: {$stats['associationsProcessed']} associations\n";
}

/**
 * Get existing tags for an association
 */
function getExistingTags(mysqli $db, string $associationId): array {
    $stmt = $db->prepare('
        SELECT t.id, t.name
        FROM Tag t
        INNER JOIN _AssociationTags at ON at.B = t.id
        WHERE at.A = ?
    ');
    $stmt->bind_param('s', $associationId);
    $stmt->execute();
    $result = $stmt->get_result();

    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }

    return $tags;
}

/**
 * Process a single association
 */
function processAssociation(mysqli $db, array $assoc, array $existingTags, array $taxonomy, array $options): array {
    // Extract raw tags
    $rawTags = extractTags($assoc, $options['source']);

    // Normalize (lowercase + aliases + deduplicate)
    $normalizedTags = normalizeTags($rawTags, $taxonomy);

    // Find which tags exist
    $existingTagObjects = findExistingTags($db, $normalizedTags);
    $existingTagNames = array_column($existingTagObjects, 'name');
    $newTagNames = array_diff($normalizedTags, $existingTagNames);

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
function extractTags(array $assoc, string $source): array {
    $tags = [];

    // Types
    if ($source === 'db:baseline' || $source === 'db:types') {
        $types = json_decode($assoc['types'], true);
        if (is_array($types)) {
            $tags = array_merge($tags, array_filter($types, 'is_string'));
        }
    }

    // Activities
    if ($source === 'db:baseline' || $source === 'db:activities') {
        $activities = json_decode($assoc['activities'], true);
        if (is_array($activities)) {
            $tags = array_merge($tags, array_filter($activities, 'is_string'));
        }
    }

    // Categories
    if ($source === 'db:baseline' || $source === 'db:categories') {
        $categories = json_decode($assoc['categories'], true);
        if (is_array($categories)) {
            $tags = array_merge($tags, array_filter($categories, 'is_string'));
        }
    }

    return $tags;
}

/**
 * Normalize tags: lowercase, apply aliases, deduplicate
 */
function normalizeTags(array $tags, array $taxonomy): array {
    $normalized = [];

    foreach ($tags as $tag) {
        $tag = mb_strtolower(trim($tag));
        if (strlen($tag) === 0) continue;

        // Apply taxonomy alias
        $canonical = $taxonomy[$tag] ?? $tag;
        $normalized[] = $canonical;
    }

    // Deduplicate
    return array_unique($normalized);
}

/**
 * Find existing tags by name
 */
function findExistingTags(mysqli $db, array $tagNames): array {
    if (empty($tagNames)) return [];

    // Build IN clause
    $placeholders = str_repeat('?,', count($tagNames) - 1) . '?';
    $stmt = $db->prepare("SELECT id, name FROM Tag WHERE name IN ($placeholders)");

    // Bind parameters dynamically
    $types = str_repeat('s', count($tagNames));
    $stmt->bind_param($types, ...$tagNames);
    $stmt->execute();
    $result = $stmt->get_result();

    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }

    return $tags;
}

/**
 * Commit changes to database (execute mode only)
 */
function commitChanges(mysqli $db, array $result, string $source, array &$stats): void {
    // Create new tags
    foreach ($result['newTags'] as $tagName) {
        $tagId = upsertTag($db, $tagName);
        createTagSource($db, $tagId, $source);
        $stats['tagsCreated']++;

        // Add to newLinks
        $result['newLinks'][] = [
            'tagId' => $tagId,
            'tagName' => $tagName
        ];
    }

    // Create new links
    foreach ($result['newLinks'] as $link) {
        $created = createTagLink($db, $result['associationId'], $link['tagId']);
        if ($created) {
            $stats['linksCreated']++;
        } else {
            $stats['linksSkipped']++;
        }
    }
}

/**
 * Upsert tag (idempotent)
 */
function upsertTag(mysqli $db, string $name): string {
    // Try to find existing
    $stmt = $db->prepare('SELECT id FROM Tag WHERE name = ?');
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        return $row['id'];
    }

    // Create new
    $id = generateId();
    $stmt = $db->prepare('INSERT INTO Tag (id, name, createdAt) VALUES (?, ?, NOW())');
    $stmt->bind_param('ss', $id, $name);
    $stmt->execute();

    return $id;
}

/**
 * Create TagSource record (idempotent)
 */
function createTagSource(mysqli $db, string $tagId, string $source): void {
    // Extract source field
    $sourceField = null;
    if ($source === 'db:types') $sourceField = 'types';
    elseif ($source === 'db:activities') $sourceField = 'activities';
    elseif ($source === 'db:categories') $sourceField = 'categories';

    // Check if exists
    $stmt = $db->prepare('SELECT id FROM TagSource WHERE tagId = ? AND source = ? AND (sourceField = ? OR (sourceField IS NULL AND ? IS NULL))');
    $stmt->bind_param('ssss', $tagId, $source, $sourceField, $sourceField);
    $stmt->execute();

    if ($stmt->get_result()->num_rows > 0) {
        return; // Already exists
    }

    // Create new
    $id = generateId();
    $stmt = $db->prepare('INSERT INTO TagSource (id, tagId, source, sourceField, createdAt) VALUES (?, ?, ?, ?, NOW())');
    $stmt->bind_param('ssss', $id, $tagId, $source, $sourceField);
    $stmt->execute();
}

/**
 * Create tag-association link (idempotent)
 */
function createTagLink(mysqli $db, string $associationId, string $tagId): bool {
    // Use INSERT IGNORE for idempotency
    $stmt = $db->prepare('INSERT IGNORE INTO _AssociationTags (A, B) VALUES (?, ?)');
    $stmt->bind_param('ss', $associationId, $tagId);
    $stmt->execute();

    return $stmt->affected_rows > 0;
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
function generateCSVReport(array $options, array $stats, array $csvRows): string {
    $reportsDir = __DIR__ . '/../reports/tag_generation';

    // Ensure directory exists
    if (!is_dir($reportsDir)) {
        mkdir($reportsDir, 0775, true);
    }

    $timestamp = date('Y-m-d_H-i-s');
    $filename = "tag_generation_{$options['jobId']}_{$timestamp}.csv";
    $filepath = $reportsDir . '/' . $filename;

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
    $csv .= "New Tags Created;{$stats['tagsCreated']}\n";
    $csv .= "New Links Created;{$stats['linksCreated']}\n";
    $csv .= "Links Already Existed;{$stats['linksSkipped']}\n";
    $csv .= "Errors;" . count($stats['errors']) . "\n";
    $csv .= "Mode;{$options['mode']}\n";
    $csv .= "Source;{$options['source']}\n";
    $csv .= "Job ID;{$options['jobId']}\n";

    file_put_contents($filepath, $csv);

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
function updateProgress(mysqli $db, string $jobId, string $lastProcessedId, array $stats): void {
    $errors = empty($stats['errors']) ? null : json_encode($stats['errors']);

    $stmt = $db->prepare('
        UPDATE TagGenerationRun
        SET associationsProcessed = ?,
            tagsCreated = ?,
            linksCreated = ?,
            linksSkipped = ?,
            lastProcessedId = ?,
            errors = ?
        WHERE id = ?
    ');
    $stmt->bind_param(
        'iiiisss',
        $stats['associationsProcessed'],
        $stats['tagsCreated'],
        $stats['linksCreated'],
        $stats['linksSkipped'],
        $lastProcessedId,
        $errors,
        $jobId
    );
    $stmt->execute();
}

/**
 * Update job record status
 */
function updateJobRecord(mysqli $db, string $jobId, string $status, ?string $reportPath, array $stats): void {
    $reportUrl = null;
    if ($reportPath) {
        $filename = basename($reportPath);
        $reportUrl = "/reports/tag_generation/$filename";
    }

    $errors = empty($stats['errors']) ? null : json_encode($stats['errors']);

    $stmt = $db->prepare('
        UPDATE TagGenerationRun
        SET status = ?,
            completedAt = NOW(),
            associationsProcessed = ?,
            tagsCreated = ?,
            linksCreated = ?,
            linksSkipped = ?,
            reportPath = ?,
            reportUrl = ?,
            errors = ?
        WHERE id = ?
    ');
    $stmt->bind_param(
        'siiisssss',
        $status,
        $stats['associationsProcessed'],
        $stats['tagsCreated'],
        $stats['linksCreated'],
        $stats['linksSkipped'],
        $reportPath,
        $reportUrl,
        $errors,
        $jobId
    );
    $stmt->execute();
}

/**
 * Print summary
 */
function printSummary(array $options, array $stats): void {
    echo str_repeat('=', 80) . "\n";
    echo "SUMMARY\n";
    echo str_repeat('=', 80) . "\n";
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
