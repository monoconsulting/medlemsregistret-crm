<?php
/**
 * Tags endpoint
 *
 * GET:
 *   - List tags.
 * POST:
 *   - Create tag: { name }
 *   - Attach: { action: "attach", associationId, tagId }
 *   - Detach: { action: "detach", associationId, tagId }
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  require_auth();
  $res = db()->query('SELECT id, CONVERT(name USING utf8mb4) AS name FROM Tag ORDER BY name ASC');
  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'name' => normalize_utf8($row['name'] ?? null) ?? '',
    ];
  }
  log_event('api', 'tags.list', ['count' => count($items)]);
  json_out(200, ['items' => $items]);
}

require_auth();
require_csrf();
rate_limit('tags-write', 20, 60);

$body = read_json();
$action = isset($body['action']) ? (string)$body['action'] : '';

if ($method === 'POST' && $action === '') {
  $name = normalize_nullable_string($body['name'] ?? null, 120);
  if ($name === '') json_out(400, ['error' => 'Missing tag name']);
  $id = generate_id();
  $stmt = db()->prepare('INSERT INTO Tag (id, name) VALUES (?, ?)');
  $stmt->bind_param('ss', $id, $name);
  $stmt->execute();
  log_event('api', 'tags.created', ['id' => $id]);
  json_out(200, ['id' => $id]);
}

if ($method === 'POST' && ($action === 'attach' || $action === 'detach')) {
  $assocId = isset($body['associationId']) ? trim((string)$body['associationId']) : '';
  $tagId   = isset($body['tagId']) ? trim((string)$body['tagId']) : '';
  if ($assocId === '' || $tagId === '') json_out(400, ['error' => 'associationId and tagId are required']);

  if ($action === 'attach') {
    $stmt = db()->prepare('INSERT IGNORE INTO _AssociationTags (A, B) VALUES (?, ?)');
    $stmt->bind_param('ss', $assocId, $tagId);
    $stmt->execute();
    log_event('api', 'tags.attached', ['associationId' => $assocId, 'tagId' => $tagId]);
    json_out(200, ['ok' => true]);
  }

  if ($action === 'detach') {
    $stmt = db()->prepare('DELETE FROM _AssociationTags WHERE A = ? AND B = ?');
    $stmt->bind_param('ss', $assocId, $tagId);
    $stmt->execute();
    log_event('api', 'tags.detached', ['associationId' => $assocId, 'tagId' => $tagId]);
    json_out(200, ['ok' => true]);
  }
}

json_out(405, ['error' => 'Method not allowed']);
