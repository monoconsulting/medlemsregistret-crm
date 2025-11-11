<?php
/**
 * Tag Taxonomy API
 *
 * GET /api/tag_taxonomy.php?category=sport
 *   - List all aliases (optionally filtered by category)
 *   - Returns: { items: [ { id, alias, canonical, category, createdAt }, ... ] }
 *
 * POST /api/tag_taxonomy.php
 *   - Create new alias mapping
 *   - Body: { alias, canonical, category? }
 *   - Returns: { id }
 *
 * DELETE /api/tag_taxonomy.php?id=xxx
 *   - Delete alias mapping
 *   - Returns: { success: true }
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// All operations require authentication
require_auth();

// Only admins can manage taxonomy
ensure_taxonomy_admin();

// === GET HANDLER (List Aliases) ===

if ($method === 'GET') {
  handle_list_aliases();
}

// === POST HANDLER (Create Alias) ===

if ($method === 'POST') {
  require_csrf();
  rate_limit('tag-taxonomy-write', 20, 60); // Max 20 writes per minute

  $body = read_json();
  handle_create_alias($body);
}

// === DELETE HANDLER (Delete Alias) ===

if ($method === 'DELETE') {
  require_csrf();
  rate_limit('tag-taxonomy-write', 20, 60);

  $id = $_GET['id'] ?? '';
  handle_delete_alias($id);
}

json_out(405, ['error' => 'Method not allowed']);

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * List all aliases, optionally filtered by category
 */
function handle_list_aliases(): void {
  $category = $_GET['category'] ?? null;

  $sql = 'SELECT id, alias, canonical, category, createdAt FROM TagAlias';
  $params = [];
  $types = '';

  if ($category !== null && $category !== '') {
    $sql .= ' WHERE category = ?';
    $params[] = $category;
    $types = 's';
  }

  $sql .= ' ORDER BY canonical ASC, alias ASC';

  $stmt = db()->prepare($sql);
  if ($category !== null && $category !== '') {
    $stmt->bind_param($types, ...$params);
  }
  $stmt->execute();
  $result = $stmt->get_result();

  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }

  json_out(200, [
    'items' => $items,
    'total' => count($items)
  ]);
}

/**
 * Create a new alias mapping
 */
function handle_create_alias(array $body): void {
  $alias = isset($body['alias']) ? trim($body['alias']) : '';
  $canonical = isset($body['canonical']) ? trim($body['canonical']) : '';
  $category = isset($body['category']) ? trim($body['category']) : null;

  // Validate required fields
  if ($alias === '' || $canonical === '') {
    json_out(400, ['error' => 'Both alias and canonical are required']);
  }

  // Normalize to lowercase for consistency
  $alias = mb_strtolower($alias, 'UTF-8');
  $canonical = mb_strtolower($canonical, 'UTF-8');
  if ($category) {
    $category = mb_strtolower($category, 'UTF-8');
  }

  // Check if alias already exists
  $stmt = db()->prepare('SELECT id FROM TagAlias WHERE alias = ?');
  $stmt->bind_param('s', $alias);
  $stmt->execute();
  if ($stmt->get_result()->num_rows > 0) {
    json_out(400, ['error' => 'Alias already exists']);
  }

  // Get current user
  $user = get_taxonomy_user();

  // Create new alias
  $id = generate_id();

  $stmt = db()->prepare('
    INSERT INTO TagAlias (id, alias, canonical, category, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, NOW())
  ');
  $stmt->bind_param('sssss', $id, $alias, $canonical, $category, $user['id']);

  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Failed to create alias']);
  }

  // Log event
  log_event('api', 'tag-taxonomy.created', [
    'id' => $id,
    'alias' => $alias,
    'canonical' => $canonical,
    'category' => $category
  ]);

  json_out(200, [
    'id' => $id,
    'alias' => $alias,
    'canonical' => $canonical,
    'category' => $category
  ]);
}

/**
 * Delete an alias mapping
 */
function handle_delete_alias(string $id): void {
  if ($id === '') {
    json_out(400, ['error' => 'ID is required']);
  }

  // Check if alias exists
  $stmt = db()->prepare('SELECT alias FROM TagAlias WHERE id = ?');
  $stmt->bind_param('s', $id);
  $stmt->execute();
  $result = $stmt->get_result();

  if ($result->num_rows === 0) {
    json_out(404, ['error' => 'Alias not found']);
  }

  $alias = $result->fetch_assoc()['alias'];

  // Delete the alias
  $stmt = db()->prepare('DELETE FROM TagAlias WHERE id = ?');
  $stmt->bind_param('s', $id);

  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Failed to delete alias']);
  }

  // Log event
  log_event('api', 'tag-taxonomy.deleted', [
    'id' => $id,
    'alias' => $alias
  ]);

  json_out(200, ['success' => true]);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure user has admin role for taxonomy management
 */
function ensure_taxonomy_admin(): void {
  if (!isset($_SESSION['user'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }

  $user = $_SESSION['user'];

  if (!isset($user['role']) || $user['role'] !== 'ADMIN') {
    json_out(403, ['error' => 'Admin role required for taxonomy management']);
  }
}

/**
 * Get current user for taxonomy operations
 */
function get_taxonomy_user(): array {
  if (!isset($_SESSION['user'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }

  return $_SESSION['user'];
}
