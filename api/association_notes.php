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
  $aid = isset($_GET['association_id']) ? (int)$_GET['association_id'] : 0;
  if ($aid <= 0) json_out(400, ['error' => 'association_id is required']);
  $stmt = db()->prepare('SELECT id, association_id, content, author, created_at FROM notes WHERE association_id = ? ORDER BY created_at DESC');
  $stmt->bind_param('i', $aid);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (int)$row['id'],
      'association_id' => (int)$row['association_id'],
      'content' => $row['content'],
      'author' => $row['author'],
      'created_at' => $row['created_at'],
    ];
  }
  json_out(200, ['items' => $items]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  $body = read_json();
  $aid = isset($body['association_id']) ? (int)$body['association_id'] : 0;
  $content = isset($body['content']) ? trim((string)$body['content']) : '';
  if ($aid <= 0 || $content === '') json_out(400, ['error' => 'association_id and content are required']);

  $author = 'user'; // Single-user system; change if you later store display name
  $stmt = db()->prepare('INSERT INTO notes (association_id, content, author, created_at) VALUES (?, ?, ?, NOW())');
  $stmt->bind_param('iss', $aid, $content, $author);
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

json_out(405, ['error' => 'Method not allowed']);
