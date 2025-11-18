<?php
/**
 * Contacts endpoint with per-association and global listings.
 *
 * Supports soft deletes via Contact.deletedAt to align with frontend expectations.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

if (!function_exists('bind_all')) {
  /**
   * Binds params with references for dynamic UPDATE statements.
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

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
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
} catch (mysqli_sql_exception $e) {
  log_event('api', 'contacts.sql_error', [
    'code' => $e->getCode(),
    'message' => $e->getMessage(),
  ]);
  json_out(500, ['error' => 'Database query failed.']);
}

/**
 * Lists contacts either scoped to an association or globally with pagination/search.
 */
function handle_list_contacts(): void {
  require_auth();
  $associationId = isset($_GET['association_id']) ? trim((string)$_GET['association_id']) : '';

  if ($associationId !== '') {
    $sql = "SELECT
              c.id,
              c.associationId,
              CONVERT(c.name USING utf8mb4) AS name,
              CONVERT(c.role USING utf8mb4) AS role,
              CONVERT(c.email USING utf8mb4) AS email,
              CONVERT(c.phone USING utf8mb4) AS phone,
              CONVERT(c.mobile USING utf8mb4) AS mobile,
              CONVERT(c.linkedinUrl USING utf8mb4) AS linkedin_url,
              CONVERT(c.facebookUrl USING utf8mb4) AS facebook_url,
              CONVERT(c.twitterUrl USING utf8mb4) AS twitter_url,
              CONVERT(c.instagramUrl USING utf8mb4) AS instagram_url,
              c.isPrimary AS is_primary,
              c.createdAt AS created_at,
              c.updatedAt AS updated_at,
              c.deletedAt AS deleted_at,
              CONVERT(a.name USING utf8mb4) AS association_name,
              CONVERT(a.streetAddress USING utf8mb4) AS association_street_address,
              CONVERT(a.postalCode USING utf8mb4) AS association_postal_code,
              CONVERT(a.city USING utf8mb4) AS association_city,
              CONVERT(m.name USING utf8mb4) AS municipality_name
            FROM Contact c
            LEFT JOIN Association a ON c.associationId = a.id
            LEFT JOIN Municipality m ON a.municipalityId = m.id
            WHERE c.associationId = ?
              AND (c.deletedAt IS NULL)
            ORDER BY c.isPrimary DESC, c.createdAt ASC";
    $stmt = db()->prepare($sql);
    $stmt->bind_param('s', $associationId);
    $stmt->execute();
    $res = $stmt->get_result();

    $items = [];
    while ($row = $res->fetch_assoc()) {
      $items[] = format_contact_row($row);
    }

    log_event('api', 'contacts.list', ['associationId' => $associationId, 'count' => count($items)]);
    json_out(200, ['items' => $items]);
    return;
  }

  $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $pageSize = isset($_GET['pageSize']) ? min(500, max(1, (int)$_GET['pageSize'])) : 100;
  $offset = ($page - 1) * $pageSize;
  $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $sort = isset($_GET['sort']) ? trim((string)$_GET['sort']) : 'name_asc';

  $orderMap = [
    'name_asc' => 'c.name ASC',
    'name_desc' => 'c.name DESC',
    'association_asc' => 'a.name ASC',
    'association_desc' => 'a.name DESC',
    'municipality_asc' => 'm.name ASC',
    'municipality_desc' => 'm.name DESC',
    'primary_asc' => 'c.isPrimary ASC',
    'primary_desc' => 'c.isPrimary DESC',
    'address_asc' => 'a.streetAddress ASC, a.postalCode ASC, a.city ASC',
    'address_desc' => 'a.streetAddress DESC, a.postalCode DESC, a.city DESC',
    'phone_asc' => 'COALESCE(c.phone, c.mobile) ASC',
    'phone_desc' => 'COALESCE(c.phone, c.mobile) DESC',
    'email_asc' => 'c.email ASC',
    'email_desc' => 'c.email DESC',
    'facebook_asc' => 'c.facebookUrl ASC',
    'facebook_desc' => 'c.facebookUrl DESC',
    'instagram_asc' => 'c.instagramUrl ASC',
    'instagram_desc' => 'c.instagramUrl DESC',
    'twitter_asc' => 'c.twitterUrl ASC',
    'twitter_desc' => 'c.twitterUrl DESC',
  ];
  $orderBy = $orderMap[$sort] ?? 'c.name ASC';

  $total = 0;
  if ($q !== '') {
    $searchPattern = '%' . $q . '%';
    $countSQL = "SELECT COUNT(*) AS total
                 FROM Contact c
                 LEFT JOIN Association a ON c.associationId = a.id
                 LEFT JOIN Municipality m ON a.municipalityId = m.id
                 WHERE c.deletedAt IS NULL
                   AND (c.name LIKE ?
                        OR c.email LIKE ?
                        OR c.phone LIKE ?
                        OR c.mobile LIKE ?
                        OR c.facebookUrl LIKE ?
                        OR c.instagramUrl LIKE ?
                        OR c.twitterUrl LIKE ?
                        OR a.name LIKE ?
                        OR a.streetAddress LIKE ?
                        OR a.city LIKE ?
                        OR a.postalCode LIKE ?
                        OR m.name LIKE ?)";
    $stmtCount = db()->prepare($countSQL);
    $stmtCount->bind_param(
      'ssssssssssss',
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern
    );
    $stmtCount->execute();
    $total = (int)($stmtCount->get_result()->fetch_assoc()['total'] ?? 0);

    $sql = "SELECT
              c.id,
              c.associationId,
              CONVERT(c.name USING utf8mb4) AS name,
              CONVERT(c.role USING utf8mb4) AS role,
              CONVERT(c.email USING utf8mb4) AS email,
              CONVERT(c.phone USING utf8mb4) AS phone,
              CONVERT(c.mobile USING utf8mb4) AS mobile,
              CONVERT(c.linkedinUrl USING utf8mb4) AS linkedin_url,
              CONVERT(c.facebookUrl USING utf8mb4) AS facebook_url,
              CONVERT(c.twitterUrl USING utf8mb4) AS twitter_url,
              CONVERT(c.instagramUrl USING utf8mb4) AS instagram_url,
              c.isPrimary AS is_primary,
              c.createdAt AS created_at,
              c.updatedAt AS updated_at,
              c.deletedAt AS deleted_at,
              CONVERT(a.name USING utf8mb4) AS association_name,
              CONVERT(a.streetAddress USING utf8mb4) AS association_street_address,
              CONVERT(a.postalCode USING utf8mb4) AS association_postal_code,
              CONVERT(a.city USING utf8mb4) AS association_city,
              CONVERT(m.name USING utf8mb4) AS municipality_name
            FROM Contact c
            LEFT JOIN Association a ON c.associationId = a.id
            LEFT JOIN Municipality m ON a.municipalityId = m.id
            WHERE c.deletedAt IS NULL
              AND (c.name LIKE ?
                   OR c.email LIKE ?
                   OR c.phone LIKE ?
                   OR c.mobile LIKE ?
                   OR c.facebookUrl LIKE ?
                   OR c.instagramUrl LIKE ?
                   OR c.twitterUrl LIKE ?
                   OR a.name LIKE ?
                   OR a.streetAddress LIKE ?
                   OR a.city LIKE ?
                   OR a.postalCode LIKE ?
                   OR m.name LIKE ?)
            ORDER BY {$orderBy}
            LIMIT ? OFFSET ?";
    $stmt = db()->prepare($sql);
    $stmt->bind_param(
      'ssssssssssssii',
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $searchPattern,
      $pageSize,
      $offset
    );
    $stmt->execute();
    $res = $stmt->get_result();
  } else {
    $countSQL = "SELECT COUNT(*) AS total
                 FROM Contact c
                 WHERE c.deletedAt IS NULL";
    $stmtCount = db()->prepare($countSQL);
    $stmtCount->execute();
    $total = (int)($stmtCount->get_result()->fetch_assoc()['total'] ?? 0);

    $sql = "SELECT
              c.id,
              c.associationId,
              CONVERT(c.name USING utf8mb4) AS name,
              CONVERT(c.role USING utf8mb4) AS role,
              CONVERT(c.email USING utf8mb4) AS email,
              CONVERT(c.phone USING utf8mb4) AS phone,
              CONVERT(c.mobile USING utf8mb4) AS mobile,
              CONVERT(c.linkedinUrl USING utf8mb4) AS linkedin_url,
              CONVERT(c.facebookUrl USING utf8mb4) AS facebook_url,
              CONVERT(c.twitterUrl USING utf8mb4) AS twitter_url,
              CONVERT(c.instagramUrl USING utf8mb4) AS instagram_url,
              c.isPrimary AS is_primary,
              c.createdAt AS created_at,
              c.updatedAt AS updated_at,
              c.deletedAt AS deleted_at,
              CONVERT(a.name USING utf8mb4) AS association_name,
              CONVERT(a.streetAddress USING utf8mb4) AS association_street_address,
              CONVERT(a.postalCode USING utf8mb4) AS association_postal_code,
              CONVERT(a.city USING utf8mb4) AS association_city,
              CONVERT(m.name USING utf8mb4) AS municipality_name
            FROM Contact c
            LEFT JOIN Association a ON c.associationId = a.id
            LEFT JOIN Municipality m ON a.municipalityId = m.id
            WHERE c.deletedAt IS NULL
            ORDER BY {$orderBy}
            LIMIT ? OFFSET ?";
    $stmt = db()->prepare($sql);
    $stmt->bind_param('ii', $pageSize, $offset);
    $stmt->execute();
    $res = $stmt->get_result();
  }

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = format_contact_row($row);
  }

  log_event('api', 'contacts.list_all', ['count' => count($items), 'total' => $total]);
  json_out(200, ['items' => $items, 'total' => $total, 'page' => $page, 'pageSize' => $pageSize]);
}

/**
 * Creates a new contact.
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
    $stmtReset = db()->prepare('UPDATE Contact SET isPrimary = 0 WHERE associationId = ? AND deletedAt IS NULL');
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
            updatedAt,
            deletedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL
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
    'name' => ['len' => 255, 'column' => 'name'],
    'role' => ['len' => 120, 'column' => 'role'],
    'phone' => ['len' => 64, 'column' => 'phone'],
    'mobile' => ['len' => 64, 'column' => 'mobile'],
    'linkedin_url' => ['len' => 255, 'column' => 'linkedinUrl'],
    'facebook_url' => ['len' => 255, 'column' => 'facebookUrl'],
    'twitter_url' => ['len' => 255, 'column' => 'twitterUrl'],
    'instagram_url' => ['len' => 255, 'column' => 'instagramUrl'],
  ];

  foreach ($map as $key => $meta) {
    if (array_key_exists($key, $body)) {
      $value = normalize_nullable_string($body[$key], $meta['len']);
      $fields[] = $meta['column'] . ' = ?';
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
      $stmtReset = db()->prepare('UPDATE Contact SET isPrimary = 0 WHERE associationId = ? AND deletedAt IS NULL');
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
 * Soft deletes a contact by setting deletedAt.
 */
function handle_delete_contact(): void {
  require_auth();
  require_csrf();
  rate_limit('contacts-write', 40, 60);

  $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmt = db()->prepare('UPDATE Contact SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ? AND deletedAt IS NULL');
  $stmt->bind_param('s', $id);
  $stmt->execute();

  log_event('api', 'contacts.deleted', ['id' => $id, 'affected' => $stmt->affected_rows]);
  json_out(200, ['ok' => $stmt->affected_rows > 0]);
}

/**
 * Formats DB row into API payload shape.
 */
function format_contact_row(array $row): array {
  return [
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
    'created_at' => $row['created_at'] ?? $row['createdAt'] ?? null,
    'updated_at' => $row['updated_at'] ?? $row['updatedAt'] ?? null,
    'deleted_at' => $row['deleted_at'] ?? $row['deletedAt'] ?? null,
    'association_name' => normalize_utf8($row['association_name'] ?? null),
    'association_street_address' => normalize_utf8($row['association_street_address'] ?? null),
    'association_postal_code' => normalize_utf8($row['association_postal_code'] ?? null),
    'association_city' => normalize_utf8($row['association_city'] ?? null),
    'association_address' => build_full_address(
      $row['association_street_address'] ?? null,
      $row['association_postal_code'] ?? null,
      $row['association_city'] ?? null
    ),
    'municipality_name' => normalize_utf8($row['municipality_name'] ?? null),
  ];
}

/**
 * Builds a single-line address string.
 */
function build_full_address(?string $street, ?string $postal, ?string $city): ?string {
  $parts = [];
  $streetNormalized = normalize_utf8($street ?? null);
  $postalNormalized = normalize_utf8($postal ?? null);
  $cityNormalized = normalize_utf8($city ?? null);

  if ($streetNormalized && trim($streetNormalized) !== '') {
    $parts[] = $streetNormalized;
  }

  $postalCity = trim(($postalNormalized ?? '') . ' ' . ($cityNormalized ?? ''));
  if ($postalCity !== '') {
    $parts[] = $postalCity;
  }

  if (!count($parts)) {
    return null;
  }

  return implode(', ', $parts);
}
