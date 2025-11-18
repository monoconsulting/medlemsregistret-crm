<?php
/**
 * Tag Generation Logs API
 *
 * GET /api/tag_generation_logs.php?jobId=xxx
 *   - Get all logs for a specific job
 *   - Optional: &level=ERROR (filter by level)
 *   - Optional: &category=TAG_MATCH (filter by category)
 *   - Optional: &limit=100&offset=0 (pagination)
 *   - Returns: { items: [...], total, limit, offset }
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// All operations require authentication
require_auth();

// Only GET is supported
if ($method !== 'GET') {
    json_out(405, ['error' => 'Method not allowed']);
}

// Get jobId
$jobId = $_GET['jobId'] ?? '';
if (empty($jobId)) {
    json_out(400, ['error' => 'Missing required parameter: jobId']);
}

// Verify job exists and user has access
$job = get_job($jobId);
if (!$job) {
    json_out(404, ['error' => 'Job not found']);
}

// Get filters
$level = $_GET['level'] ?? null;
$category = $_GET['category'] ?? null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

// Ensure reasonable limits
if ($limit < 1) $limit = 100;
if ($limit > 1000) $limit = 1000;
if ($offset < 0) $offset = 0;

// Build query
$conditions = ['jobId = ?'];
$types = 's';
$params = [$jobId];

if ($level !== null && $level !== '') {
    $conditions[] = 'level = ?';
    $types .= 's';
    $params[] = $level;
}

if ($category !== null && $category !== '') {
    $conditions[] = 'category = ?';
    $types .= 's';
    $params[] = $category;
}

$whereClause = implode(' AND ', $conditions);

// Get total count
$countQuery = "SELECT COUNT(*) as total FROM TagGenerationLog WHERE $whereClause";
$countStmt = db()->prepare($countQuery);
$countStmt->bind_param($types, ...$params);
$countStmt->execute();
$total = (int)$countStmt->get_result()->fetch_assoc()['total'];

// Get logs
$query = "
    SELECT id, jobId, timestamp, level, category, message, data
    FROM TagGenerationLog
    WHERE $whereClause
    ORDER BY timestamp ASC
    LIMIT ? OFFSET ?
";

$types .= 'ii';
$params[] = $limit;
$params[] = $offset;

$stmt = db()->prepare($query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$items = [];
while ($row = $result->fetch_assoc()) {
    // Parse JSON data field
    $data = null;
    if ($row['data'] !== null) {
        $data = json_decode($row['data'], true);
    }

    $items[] = [
        'id' => $row['id'],
        'jobId' => $row['jobId'],
        'timestamp' => $row['timestamp'],
        'level' => $row['level'],
        'category' => $row['category'],
        'message' => $row['message'],
        'data' => $data
    ];
}

json_out(200, [
    'items' => $items,
    'total' => $total,
    'limit' => $limit,
    'offset' => $offset,
    'job' => [
        'id' => $job['id'],
        'mode' => $job['mode'],
        'source' => $job['source'],
        'status' => $job['status'],
        'startedAt' => $job['startedAt'],
        'completedAt' => $job['completedAt']
    ]
]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get job by ID
 */
function get_job(string $jobId): ?array {
    $stmt = db()->prepare('
        SELECT id, status, mode, source, startedAt, completedAt, triggeredBy, triggeredByName
        FROM TagGenerationRun
        WHERE id = ?
    ');
    $stmt->bind_param('s', $jobId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    return $row ?: null;
}
