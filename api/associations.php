<?php
/**
 * Associations endpoint
 *
 * GET: Lists associations with filters, pagination and sorting.
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

/**
 * Decodes the `types` JSON array into a human friendly comma separated list.
 */
function normalize_types(?string $value): ?string {
  if ($value === null) {
    return null;
  }
  $trimmed = trim($value);
  if ($trimmed === '') {
    return null;
  }
  $decoded = json_decode($trimmed, true);
  if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
    $flat = array_filter(array_map(function ($item) {
      if ($item === null) {
        return null;
      }
      if (is_string($item)) {
        return normalize_utf8($item);
      }
      if (is_scalar($item)) {
        return normalize_utf8((string)$item);
      }
      return null;
    }, $decoded));
    if (!empty($flat)) {
      return implode(', ', $flat);
    }
    return null;
  }
  return normalize_utf8($value);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();

$q            = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
$municipality = isset($_GET['municipality']) ? trim((string)$_GET['municipality']) : '';
$type         = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
$status       = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
$tagsParam    = $_GET['tags'] ?? [];
$tags         = [];
if (is_array($tagsParam)) {
  $tags = array_values(array_filter(array_map(fn($t) => trim((string)$t), $tagsParam), fn($t) => $t !== ''));
} elseif ($tagsParam !== '') {
  $tags = [trim((string)$tagsParam)];
}

$page     = max(1, (int)($_GET['page'] ?? 1));
$pageSize = (int)($_GET['pageSize'] ?? 20);
if ($pageSize <= 0) {
  $pageSize = 20;
}
if ($pageSize > 100) {
  $pageSize = 100;
}
$offset = ($page - 1) * $pageSize;

$sortSql = order_by($_GET['sort'] ?? null);

$where = ['a.deletedAt IS NULL'];
$params = [];
$types = '';

if ($q !== '') {
  $where[] = '(a.name LIKE CONCAT("%", ?, "%") OR a.description LIKE CONCAT("%", ?, "%"))';
  $params[] = $q; $types .= 's';
  $params[] = $q; $types .= 's';
}

if ($municipality !== '') {
  $where[] = '(a.municipalityId = ? OR m.name = ?)';
  $params[] = $municipality; $types .= 's';
  $params[] = $municipality; $types .= 's';
}

if ($type !== '') {
  $where[] = 'a.types LIKE CONCAT("%", ?, "%")';
  $params[] = $type; $types .= 's';
}

if ($status !== '') {
  $where[] = 'a.crmStatus = ?';
  $params[] = $status; $types .= 's';
}

$tagJoin = '';
if (!empty($tags)) {
  $placeholders = implode(',', array_fill(0, count($tags), '?'));
  $tagJoin = 'INNER JOIN _AssociationTags at ON at.A = a.id';
  $where[] = "at.B IN ($placeholders)";
  foreach ($tags as $tag) {
    $params[] = $tag; $types .= 's';
  }
}

$whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';

// Count total rows first
$countSql = "SELECT COUNT(DISTINCT a.id) AS cnt
             FROM Association a
             LEFT JOIN Municipality m ON m.id = a.municipalityId
             $tagJoin
             $whereSql";
$stmt = db()->prepare($countSql);
bind_all($stmt, $types, $params);
$stmt->execute();
$cntRes = $stmt->get_result()->fetch_assoc();
$total = (int)($cntRes['cnt'] ?? 0);

// Fetch paginated items
$sql = "SELECT
          a.id,
          CONVERT(a.name USING utf8mb4) AS name,
          a.municipalityId AS municipality_id,
          CONVERT(m.name USING utf8mb4) AS municipality_name,
          a.types,
          a.crmStatus AS status,
          CONVERT(a.email USING utf8mb4) AS email,
          CONVERT(a.phone USING utf8mb4) AS phone,
          CONVERT(a.streetAddress USING utf8mb4) AS address,
          CONVERT(a.homepageUrl USING utf8mb4) AS website,
          CONVERT(a.description USING utf8mb4) AS description,
          a.createdAt AS created_at,
          a.updatedAt AS updated_at,
          a.deletedAt AS deleted_at
        FROM Association a
        LEFT JOIN Municipality m ON m.id = a.municipalityId
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
$tagIndex = [];
while ($row = $res->fetch_assoc()) {
  $id = (string)$row['id'];
  $items[$id] = [
    'id' => $id,
    'name' => normalize_utf8($row['name'] ?? null),
    'municipality_id' => $row['municipality_id'] !== null ? (string)$row['municipality_id'] : null,
    'municipality_name' => normalize_utf8($row['municipality_name'] ?? null),
    'type' => normalize_types($row['types'] ?? null),
    'status' => $row['status'] !== null ? (string)$row['status'] : null,
    'email' => normalize_utf8($row['email'] ?? null),
    'phone' => normalize_utf8($row['phone'] ?? null),
    'address' => normalize_utf8($row['address'] ?? null),
    'website' => normalize_utf8($row['website'] ?? null),
    'description' => normalize_utf8($row['description'] ?? null),
    'created_at' => $row['created_at'],
    'updated_at' => $row['updated_at'],
    'deleted_at' => $row['deleted_at'],
    'tags' => [],
  ];
  $tagIndex[$id] = [];
}

$assocIds = array_keys($items);
if (count($assocIds) > 0) {
  $placeholders = implode(',', array_fill(0, count($assocIds), '?'));
  $tagSql = "SELECT at.A AS association_id, t.id, CONVERT(t.name USING utf8mb4) AS name
             FROM _AssociationTags at
             INNER JOIN Tag t ON t.id = at.B
             WHERE at.A IN ($placeholders)
             ORDER BY name ASC";
  $stmtTags = db()->prepare($tagSql);
  $typeTags = str_repeat('s', count($assocIds));
  bind_all($stmtTags, $typeTags, $assocIds);
  $stmtTags->execute();
  $tagRes = $stmtTags->get_result();
  while ($tagRow = $tagRes->fetch_assoc()) {
    $aid = (string)$tagRow['association_id'];
    if (!isset($items[$aid])) {
      continue;
    }
    $tagId = (string)$tagRow['id'];
    if (isset($tagIndex[$aid][$tagId])) {
      continue;
    }
    $items[$aid]['tags'][] = [
      'id' => $tagId,
      'name' => normalize_utf8($tagRow['name'] ?? null),
    ];
    $tagIndex[$aid][$tagId] = true;
  }
}

$items = array_values($items);

log_event('api', 'associations.response', [
  'page' => $page,
  'pageSize' => $pageSize,
  'returned' => count($items),
  'total' => $total,
]);

json_out(200, [
  'items' => $items,
  'total' => $total,
  'page' => $page,
  'pageSize' => $pageSize,
]);
