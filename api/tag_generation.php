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
  rate_limit('tag-generation', 5, 3600); // Max 5 runs per hour

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

  // Build command to execute PHP script
  $projectRoot = realpath(__DIR__ . '/..');
  $scriptPath = $projectRoot . '/scripts/populate_tags_v2.php';

  // Check if script exists
  if (!file_exists($scriptPath)) {
    log_event('api', 'tag-generation.script-not-found', [
      'jobId' => $jobId,
      'scriptPath' => $scriptPath
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

  // Build command with proper escaping
  $phpCmd = 'php ' . escapeshellarg($scriptPath) .
            ' --mode=' . escapeshellarg($mode) .
            ' --source=' . escapeshellarg($source) .
            ' --job-id=' . escapeshellarg($jobId);

  // Execute in background
  if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Windows: use start /B for background execution
    $cmd = 'start /B ' . $phpCmd . ' > nul 2>&1';
    pclose(popen($cmd, 'r'));
  } else {
    // Linux/Mac: use & for background
    $cmd = $phpCmd . ' > /dev/null 2>&1 &';
    exec($cmd);
  }

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
  $row['summary'] = $row['summary'] ? json_decode($row['summary'], true) : null;
  $row['errors'] = $row['errors'] ? json_decode($row['errors'], true) : [];

  // Convert integer fields
  $row['associationsProcessed'] = (int)$row['associationsProcessed'];
  $row['tagsCreated'] = (int)$row['tagsCreated'];
  $row['linksCreated'] = (int)$row['linksCreated'];
  $row['linksSkipped'] = (int)$row['linksSkipped'];

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
      triggeredByName, reportUrl
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
  if (!isset($_SESSION['user'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }

  return $_SESSION['user'];
}

/**
 * Ensure user has admin role for tag generation
 */
function ensure_tag_gen_admin(): void {
  $user = get_tag_gen_user();

  if (!isset($_SESSION['role']) || $user['role'] !== 'ADMIN') {
    json_out(403, ['error' => 'Admin role required']);
  }
}
