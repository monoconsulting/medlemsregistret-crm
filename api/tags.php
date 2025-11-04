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
  if (isset($_GET['associationId'])) {
    $associationId = (int)$_GET['associationId'];
    if ($associationId <= 0) {
      json_out(400, ['error' => 'associationId must be a positive integer']);
    }
    $sql = <<<'SQL'
SELECT t.id, t.name
FROM association_tags at
INNER JOIN tags t ON t.id = at.tag_id
WHERE at.association_id = ?
ORDER BY t.name ASC
SQL;
    $stmt = db()->prepare($sql);
    $stmt->bind_param('i', $associationId);
    $stmt->execute();
    $res = $stmt->get_result();
    $items = [];
    while ($row = $res->fetch_assoc()) {
      $items[] = ['id' => (int)$row['id'], 'name' => $row['name']];
    }
    json_out(200, ['items' => $items]);
  }

  $res = db()->query('SELECT id, name FROM tags ORDER BY name ASC');
  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = ['id' => (int)$row['id'], 'name' => $row['name']];
  }
  json_out(200, ['items' => $items]);
}

require_auth();
require_csrf();

$body = read_json();
$action = isset($body['action']) ? (string)$body['action'] : '';

if ($method === 'POST' && $action === '') {
  $name = isset($body['name']) ? trim((string)$body['name']) : '';
  if ($name === '') json_out(400, ['error' => 'Missing tag name']);
  $stmt = db()->prepare('INSERT INTO tags (name) VALUES (?)');
  $stmt->bind_param('s', $name);
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

if ($method === 'POST' && ($action === 'attach' || $action === 'detach')) {
  $assocId = isset($body['associationId']) ? (int)$body['associationId'] : 0;
  $tagId   = isset($body['tagId']) ? (int)$body['tagId'] : 0;
  if ($assocId <= 0 || $tagId <= 0) json_out(400, ['error' => 'associationId and tagId are required']);

  if ($action === 'attach') {
    $stmt = db()->prepare('INSERT IGNORE INTO association_tags (association_id, tag_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $assocId, $tagId);
    $stmt->execute();
    json_out(200, ['ok' => true]);
  }

  if ($action === 'detach') {
    $stmt = db()->prepare('DELETE FROM association_tags WHERE association_id = ? AND tag_id = ?');
    $stmt->bind_param('ii', $assocId, $tagId);
    $stmt->execute();
    json_out(200, ['ok' => true]);
  }
}

json_out(405, ['error' => 'Method not allowed']);
