<?php
/**
 * Associations endpoint
 *
 * GET:
 *   - List associations with filters and pagination.
 *   - Query params:
 *       q: string (search in name/description)
 *       municipality: string (either ID or name)
 *       type: string
 *       status: string
 *       tags[]: repeated (tag names or IDs)
 *       page: number (default 1)
 *       pageSize: number (default 20, max 100)
 *       sort: name_asc|name_desc|updated_asc|updated_desc
 *
 * POST:
 *   - Create association (requires auth + CSRF).
 * PUT/PATCH:
 *   - Update association by id in body (requires auth + CSRF).
 * DELETE ?id=:
 *   - Soft-delete association (requires auth + CSRF).
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

/**
 * Helper to bind parameters with references.
 *
 * @param mysqli_stmt $stmt
 * @param string $types
 * @param array<int, mixed> $params
 */
function bind_all(mysqli_stmt $stmt, string $types, array &$params): void {
  $refs = [];
  foreach ($params as $i => $value) {
    $refs[$i] = &$params[$i];
  }
  array_unshift($refs, $types);
  $stmt->bind_param(...$refs);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  require_auth();
  // ---------- Filters ----------
  $q            = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $municipality = isset($_GET['municipality']) ? trim((string)$_GET['municipality']) : '';
  $type         = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
  $status       = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
  $tagsRaw      = $_GET['tags'] ?? [];
  $tags         = [];
  if (is_array($tagsRaw)) {
    $tags = $tagsRaw;
  } elseif ($tagsRaw !== '') {
    $tags = [$tagsRaw];
  }

  $page     = max(1, (int)($_GET['page'] ?? 1));
  $pageSize = (int)($_GET['pageSize'] ?? 20);
  if ($pageSize <= 0) $pageSize = 20;
  if ($pageSize > 100) $pageSize = 100;
  $offset = ($page - 1) * $pageSize;

  $sortSql = order_by($_GET['sort'] ?? null);

  // ---------- Base query ----------
  $where = ['a.deleted_at IS NULL'];
  $params = [];
  $types = '';

  if ($q !== '') {
    $where[] = '(a.name LIKE CONCAT("%", ?, "%") OR a.description LIKE CONCAT("%", ?, "%"))';
    $params[] = $q; $types .= 's';
    $params[] = $q; $types .= 's';
  }

  if ($municipality !== '') {
    if (ctype_digit($municipality)) {
      $where[] = 'a.municipality_id = ?';
      $params[] = (int)$municipality; $types .= 'i';
    } else {
      $where[] = 'a.municipality_id IN (SELECT id FROM municipalities WHERE name = ?)';
      $params[] = $municipality; $types .= 's';
    }
  }

  if ($type !== '') {
    $where[] = 'a.type = ?';
    $params[] = $type; $types .= 's';
  }

  if ($status !== '') {
    $where[] = 'a.status = ?';
    $params[] = $status; $types .= 's';
  }

  $tagJoin = '';
  if (count($tags) > 0) {
    $placeholders = [];
    $tagTypes = '';
    $tagParams = [];
    foreach ($tags as $t) {
      if (ctype_digit((string)$t)) {
        $placeholders[] = '?';
        $tagTypes .= 'i';
        $tagParams[] = (int)$t;
      } else {
        $placeholders[] = '(SELECT id FROM tags WHERE name = ?)';
        $tagTypes .= 's';
        $tagParams[] = (string)$t;
      }
    }
    $tagJoin = 'INNER JOIN association_tags at ON at.association_id = a.id';
    $where[] = 'at.tag_id IN (' . implode(',', $placeholders) . ')';
    $types .= $tagTypes;
    $params = array_merge($params, $tagParams);
  }

  $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

  // ---------- Count ----------
  $countSql = "SELECT COUNT(DISTINCT a.id) AS cnt
               FROM associations a
               $tagJoin
               $whereSql";
  $stmt = db()->prepare($countSql);
  if ($types !== '') {
    bind_all($stmt, $types, $params);
  }
  $stmt->execute();
  $cntRes = $stmt->get_result()->fetch_assoc();
  $total = (int)($cntRes['cnt'] ?? 0);

  // ---------- Items ----------
  $sql = "SELECT a.id, a.name, a.municipality_id, m.name AS municipality_name, a.type, a.status, a.email, a.phone,
                 a.address, a.website, a.description, a.created_at, a.updated_at, a.deleted_at
          FROM associations a
          LEFT JOIN municipalities m ON m.id = a.municipality_id
          $tagJoin
          $whereSql
          $sortSql
          LIMIT ? OFFSET ?";

  $stmt2 = db()->prepare($sql);
  $params2 = $params;
  $types2 = $types . 'ii';
  $params2[] = $pageSize;
  $params2[] = $offset;
  bind_all($stmt2, $types2, $params2);
  $stmt2->execute();
  $res = $stmt2->get_result();

  $items = [];
  $items = [];
  $assocIds = [];
  while ($row = $res->fetch_assoc()) {
    $id = (int)$row['id'];
    $assocIds[] = $id;
    $items[$id] = [
      'id' => $id,
      'name' => $row['name'],
      'municipality_id' => $row['municipality_id'] !== null ? (int)$row['municipality_id'] : null,
      'municipality_name' => $row['municipality_name'],
      'type' => $row['type'],
      'status' => $row['status'],
      'email' => $row['email'],
      'phone' => $row['phone'],
      'address' => $row['address'],
      'website' => $row['website'],
      'description' => $row['description'],
      'created_at' => $row['created_at'],
      'updated_at' => $row['updated_at'],
      'deleted_at' => $row['deleted_at'],
      'tags' => [],
    ];
  }

  if (count($assocIds) > 0) {
    $placeholders = implode(',', array_fill(0, count($assocIds), '?'));
    $tagSql = "SELECT at.association_id, t.id, t.name
               FROM association_tags at
               INNER JOIN tags t ON t.id = at.tag_id
               WHERE at.association_id IN ($placeholders)
               ORDER BY t.name ASC";
    $stmtTags = db()->prepare($tagSql);
    $typesTags = str_repeat('i', count($assocIds));
    bind_all($stmtTags, $typesTags, $assocIds);
    $stmtTags->execute();
    $tagRes = $stmtTags->get_result();
    while ($tagRow = $tagRes->fetch_assoc()) {
      $aid = (int)$tagRow['association_id'];
      if (!isset($items[$aid])) {
        continue;
      }
      $items[$aid]['tags'][] = [
        'id' => (int)$tagRow['id'],
        'name' => $tagRow['name'],
      ];
    }
  }

  $items = array_values($items);

  json_out(200, [
    'items' => $items,
    'total' => $total,
    'page' => $page,
    'pageSize' => $pageSize,
  ]);
}

if ($method === 'POST') {
  require_auth();
  require_csrf();
  $b = read_json();

  $name = trim((string)($b['name'] ?? ''));
  if ($name === '') json_out(400, ['error' => 'name is required']);

  $municipality_id = isset($b['municipality_id']) && $b['municipality_id'] !== '' ? (int)$b['municipality_id'] : null;
  $type  = isset($b['type']) && $b['type'] !== '' ? trim((string)$b['type']) : null;
  $status= isset($b['status']) && $b['status'] !== '' ? trim((string)$b['status']) : null;
  $email = isset($b['email']) && $b['email'] !== '' ? trim((string)$b['email']) : null;
  $phone = isset($b['phone']) && $b['phone'] !== '' ? trim((string)$b['phone']) : null;
  $address = isset($b['address']) && $b['address'] !== '' ? trim((string)$b['address']) : null;
  $website = isset($b['website']) && $b['website'] !== '' ? trim((string)$b['website']) : null;
  $description = isset($b['description']) && $b['description'] !== '' ? trim((string)$b['description']) : null;

  $sql = 'INSERT INTO associations
          (name, municipality_id, type, status, email, phone, address, website, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())';
  $stmt = db()->prepare($sql);
  $stmt->bind_param(
    'sisssssss',
    $name,
    $municipality_id,
    $type,
    $status,
    $email,
    $phone,
    $address,
    $website,
    $description
  );
  $stmt->execute();
  json_out(200, ['id' => (int)db()->insert_id]);
}

if ($method === 'PUT' || $method === 'PATCH') {
  require_auth();
  require_csrf();
  $b = read_json();
  $id = isset($b['id']) ? (int)$b['id'] : 0;
  if ($id <= 0) json_out(400, ['error' => 'id is required']);

  $fields = [
    'name', 'municipality_id', 'type', 'status',
    'email', 'phone', 'address', 'website', 'description'
  ];

  $set = [];
  $types = '';
  $vals = [];

  foreach ($fields as $field) {
    if (!array_key_exists($field, $b)) {
      continue;
    }
    $value = $b[$field];
    if ($field === 'municipality_id') {
      if ($value === null || $value === '') {
        $set[] = 'municipality_id = NULL';
      } else {
        $set[] = 'municipality_id = ?';
        $types .= 'i';
        $vals[] = (int)$value;
      }
      continue;
    }

    if ($value === null || $value === '') {
      $set[] = $field . ' = NULL';
    } else {
      $set[] = $field . ' = ?';
      $types .= 's';
      $vals[] = trim((string)$value);
    }
  }

  if (count($set) === 0) {
    json_out(400, ['error' => 'No fields to update']);
  }

  $sql = 'UPDATE associations SET ' . implode(', ', $set) . ', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL';
  $types .= 'i';
  $vals[] = $id;

  $stmt = db()->prepare($sql);
  bind_all($stmt, $types, $vals);
  $stmt->execute();

  json_out(200, ['ok' => true]);
}

if ($method === 'DELETE') {
  require_auth();
  require_csrf();
  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) json_out(400, ['error' => 'id is required']);

  $stmt = db()->prepare('UPDATE associations SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL');
  $stmt->bind_param('i', $id);
  $stmt->execute();

  json_out(200, ['ok' => true]);
}

json_out(405, ['error' => 'Method not allowed']);
