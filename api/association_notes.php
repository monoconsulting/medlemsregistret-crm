<?php
/**
 * Association notes endpoint
 *
 * GET ?association_id=: Lists notes for the given association.
 * POST {association_id, content}: Creates a note for the association.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  require_auth();
  $aid = isset($_GET['association_id']) ? trim((string)$_GET['association_id']) : '';
  if ($aid === '') json_out(400, ['error' => 'association_id is required']);
  $sql = 'SELECT id,
                 associationId,
                 CONVERT(content USING utf8mb4) AS content,
                 authorName,
                 createdAt AS created_at
          FROM Note
          WHERE associationId = ?
          ORDER BY createdAt DESC';
  $stmt = db()->prepare($sql);
  $stmt->bind_param('s', $aid);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'association_id' => (string)$row['associationId'],
      'content' => normalize_utf8($row['content'] ?? null) ?? '',
      'author' => normalize_utf8($row['authorName'] ?? null),
      'created_at' => $row['created_at'],
    ];
  }
  log_event('api', 'notes.list', ['associationId' => $aid, 'count' => count($items)]);
  json_out(200, ['items' => $items]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  rate_limit('notes-write', 40, 60);
  $body = read_json();
  $aid = isset($body['association_id']) ? trim((string)$body['association_id']) : '';
  $content = normalize_nullable_string($body['content'] ?? null, 2000);
  if ($aid === '' || $content === '') json_out(400, ['error' => 'association_id and content are required']);

  $authorId = isset($_SESSION['uid']) ? (string)$_SESSION['uid'] : '';
  if ($authorId === '') {
    json_out(401, ['error' => 'Not authenticated']);
  }
  $authorName = $authorId;
  $stmtUser = db()->prepare('SELECT name, email FROM User WHERE id = ? LIMIT 1');
  $stmtUser->bind_param('s', $authorId);
  $stmtUser->execute();
  $userRow = $stmtUser->get_result()->fetch_assoc();
  if ($userRow) {
    $candidate = $userRow['name'] ?? '';
    if ($candidate === '' && isset($userRow['email'])) {
      $candidate = (string)$userRow['email'];
    }
    if ($candidate !== '') {
      $authorName = $candidate;
    }
  }

  $id = generate_id();
  $emptyTags = '[]';
  $stmt = db()->prepare(
    'INSERT INTO Note (id, associationId, content, tags, authorId, authorName, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())'
  );
  $stmt->bind_param('ssssss', $id, $aid, $content, $emptyTags, $authorId, $authorName);
  $stmt->execute();
  log_event('api', 'notes.created', ['associationId' => $aid, 'id' => $id]);
  json_out(200, ['id' => $id]);
}

json_out(405, ['error' => 'Method not allowed']);
