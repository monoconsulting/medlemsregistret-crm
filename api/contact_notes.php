<?php
/**
 * Contact-specific notes endpoint.
 *
 * GET  ?contact_id=... -> list notes linked to the contact.
 * POST {contact_id, content} -> create a note for the contact.
 *
 * Notes are stored in the existing Note table and tagged with "contact:{id}" so they
 * can share infrastructure with association notes without new tables.
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
  require_auth();
  $contactId = isset($_GET['contact_id']) ? trim((string)$_GET['contact_id']) : '';
  if ($contactId === '') {
    json_out(400, ['error' => 'contact_id is required']);
  }

  $contact = fetch_contact_summary($contactId);
  if (!$contact) {
    json_out(404, ['error' => 'Contact not found']);
  }

  $tagNeedle = 'contact:' . $contactId;
  $sql = "SELECT id,
                 associationId,
                 CONVERT(content USING utf8mb4) AS content,
                 CONVERT(authorName USING utf8mb4) AS author,
                 createdAt AS created_at
          FROM Note
          WHERE associationId = ?
            AND JSON_SEARCH(tags, 'one', ?) IS NOT NULL
          ORDER BY createdAt DESC";
  $stmt = db()->prepare($sql);
  $stmt->bind_param('ss', $contact['association_id'], $tagNeedle);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'association_id' => (string)$row['associationId'],
      'contact_id' => $contactId,
      'content' => normalize_utf8($row['content'] ?? null) ?? '',
      'author' => normalize_utf8($row['author'] ?? null),
      'created_at' => $row['created_at'],
    ];
  }

  log_event('api', 'contact_notes.list', [
    'contactId' => $contactId,
    'associationId' => $contact['association_id'],
    'count' => count($items),
  ]);
  json_out(200, ['items' => $items]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  rate_limit('contact-notes-write', 40, 60);

  $body = read_json();
  $contactId = isset($body['contact_id']) ? trim((string)$body['contact_id']) : '';
  $content = normalize_nullable_string($body['content'] ?? null, 2000);
  if ($contactId === '' || $content === '') {
    json_out(400, ['error' => 'contact_id and content are required']);
  }

  $contact = fetch_contact_summary($contactId);
  if (!$contact) {
    json_out(404, ['error' => 'Contact not found']);
  }

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
  $tagPayload = json_encode(['contact:' . $contactId]);
  if ($tagPayload === false) {
    json_out(500, ['error' => 'Failed to encode tags payload']);
  }
  $stmt = db()->prepare(
    'INSERT INTO Note (id, associationId, content, tags, authorId, authorName, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())'
  );
  $stmt->bind_param('ssssss', $id, $contact['association_id'], $content, $tagPayload, $authorId, $authorName);
  $stmt->execute();

  log_event('api', 'contact_notes.created', [
    'noteId' => $id,
    'contactId' => $contactId,
    'associationId' => $contact['association_id'],
  ]);
  json_out(200, ['id' => $id]);
}

json_out(405, ['error' => 'Method not allowed']);

/**
 * Fetches the contact association summary for permission checks.
 *
 * @param string $contactId
 * @return array{id: string, association_id: string, association_name: string|null}|null
 */
function fetch_contact_summary(string $contactId): ?array {
  $stmt = db()->prepare('SELECT id, associationId, CONVERT(name USING utf8mb4) AS name FROM Contact WHERE id = ? AND deletedAt IS NULL LIMIT 1');
  $stmt->bind_param('s', $contactId);
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  if (!$row) {
    return null;
  }

  return [
    'id' => (string)$row['id'],
    'association_id' => (string)$row['associationId'],
    'name' => normalize_utf8($row['name'] ?? null),
  ];
}
