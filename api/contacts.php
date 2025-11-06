<?php
/**
 * Contacts endpoint.
 *
 * GET    ?association_id=...   -> list contacts for association
 * POST   {association_id,...}  -> create contact
 * PUT    {id,...}              -> update contact
 * DELETE ?id=...               -> delete contact
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if (!function_exists('bind_all')) {
  /**
   * Binds parameters with references.
   *
   * @param mysqli_stmt $stmt
   * @param string $types
   * @param array<int, mixed> $params
   */
  function bind_all(mysqli_stmt $stmt, string $types, array $params): void {
    if ($types === '' || empty($params)) {
      return;
    }
    $refs = [];
    foreach ($params as $i => $value) {
      $refs[$i] = &$params[$i];
    }
    array_unshift($refs, $types);
    call_user_func_array([$stmt, 'bind_param'], $refs);
  }
}

if ($method === 'GET') {
  handle_list_contacts();
} elseif ($method === 'POST') {
  handle_create_contact();
} elseif ($method === 'PUT') {
  handle_update_contact();
} elseif ($method === 'DELETE') {
  handle_delete_contact();
} else {
  json_out(405, ['error' => 'Method not allowed']);
}

/**
 * Lists contacts for the given association.
 *
 * @return void
 */
function handle_list_contacts(): void {
  require_auth();
  $associationId = isset($_GET['association_id']) ? trim((string)$_GET['association_id']) : '';
  if ($associationId === '') {
    json_out(400, ['error' => 'association_id is required']);
  }

  $sql = "SELECT
            id,
            associationId,
            CONVERT(name USING utf8mb4) AS name,
            CONVERT(role USING utf8mb4) AS role,
            CONVERT(email USING utf8mb4) AS email,
            CONVERT(phone USING utf8mb4) AS phone,
            CONVERT(mobile USING utf8mb4) AS mobile,
            CONVERT(linkedinUrl USING utf8mb4) AS linkedin_url,
            CONVERT(facebookUrl USING utf8mb4) AS facebook_url,
            CONVERT(twitterUrl USING utf8mb4) AS twitter_url,
            CONVERT(instagramUrl USING utf8mb4) AS instagram_url,
            isPrimary AS is_primary,
            createdAt AS created_at,
            updatedAt AS updated_at
          FROM Contact
          WHERE associationId = ?
          ORDER BY isPrimary DESC, createdAt ASC";
  $stmt = db()->prepare($sql);
  $stmt->bind_param('s', $associationId);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'association_id' => (string)$row['associationId'],
      'name' => normalize_utf8($row['name'] ?? null),
      'role' => normalize_utf8($row['role'] ?? null),
      'email' => normalize_utf8($row['email'] ?? null),
      'phone' => normalize_utf8($row['phone'] ?? null),
      'mobile' => normalize_utf8($row['mobile'] ?? null),
      'linkedin_url' => normalize_utf8($row['linkedin_url'] ?? null),
      'facebook_url' => normalize_utf8($row['facebook_url'] ?? null),
      'twitter_url' => normalize_utf8($row['twitter_url'] ?? null),
      'instagram_url' => normalize_utf8($row['instagram_url'] ?? null),
      'is_primary' => (bool)$row['is_primary'],
      'created_at' => $row['created_at'],
      'updated_at' => $row['updated_at'],
    ];
  }

  log_event('api', 'contacts.list', ['associationId' => $associationId, 'count' => count($items)]);
  json_out(200, ['items' => $items]);
}

/**
 * Creates a new contact.
 *
 * @return void
 */
function handle_create_contact(): void {
  require_auth();
  require_csrf();
  rate_limit('contacts-write', 50, 60);

  $body = read_json();
  $associationId = normalize_nullable_string($body['association_id'] ?? null, 36);
  if ($associationId === '') {
    json_out(400, ['error' => 'association_id is required']);
  }

  $name = normalize_nullable_string($body['name'] ?? null, 255);
  $role = normalize_nullable_string($body['role'] ?? null, 120);
  $email = normalize_email($body['email'] ?? null);
  $phone = normalize_nullable_string($body['phone'] ?? null, 64);
  $mobile = normalize_nullable_string($body['mobile'] ?? null, 64);
  $linkedin = normalize_nullable_string($body['linkedin_url'] ?? null, 255);
  $facebook = normalize_nullable_string($body['facebook_url'] ?? null, 255);
  $twitter = normalize_nullable_string($body['twitter_url'] ?? null, 255);
  $instagram = normalize_nullable_string($body['instagram_url'] ?? null, 255);
  $isPrimary = normalize_bool($body['is_primary'] ?? false);

  if ($isPrimary === 1) {
    $stmtReset = db()->prepare('UPDATE Contact SET isPrimary = 0 WHERE associationId = ?');
    $stmtReset->bind_param('s', $associationId);
    $stmtReset->execute();
  }

  $id = generate_id();
  $sql = "INSERT INTO Contact (
            id,
            associationId,
            name,
            role,
            email,
            phone,
            mobile,
            linkedinUrl,
            facebookUrl,
            twitterUrl,
            instagramUrl,
            isPrimary,
            createdAt,
            updatedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
          )";
  $stmt = db()->prepare($sql);
  $stmt->bind_param(
    'sssssssssssi',
    $id,
    $associationId,
    $name !== '' ? $name : null,
    $role !== '' ? $role : null,
    $email !== '' ? $email : null,
    $phone !== '' ? $phone : null,
    $mobile !== '' ? $mobile : null,
    $linkedin !== '' ? $linkedin : null,
    $facebook !== '' ? $facebook : null,
    $twitter !== '' ? $twitter : null,
    $instagram !== '' ? $instagram : null,
    $isPrimary
  );
  $stmt->execute();

  log_event('api', 'contacts.created', ['associationId' => $associationId, 'id' => $id, 'isPrimary' => $isPrimary === 1]);
  json_out(200, ['id' => $id]);
}

/**
 * Updates an existing contact.
 *
 * @return void
 */
function handle_update_contact(): void {
  require_auth();
  require_csrf();
  rate_limit('contacts-write', 50, 60);

  $body = read_json();
  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmtFetch = db()->prepare('SELECT associationId FROM Contact WHERE id = ? LIMIT 1');
  $stmtFetch->bind_param('s', $id);
  $stmtFetch->execute();
  $row = $stmtFetch->get_result()->fetch_assoc();
  if (!$row) {
    json_out(404, ['error' => 'Contact not found']);
  }
  $associationId = (string)$row['associationId'];

  $fields = [];
  $types = '';
  $params = [];

  $map = [
    'name' => 255,
    'role' => 120,
    'phone' => 64,
    'mobile' => 64,
    'linkedin_url' => 255,
    'facebook_url' => 255,
    'twitter_url' => 255,
    'instagram_url' => 255,
  ];

  foreach ($map as $key => $max) {
    if (array_key_exists($key, $body)) {
      $value = normalize_nullable_string($body[$key], $max);
      $column = str_replace('_url', 'Url', $key);
      $column = str_replace('linkedin', 'linkedin', $column);
      $column = str_replace('facebook', 'facebook', $column);
      $column = str_replace('twitter', 'twitter', $column);
      $column = str_replace('instagram', 'instagram', $column);
      $column = match ($key) {
        'linkedin_url' => 'linkedinUrl',
        'facebook_url' => 'facebookUrl',
        'twitter_url' => 'twitterUrl',
        'instagram_url' => 'instagramUrl',
        default => $key,
      };
      $fields[] = "{$column} = ?";
      $params[] = $value !== '' ? $value : null;
      $types .= 's';
    }
  }

  if (array_key_exists('email', $body)) {
    $email = normalize_email($body['email']);
    $fields[] = 'email = ?';
    $params[] = $email !== '' ? $email : null;
    $types .= 's';
  }

  if (array_key_exists('is_primary', $body)) {
    $isPrimary = normalize_bool($body['is_primary']);
    if ($isPrimary === 1) {
      $stmtReset = db()->prepare('UPDATE Contact SET isPrimary = 0 WHERE associationId = ?');
      $stmtReset->bind_param('s', $associationId);
      $stmtReset->execute();
    }
    $fields[] = 'isPrimary = ?';
    $params[] = $isPrimary;
    $types .= 'i';
  }

  if (!count($fields)) {
    json_out(400, ['error' => 'No fields to update']);
  }

  $fields[] = 'updatedAt = NOW()';
  $sql = 'UPDATE Contact SET ' . implode(', ', $fields) . ' WHERE id = ? LIMIT 1';
  $params[] = $id;
  $types .= 's';

  $stmt = db()->prepare($sql);
  bind_all($stmt, $types, $params);
  $stmt->execute();

  log_event('api', 'contacts.updated', ['id' => $id]);
  json_out(200, ['ok' => true]);
}

/**
 * Deletes a contact.
 *
 * @return void
 */
function handle_delete_contact(): void {
  require_auth();
  require_csrf();
  rate_limit('contacts-write', 40, 60);

  $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmt = db()->prepare('DELETE FROM Contact WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $id);
  $stmt->execute();

  log_event('api', 'contacts.deleted', ['id' => $id]);
  json_out(200, ['ok' => true]);
}
