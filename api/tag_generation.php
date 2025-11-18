<?php
/**
 * Tag Generation API
 *
 * POST /api/tag_generation.php
 *   - Trigger tag generation job
 *   - Body: { mode: "dry-run" | "execute", source: "db:baseline" | "db:types" | "db:activities" | "db:categories" }
 *   - Returns: { jobId, status, message }
 *
 * GET /api/tag_generation.php?jobId=xxx
 *   - Get status of running/completed job
 *   - Returns: { id, status, mode, source, statistics, reportUrl, ... }
 *
 * GET /api/tag_generation.php?action=reports&limit=50&offset=0
 *   - List all generation runs
 *   - Returns: { items: [...] }
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// Optional logger - load if available
if (file_exists(__DIR__ . '/lib/tag_generation_logger.php')) {
  require_once __DIR__ . '/lib/tag_generation_logger.php';
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

// Create a safe logger wrapper
class SafeLogger {
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
        error_log("Logger error: " . $e->getMessage());
      }
    }
    return null;
  }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// All operations require authentication
require_auth();

// === GET HANDLERS ===

if ($method === 'GET') {
  $action = $_GET['action'] ?? 'status';

  if ($action === 'reports') {
    handle_list_reports();
  } else if (isset($_GET['jobId'])) {
    handle_get_status($_GET['jobId']);
  } else {
    json_out(400, ['error' => 'Missing jobId or action parameter']);
  }
}

// === POST HANDLER (Trigger Generation) ===

if ($method === 'POST') {
  // Only admins can trigger tag generation
  ensure_tag_gen_admin();

  require_csrf();
  rate_limit('tag-generation', 220, 3600); // Max 20 runs per hour (development)

  $body = read_json();
  handle_trigger_generation($body);
}

json_out(405, ['error' => 'Method not allowed']);

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * Trigger a new tag generation job
 */
function handle_trigger_generation(array $body): void {
  $mode = $body['mode'] ?? 'dry-run';
  $source = $body['source'] ?? 'db:baseline';

  // Validate mode
  if (!in_array($mode, ['dry-run', 'execute'])) {
    json_out(400, ['error' => 'Invalid mode. Must be "dry-run" or "execute"']);
  }

  // Validate source
  $validSources = ['db:baseline', 'db:types', 'db:activities', 'db:categories'];
  if (!in_array($source, $validSources)) {
    json_out(400, ['error' => 'Invalid source. Must be one of: ' . implode(', ', $validSources)]);
  }

  // Get current user
  $user = get_tag_gen_user();

  // Generate job ID
  $jobId = generate_id();

  // Create job record in database
  $stmt = db()->prepare('
    INSERT INTO TagGenerationRun
    (id, status, mode, source, startedAt, triggeredBy, triggeredByName)
    VALUES (?, "running", ?, ?, NOW(), ?, ?)
  ');
  $stmt->bind_param('sssss', $jobId, $mode, $source, $user['id'], $user['name']);

  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Failed to create job record']);
  }

  // Initialize logger (safe - won't crash if not available)
  $logger = new SafeLogger(db(), $jobId);
  $logger->info(TagGenerationLogger::CAT_INIT, 'Tag generation job created', [
    'jobId' => $jobId,
    'mode' => $mode,
    'source' => $source,
    'triggeredBy' => $user['name'],
    'triggeredById' => $user['id']
  ]);

  // Build command to execute PHP script
  $projectRoot = realpath(__DIR__ . '/..');
  $logger->debug(TagGenerationLogger::CAT_INIT, 'Attempting to resolve project root', [
    '__DIR__' => __DIR__,
    'projectRoot' => $projectRoot
  ]);

  // Handle case where realpath fails
  if ($projectRoot === false) {
    $logger->error(TagGenerationLogger::CAT_ERROR, 'Failed to resolve project root path', [
      '__DIR__' => __DIR__
    ]);

    log_event('api', 'tag-generation.realpath-failed', [
      'jobId' => $jobId,
      '__DIR__' => __DIR__
    ]);

    // Update job as failed
    $stmt = db()->prepare('
      UPDATE TagGenerationRun
      SET status = "failed", completedAt = NOW(),
          errors = JSON_ARRAY("Failed to resolve project root path")
      WHERE id = ?
    ');
    $stmt->bind_param('s', $jobId);
    $stmt->execute();

    json_out(500, [
      'error' => 'Failed to resolve project root path',
      'jobId' => $jobId,
      'status' => 'failed'
    ]);
  }

  // Use forward slashes - works on both Windows and Linux
  $scriptPath = $projectRoot . '/scripts/populate_tags_v2.php';

  // Extensive debugging for path resolution
  $pathDebugInfo = [
    '__DIR__' => __DIR__,
    'projectRoot' => $projectRoot,
    'scriptPath' => $scriptPath,
    'file_exists' => file_exists($scriptPath),
    'is_file' => is_file($scriptPath),
    'is_readable' => is_readable($scriptPath),
    'realpath_script' => realpath($scriptPath),
    'PHP_OS' => PHP_OS,
    'DIRECTORY_SEPARATOR' => DIRECTORY_SEPARATOR
  ];

  $logger->debug(TagGenerationLogger::CAT_INIT, 'Script path resolution', $pathDebugInfo);

  error_log("TAG_GEN_DEBUG: __DIR__ = " . __DIR__);
  error_log("TAG_GEN_DEBUG: projectRoot = " . var_export($projectRoot, true));
  error_log("TAG_GEN_DEBUG: scriptPath = " . $scriptPath);
  error_log("TAG_GEN_DEBUG: file_exists() = " . (file_exists($scriptPath) ? 'YES' : 'NO'));
  error_log("TAG_GEN_DEBUG: is_file() = " . (is_file($scriptPath) ? 'YES' : 'NO'));
  error_log("TAG_GEN_DEBUG: is_readable() = " . (is_readable($scriptPath) ? 'YES' : 'NO'));
  error_log("TAG_GEN_DEBUG: realpath(scriptPath) = " . var_export(realpath($scriptPath), true));
  error_log("TAG_GEN_DEBUG: PHP_OS = " . PHP_OS);
  error_log("TAG_GEN_DEBUG: DIRECTORY_SEPARATOR = " . DIRECTORY_SEPARATOR);

  // Also log to event system
  log_event('api', 'tag-generation.debug-paths', array_merge(['jobId' => $jobId], $pathDebugInfo));

  // Check if script exists
  if (!file_exists($scriptPath)) {
    $logger->error(TagGenerationLogger::CAT_ERROR, 'Script file not found', [
      'scriptPath' => $scriptPath,
      'projectRoot' => $projectRoot,
      'attempted_paths' => [
        $scriptPath,
        realpath($scriptPath)
      ]
    ]);

    log_event('api', 'tag-generation.script-not-found', [
      'jobId' => $jobId,
      'scriptPath' => $scriptPath,
      'projectRoot' => $projectRoot,
      '__DIR__' => __DIR__
    ]);

    // Update job as failed
    $stmt = db()->prepare('
      UPDATE TagGenerationRun
      SET status = "failed", completedAt = NOW(),
          errors = JSON_ARRAY("Script file not found")
      WHERE id = ?
    ');
    $stmt->bind_param('s', $jobId);
    $stmt->execute();

    json_out(500, [
      'error' => 'Tag generation script not found',
      'jobId' => $jobId,
      'status' => 'failed'
    ]);
  }

  $logger->info(TagGenerationLogger::CAT_INIT, 'Script file found and readable', [
    'scriptPath' => $scriptPath
  ]);

  // Build command with proper escaping
  $phpCmd = 'php ' . escapeshellarg($scriptPath) .
            ' --mode=' . escapeshellarg($mode) .
            ' --source=' . escapeshellarg($source) .
            ' --job-id=' . escapeshellarg($jobId);

  $logger->info(TagGenerationLogger::CAT_INIT, 'Building background command', [
    'phpCmd' => $phpCmd,
    'mode' => $mode,
    'source' => $source,
    'OS' => PHP_OS
  ]);

  // Execute in background
  if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Windows: use start /B for background execution
    $cmd = 'start /B ' . $phpCmd . ' > nul 2>&1';
    $logger->debug(TagGenerationLogger::CAT_INIT, 'Executing command on Windows', [
      'cmd' => $cmd
    ]);
    pclose(popen($cmd, 'r'));
  } else {
    // Linux/Mac: use & for background
    $cmd = $phpCmd . ' > /dev/null 2>&1 &';
    $logger->debug(TagGenerationLogger::CAT_INIT, 'Executing command on Unix', [
      'cmd' => $cmd
    ]);
    exec($cmd);
  }

  $logger->info(TagGenerationLogger::CAT_INIT, 'Background script started successfully', [
    'jobId' => $jobId
  ]);

  // Log event
  log_event('api', 'tag-generation.triggered', [
    'jobId' => $jobId,
    'mode' => $mode,
    'source' => $source,
    'userId' => $user['id']
  ]);

  // Return job info
  json_out(200, [
    'jobId' => $jobId,
    'status' => 'running',
    'mode' => $mode,
    'source' => $source,
    'message' => 'Tag generation started successfully'
  ]);
}

/**
 * Get status of a specific job
 */
function handle_get_status(string $jobId): void {
  if ($jobId === '') {
    json_out(400, ['error' => 'Job ID is required']);
  }

  $stmt = db()->prepare('
    SELECT
      id, status, mode, source, startedAt, completedAt,
      associationsProcessed, tagsCreated, linksCreated, linksSkipped,
      reportPath, reportUrl, summary, errors,
      triggeredBy, triggeredByName
    FROM TagGenerationRun
    WHERE id = ?
  ');
  $stmt->bind_param('s', $jobId);
  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result->fetch_assoc();

  if (!$row) {
    json_out(404, ['error' => 'Job not found']);
  }

  // Parse JSON fields
  $summary = $row['summary'] ? json_decode($row['summary'], true) : null;
  $row['summary'] = $summary;
  $row['errors'] = $row['errors'] ? json_decode($row['errors'], true) : [];

  // Convert integer fields
  $row['associationsProcessed'] = (int)$row['associationsProcessed'];
  $row['tagsCreated'] = (int)$row['tagsCreated'];
  $row['linksCreated'] = (int)$row['linksCreated'];
  $row['linksSkipped'] = (int)$row['linksSkipped'];
  $row['totalAssociations'] = isset($summary['totalAssociations']) ? (int)$summary['totalAssociations'] : null;
  $row['progressPercent'] = isset($summary['progressPercent']) ? (float)$summary['progressPercent'] : null;

  json_out(200, $row);
}

/**
 * List all tag generation runs
 */
function handle_list_reports(): void {
  $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
  $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

  // Ensure reasonable limits
  if ($limit < 1) $limit = 50;
  if ($limit > 200) $limit = 200;
  if ($offset < 0) $offset = 0;

  $stmt = db()->prepare('
    SELECT
      id, status, mode, source, startedAt, completedAt,
      associationsProcessed, tagsCreated, linksCreated, linksSkipped,
      triggeredByName, reportUrl, summary
    FROM TagGenerationRun
    ORDER BY startedAt DESC
    LIMIT ? OFFSET ?
  ');
  $stmt->bind_param('ii', $limit, $offset);
  $stmt->execute();
  $result = $stmt->get_result();

  $items = [];
  while ($row = $result->fetch_assoc()) {
    // Convert integer fields
    $row['associationsProcessed'] = (int)$row['associationsProcessed'];
    $row['tagsCreated'] = (int)$row['tagsCreated'];
    $row['linksCreated'] = (int)$row['linksCreated'];
    $row['linksSkipped'] = (int)$row['linksSkipped'];

    $summary = $row['summary'] ? json_decode($row['summary'], true) : null;
    $row['summary'] = $summary;
    $row['totalAssociations'] = isset($summary['totalAssociations']) ? (int)$summary['totalAssociations'] : null;
    $row['progressPercent'] = isset($summary['progressPercent']) ? (float)$summary['progressPercent'] : null;

    $items[] = $row;
  }

  // Get total count
  $countStmt = db()->query('SELECT COUNT(*) as total FROM TagGenerationRun');
  $total = (int)$countStmt->fetch_assoc()['total'];

  json_out(200, [
    'items' => $items,
    'total' => $total,
    'limit' => $limit,
    'offset' => $offset
  ]);
}

/**
 * Get current authenticated user
 */
function get_tag_gen_user(): array {
  if (!isset($_SESSION['uid']) || empty($_SESSION['uid'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }

  $userId = (string)$_SESSION['uid'];

  // Fetch user data from database
  $stmt = db()->prepare('SELECT id, name, email, role FROM User WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $userId);
  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result ? $result->fetch_assoc() : null;
  $stmt->close();

  if (!$row) {
    json_out(401, ['error' => 'User not found']);
  }

  return [
    'id' => (string)$row['id'],
    'name' => $row['name'] ?? '',
    'email' => $row['email'] ?? '',
    'role' => strtoupper((string)($row['role'] ?? 'USER')),
  ];
}

/**
 * Ensure user has admin role for tag generation
 */
function ensure_tag_gen_admin(): void {
  $user = get_tag_gen_user();

  if ($user['role'] !== 'ADMIN') {
    json_out(403, ['error' => 'Admin role required']);
  }
}
