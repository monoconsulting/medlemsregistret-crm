<?php
/**
 * Associations endpoint
 *
 * Provides CRUD-style access to the Association catalogue while mirroring the
 * legacy TRPC contract used by the Next.js dashboard.
 *
 * Methods:
 *   GET    - list associations with filters and pagination
 *   POST   - create a manual association entry
 *   PUT    - update fields on an association
 *   DELETE - soft delete an association
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

switch ($method) {
  case 'GET':
    handle_list_associations();
    break;
  case 'POST':
    handle_create_association();
    break;
  case 'PUT':
  case 'PATCH':
    handle_update_association();
    break;
  case 'DELETE':
    handle_delete_association();
    break;
  default:
    json_out(405, ['error' => 'Method not allowed']);
}

/**
 * GET handler.
 *
 * @return void
 */
function handle_list_associations(): void {
  require_auth();

  $page = max(1, (int)($_GET['page'] ?? 1));
  $pageSize = (int)($_GET['pageSize'] ?? 20);
  if ($pageSize < 1) {
    $pageSize = 20;
  } elseif ($pageSize > 100) {
    $pageSize = 100;
  }
  $offset = ($page - 1) * $pageSize;

  $sortKey = $_GET['sort'] ?? 'updated_desc';
  $sortSql = build_sort_sql($sortKey);

  $whereParts = ['a.deletedAt IS NULL'];
  $joinParts = [];
  $params = [];
  $types = '';

  list($whereParts, $params, $types, $joinParts) = apply_filters($whereParts, $params, $types, $joinParts);

  $whereSql = count($whereParts) ? 'WHERE ' . implode(' AND ', $whereParts) : '';
  $joinSql = implode(' ', array_unique($joinParts));

  // Count total rows for pagination.
  $countSql = "SELECT COUNT(DISTINCT a.id) AS total
               FROM Association a
               LEFT JOIN Municipality m ON m.id = a.municipalityId
               $joinSql
               $whereSql";
  $stmtCount = db()->prepare($countSql);
  bind_all($stmtCount, $types, $params);
  $stmtCount->execute();
  $total = (int)($stmtCount->get_result()->fetch_assoc()['total'] ?? 0);

  // Fetch rows with pagination.
  $selectSql = "SELECT DISTINCT
                  a.id,
                  a.sourceSystem AS source_system,
                  a.municipality AS municipality,
                  a.municipalityId AS municipality_id,
                  CONVERT(m.name USING utf8mb4) AS municipality_name,
                  CONVERT(a.name USING utf8mb4) AS name,
                  a.orgNumber AS org_number,
                  a.types AS types_json,
                  a.activities AS activities_json,
                  a.categories AS categories_json,
                  a.crmStatus AS crm_status,
                  a.pipeline,
                  a.isMember AS is_member,
                  a.memberSince AS member_since,
                  CONVERT(a.email USING utf8mb4) AS email,
                  CONVERT(a.phone USING utf8mb4) AS phone,
                  CONVERT(a.streetAddress USING utf8mb4) AS street_address,
                  CONVERT(a.postalCode USING utf8mb4) AS postal_code,
                  CONVERT(a.city USING utf8mb4) AS city,
                  CONVERT(a.homepageUrl USING utf8mb4) AS website,
                  a.description AS description_json,
                  CONVERT(a.description USING utf8mb4) AS description_raw,
                  CONVERT(a.descriptionFreeText USING utf8mb4) AS description_free_text,
                  a.extras AS extras_json,
                  a.assignedToId AS assigned_to_id,
                  CONVERT(u.name USING utf8mb4) AS assigned_to_name,
                  CONVERT(u.email USING utf8mb4) AS assigned_to_email,
                  a.createdAt AS created_at,
                  a.updatedAt AS updated_at,
                  a.deletedAt AS deleted_at,
                  a.detailUrl AS detail_url,
                  (SELECT COUNT(1) FROM Contact c WHERE c.associationId = a.id) AS contacts_count,
                  (SELECT COUNT(1) FROM Note n WHERE n.associationId = a.id) AS notes_count,
                  (SELECT JSON_OBJECT(
                     'id', c.id,
                     'name', CONVERT(c.name USING utf8mb4),
                     'role', CONVERT(c.role USING utf8mb4),
                     'email', CONVERT(c.email USING utf8mb4),
                     'phone', CONVERT(c.phone USING utf8mb4),
                     'mobile', CONVERT(c.mobile USING utf8mb4),
                     'is_primary', c.isPrimary
                   )
                   FROM Contact c
                   WHERE c.associationId = a.id
                   ORDER BY c.isPrimary DESC, c.updatedAt DESC, c.createdAt DESC
                   LIMIT 1) AS primary_contact_json,
                  (SELECT JSON_OBJECT(
                     'id', act.id,
                     'type', act.type,
                     'description', CONVERT(act.description USING utf8mb4),
                     'created_at', act.createdAt,
                     'metadata', act.metadata
                   )
                   FROM Activity act
                   WHERE act.associationId = a.id
                   ORDER BY act.createdAt DESC
                   LIMIT 1) AS recent_activity_json
               FROM Association a
               LEFT JOIN Municipality m ON m.id = a.municipalityId
               LEFT JOIN User u ON u.id = a.assignedToId
               $joinSql
               $whereSql
               $sortSql
               LIMIT ? OFFSET ?";

  $stmt = db()->prepare($selectSql);
  $listParams = $params;
  $listTypes = $types . 'ii';
  $listParams[] = $pageSize;
  $listParams[] = $offset;
  bind_all($stmt, $listTypes, $listParams);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  $assocIds = [];
  while ($row = $res->fetch_assoc()) {
    $id = (string)$row['id'];
    $items[$id] = map_row_to_association($row);
    $assocIds[] = $id;
  }

  if ($assocIds) {
    hydrate_tags($items, $assocIds);
  }

  $payload = [
    'items' => array_values($items),
    'total' => $total,
    'page' => $page,
    'pageSize' => $pageSize,
  ];

  log_event('api', 'associations.list', [
    'page' => $page,
    'pageSize' => $pageSize,
    'returned' => count($payload['items']),
    'total' => $total,
  ]);

  json_out(200, $payload);
}

/**
 * POST handler.
 *
 * @return void
 */
function handle_create_association(): void {
  require_auth();
  require_csrf();
  rate_limit('associations-create', 40, 60);

  $body = read_json();

  $name = normalize_nullable_string($body['name'] ?? null, 255);
  if ($name === '') {
    json_out(400, ['error' => 'Name is required']);
  }

  $municipalityId = normalize_nullable_string($body['municipality_id'] ?? null, 36);
  $municipality = normalize_nullable_string($body['municipality'] ?? null, 255);
  $orgNumber = normalize_nullable_string($body['org_number'] ?? null, 60);
  $status = normalize_association_status($body['status'] ?? null);
  $pipeline = normalize_pipeline($body['pipeline'] ?? null);
  $isMember = normalize_bool($body['is_member'] ?? false);
  $memberSince = normalize_date_string($body['member_since'] ?? null);
  $email = normalize_email($body['email'] ?? null);
  $phone = normalize_nullable_string($body['phone'] ?? null, 64);
  $street = normalize_nullable_string($body['street_address'] ?? null, 255);
  $postal = normalize_nullable_string($body['postal_code'] ?? null, 32);
  $city = normalize_nullable_string($body['city'] ?? null, 255);
  $detailUrl = normalize_nullable_string($body['detail_url'] ?? null, 1024);
  $website = normalize_url($body['website'] ?? null);
  $descriptionFree = normalize_nullable_string($body['description_free_text'] ?? null, 5000);
  $description = encode_json_field($body['description'] ?? null);
  $types = encode_json_array($body['types'] ?? []);
  $activities = encode_json_array($body['activities'] ?? []);
  $categories = encode_json_array($body['categories'] ?? []);
  $extras = encode_json_field($body['extras'] ?? null);

  $assignedToId = normalize_nullable_string($body['assigned_to_id'] ?? null, 36);
  if ($assignedToId !== '' && !user_exists($assignedToId)) {
    json_out(400, ['error' => 'Assigned user not found']);
  }

  $id = generate_id();

  $sql = "INSERT INTO Association (
            id,
            sourceSystem,
            municipalityId,
            municipality,
            scrapeRunId,
            scrapedAt,
            detailUrl,
            name,
            orgNumber,
            types,
            activities,
            categories,
            homepageUrl,
            streetAddress,
            postalCode,
            city,
            email,
            phone,
            description,
            descriptionFreeText,
            crmStatus,
            isMember,
            memberSince,
            pipeline,
            assignedToId,
            extras,
            createdAt,
            updatedAt
          ) VALUES (
            ?, 'MANUAL', ?, ?, NULL, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
          )";

  $stmt = db()->prepare($sql);
  $stmt->bind_param(
    'ssssssssssssssssssssisssss',
    $id,
    $municipalityId !== '' ? $municipalityId : null,
    $municipality !== '' ? $municipality : null,
    $detailUrl !== '' ? $detailUrl : null,
    $name,
    $orgNumber !== '' ? $orgNumber : null,
    $types,
    $activities,
    $categories,
    $website !== '' ? $website : null,
    $street !== '' ? $street : null,
    $postal !== '' ? $postal : null,
    $city !== '' ? $city : null,
    $email !== '' ? $email : null,
    $phone !== '' ? $phone : null,
    $description,
    $descriptionFree !== '' ? $descriptionFree : null,
    $status !== '' ? $status : 'UNCONTACTED',
    $isMember,
    $memberSince,
    $pipeline,
    $assignedToId !== '' ? $assignedToId : null,
    $extras
  );
  $stmt->execute();

  log_event('api', 'associations.created', ['id' => $id]);
  json_out(200, ['id' => $id]);
}

/**
 * PUT handler.
 *
 * @return void
 */
function handle_update_association(): void {
  require_auth();
  require_csrf();
  rate_limit('associations-update', 120, 60);

  $body = read_json();
  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'Missing association id']);
  }

  $fields = [];
  $params = [];
  $types = '';

  $name = normalize_nullable_string($body['name'] ?? null, 255);
  if ($name !== '') {
    $fields[] = 'name = ?';
    $params[] = $name;
    $types .= 's';
  }

  $map = [
    'municipality_id' => ['column' => 'municipalityId', 'max' => 36],
    'municipality' => ['column' => 'municipality', 'max' => 255],
    'org_number' => ['column' => 'orgNumber', 'max' => 60],
    'street_address' => ['column' => 'streetAddress', 'max' => 255],
    'postal_code' => ['column' => 'postalCode', 'max' => 32],
    'city' => ['column' => 'city', 'max' => 255],
    'detail_url' => ['column' => 'detailUrl', 'max' => 1024],
  ];
  foreach ($map as $key => $meta) {
    if (array_key_exists($key, $body)) {
      $value = normalize_nullable_string($body[$key], $meta['max']);
      $fields[] = "{$meta['column']} = ?";
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

  if (array_key_exists('phone', $body)) {
    $phone = normalize_nullable_string($body['phone'], 64);
    $fields[] = 'phone = ?';
    $params[] = $phone !== '' ? $phone : null;
    $types .= 's';
  }

  if (array_key_exists('website', $body)) {
    $website = normalize_url($body['website']);
    $fields[] = 'homepageUrl = ?';
    $params[] = $website !== '' ? $website : null;
    $types .= 's';
  }

  if (array_key_exists('status', $body)) {
    $status = normalize_association_status($body['status']);
    $fields[] = 'crmStatus = ?';
    $params[] = $status !== '' ? $status : null;
    $types .= 's';
  }

  if (array_key_exists('pipeline', $body)) {
    $pipeline = normalize_pipeline($body['pipeline']);
    $fields[] = 'pipeline = ?';
    $params[] = $pipeline;
    $types .= 's';
  }

  if (array_key_exists('is_member', $body)) {
    $isMember = normalize_bool($body['is_member']);
    $fields[] = 'isMember = ?';
    $params[] = $isMember;
    $types .= 'i';
  }

  if (array_key_exists('member_since', $body)) {
    $memberSince = normalize_date_string($body['member_since']);
    $fields[] = 'memberSince = ?';
    $params[] = $memberSince;
    $types .= 's';
  }

  if (array_key_exists('types', $body)) {
    $fields[] = 'types = ?';
    $params[] = encode_json_array($body['types']);
    $types .= 's';
  }

  if (array_key_exists('activities', $body)) {
    $fields[] = 'activities = ?';
    $params[] = encode_json_array($body['activities']);
    $types .= 's';
  }

  if (array_key_exists('categories', $body)) {
    $fields[] = 'categories = ?';
    $params[] = encode_json_array($body['categories']);
    $types .= 's';
  }

  if (array_key_exists('extras', $body)) {
    $fields[] = 'extras = ?';
    $params[] = encode_json_field($body['extras']);
    $types .= 's';
  }

  if (array_key_exists('description_free_text', $body)) {
    $desc = normalize_nullable_string($body['description_free_text'], 5000);
    $fields[] = 'descriptionFreeText = ?';
    $params[] = $desc !== '' ? $desc : null;
    $types .= 's';
  }

  if (array_key_exists('description', $body)) {
    $fields[] = 'description = ?';
    $params[] = encode_json_field($body['description']);
    $types .= 's';
  }

  if (array_key_exists('assigned_to_id', $body)) {
    $assigned = normalize_nullable_string($body['assigned_to_id'], 36);
    if ($assigned !== '' && !user_exists($assigned)) {
      json_out(400, ['error' => 'Assigned user not found']);
    }
    $fields[] = 'assignedToId = ?';
    $params[] = $assigned !== '' ? $assigned : null;
    $types .= 's';
  }

  if (!count($fields)) {
    json_out(400, ['error' => 'No fields to update']);
  }

  $fields[] = 'updatedAt = NOW()';

  $sql = 'UPDATE Association SET ' . implode(', ', $fields) . ' WHERE id = ? LIMIT 1';
  $params[] = $id;
  $types .= 's';

  $stmt = db()->prepare($sql);
  bind_all($stmt, $types, $params);
  $stmt->execute();

  log_event('api', 'associations.updated', ['id' => $id]);
  json_out(200, ['ok' => true]);
}

/**
 * DELETE handler.
 *
 * @return void
 */
function handle_delete_association(): void {
  require_auth();
  require_csrf();
  rate_limit('associations-delete', 40, 60);

  $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
  if ($id === '') {
    json_out(400, ['error' => 'Missing association id']);
  }

  $sql = 'UPDATE Association SET deletedAt = NOW(), isDeleted = 1, updatedAt = NOW() WHERE id = ? LIMIT 1';
  $stmt = db()->prepare($sql);
  $stmt->bind_param('s', $id);
  $stmt->execute();

  log_event('api', 'associations.deleted', ['id' => $id]);
  json_out(200, ['ok' => true]);
}

/**
 * Applies query parameter filters to the SQL builder.
 *
 * @param array<int, string> $where
 * @param array<int, mixed> $params
 * @param string $types
 * @param array<int, string> $joins
 * @return array{0: array<int, string>, 1: array<int, mixed>, 2: string, 3: array<int, string>}
 */
function apply_filters(array $where, array $params, string $types, array $joins): array {
  $search = trim((string)($_GET['q'] ?? ''));
  if ($search !== '') {
    $like = '%' . $search . '%';
    $where[] = '('
      . 'a.name LIKE ? OR a.orgNumber LIKE ? OR a.streetAddress LIKE ? OR a.city LIKE ? OR '
      . 'a.municipality LIKE ? OR a.email LIKE ? OR a.phone LIKE ? OR a.descriptionFreeText LIKE ?'
      . ')';
    for ($i = 0; $i < 8; $i++) {
      $params[] = $like;
      $types .= 's';
    }
  }

  $municipality = trim((string)($_GET['municipality'] ?? ''));
  if ($municipality !== '') {
    $where[] = '(a.municipality = ? OR m.name = ?)';
    $params[] = $municipality;
    $params[] = $municipality;
    $types .= 'ss';
  }

  $municipalityIds = get_query_array('municipalityIds');
  if ($municipalityIds) {
    $placeholders = implode(',', array_fill(0, count($municipalityIds), '?'));
    $where[] = "a.municipalityId IN ($placeholders)";
    foreach ($municipalityIds as $value) {
      $params[] = $value;
      $types .= 's';
    }
  }

  $status = trim((string)($_GET['status'] ?? ''));
  if ($status !== '') {
    $where[] = 'a.crmStatus = ?';
    $params[] = normalize_association_status($status);
    $types .= 's';
  }

  $crmStatuses = array_map('normalize_association_status', get_query_array('crmStatuses'));
  if ($crmStatuses) {
    $placeholders = implode(',', array_fill(0, count($crmStatuses), '?'));
    $where[] = "a.crmStatus IN ($placeholders)";
    foreach ($crmStatuses as $value) {
      $params[] = $value;
      $types .= 's';
    }
  }

  $pipeline = trim((string)($_GET['pipeline'] ?? ''));
  if ($pipeline !== '') {
    $where[] = 'a.pipeline = ?';
    $params[] = normalize_pipeline($pipeline);
    $types .= 's';
  }

  $pipelines = array_map('normalize_pipeline', get_query_array('pipelines'));
  if ($pipelines) {
    $placeholders = implode(',', array_fill(0, count($pipelines), '?'));
    $where[] = "a.pipeline IN ($placeholders)";
    foreach ($pipelines as $value) {
      $params[] = $value;
      $types .= 's';
    }
  }

  $typeFilter = trim((string)($_GET['type'] ?? ''));
  if ($typeFilter !== '') {
    $where[] = 'a.types LIKE CONCAT("%", ?, "%")';
    $params[] = $typeFilter;
    $types .= 's';
  }

  $typesFilter = get_query_array('types');
  if ($typesFilter) {
    $conditions = [];
    foreach ($typesFilter as $value) {
      $conditions[] = 'a.types LIKE CONCAT("%", ?, "%")';
      $params[] = $value;
      $types .= 's';
    }
    $where[] = '(' . implode(' OR ', $conditions) . ')';
  }

  $activitiesFilter = get_query_array('activities');
  if ($activitiesFilter) {
    $conditions = [];
    foreach ($activitiesFilter as $value) {
      $conditions[] = 'a.activities LIKE CONCAT("%", ?, "%")';
      $params[] = $value;
      $types .= 's';
    }
    $where[] = '(' . implode(' OR ', $conditions) . ')';
  }

  $tags = get_query_array('tags');
  if ($tags) {
    $placeholders = implode(',', array_fill(0, count($tags), '?'));
    $joins[] = 'INNER JOIN _AssociationTags at ON at.A = a.id';
    $where[] = "at.B IN ($placeholders)";
    foreach ($tags as $tagId) {
      $params[] = $tagId;
      $types .= 's';
    }
  }

  $hasEmail = get_query_bool('hasEmail');
  if ($hasEmail !== null) {
    if ($hasEmail) {
      $where[] = "(a.email IS NOT NULL AND a.email <> '')";
    } else {
      $where[] = "(a.email IS NULL OR a.email = '')";
    }
  }

  $hasPhone = get_query_bool('hasPhone');
  if ($hasPhone !== null) {
    if ($hasPhone) {
      $where[] = "(a.phone IS NOT NULL AND a.phone <> '')";
    } else {
      $where[] = "(a.phone IS NULL OR a.phone = '')";
    }
  }

  $isMember = get_query_bool('isMember');
  if ($isMember !== null) {
    $where[] = 'a.isMember = ?';
    $params[] = $isMember ? 1 : 0;
    $types .= 'i';
  }

  $assignedTo = trim((string)($_GET['assignedToId'] ?? ''));
  if ($assignedTo !== '') {
    $where[] = 'a.assignedToId = ?';
    $params[] = $assignedTo;
    $types .= 's';
  }

  $dateFrom = normalize_date_string($_GET['dateFrom'] ?? null);
  $dateTo = normalize_date_string($_GET['dateTo'] ?? null);
  if ($dateFrom !== null) {
    $where[] = 'a.createdAt >= ?';
    $params[] = $dateFrom;
    $types .= 's';
  }
  if ($dateTo !== null) {
    $where[] = 'a.createdAt <= ?';
    $params[] = $dateTo;
    $types .= 's';
  }

  $lastActivityDays = isset($_GET['lastActivityDays']) ? (int)$_GET['lastActivityDays'] : null;
  if ($lastActivityDays !== null && $lastActivityDays > 0) {
    $since = (new DateTimeImmutable())->sub(new DateInterval('P' . $lastActivityDays . 'D'))->format('Y-m-d H:i:s');
    $where[] = 'EXISTS (SELECT 1 FROM Activity act WHERE act.associationId = a.id AND act.createdAt >= ?)';
    $params[] = $since;
    $types .= 's';
  }

  return [$where, $params, $types, $joins];
}

/**
 * Maps DB row to API response.
 *
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function map_row_to_association(array $row): array {
  $id = (string)$row['id'];

  $description = decode_json_field($row['description_json']);
  if ($description === null && $row['description_raw'] !== null) {
    $description = normalize_utf8($row['description_raw']);
  }

  $recentActivity = decode_json_field($row['recent_activity_json']);
  if (is_array($recentActivity) && isset($recentActivity['description'])) {
    $recentActivity['description'] = normalize_utf8($recentActivity['description']);
  }

  $primaryContact = decode_json_field($row['primary_contact_json']);
  if (is_array($primaryContact)) {
    foreach (['name', 'role', 'email', 'phone', 'mobile'] as $field) {
      if (isset($primaryContact[$field])) {
        $primaryContact[$field] = normalize_utf8($primaryContact[$field]);
      }
    }
  } else {
    $primaryContact = null;
  }

  $assigned = null;
  if ($row['assigned_to_id'] !== null) {
    $assigned = [
      'id' => (string)$row['assigned_to_id'],
      'name' => normalize_utf8($row['assigned_to_name'] ?? null),
      'email' => normalize_utf8($row['assigned_to_email'] ?? null),
    ];
  }

  return [
    'id' => $id,
    'name' => normalize_utf8($row['name'] ?? null),
    'municipality_id' => $row['municipality_id'] !== null ? (string)$row['municipality_id'] : null,
    'municipality_name' => normalize_utf8($row['municipality_name'] ?? null),
    'municipality' => normalize_utf8($row['municipality'] ?? null),
    'source_system' => normalize_utf8($row['source_system'] ?? null),
    'org_number' => normalize_utf8($row['org_number'] ?? null),
    'type' => implode(', ', decode_json_array($row['types_json'])),
    'types' => decode_json_array($row['types_json']),
    'status' => normalize_utf8($row['crm_status'] ?? null),
    'activities' => decode_json_array($row['activities_json']),
    'categories' => decode_json_array($row['categories_json']),
    'crm_status' => normalize_utf8($row['crm_status'] ?? null),
    'pipeline' => normalize_utf8($row['pipeline'] ?? null),
    'is_member' => (bool)$row['is_member'],
    'member_since' => $row['member_since'],
    'email' => normalize_utf8($row['email'] ?? null),
    'phone' => normalize_utf8($row['phone'] ?? null),
    'address' => normalize_utf8($row['street_address'] ?? null),
    'street_address' => normalize_utf8($row['street_address'] ?? null),
    'postal_code' => normalize_utf8($row['postal_code'] ?? null),
    'city' => normalize_utf8($row['city'] ?? null),
    'website' => normalize_utf8($row['website'] ?? null),
    'detail_url' => normalize_utf8($row['detail_url'] ?? null),
    'description' => $description,
    'description_free_text' => normalize_utf8($row['description_free_text'] ?? null),
    'extras' => decode_json_field($row['extras_json']),
    'tags' => [],
    'primary_contact' => $primaryContact,
    'contacts_count' => (int)($row['contacts_count'] ?? 0),
    'notes_count' => (int)($row['notes_count'] ?? 0),
    'recent_activity' => $recentActivity,
    'assigned_to' => $assigned,
    'created_at' => $row['created_at'],
    'updated_at' => $row['updated_at'],
    'deleted_at' => $row['deleted_at'],
  ];
}

/**
 * Hydrates tag arrays for the associations.
 *
 * @param array<string, array<string, mixed>> $items
 * @param array<int, string> $assocIds
 * @return void
 */
function hydrate_tags(array &$items, array $assocIds): void {
  $placeholders = implode(',', array_fill(0, count($assocIds), '?'));
  $sql = "SELECT at.A AS association_id,
                 t.id,
                 CONVERT(t.name USING utf8mb4) AS name
          FROM _AssociationTags at
          INNER JOIN Tag t ON t.id = at.B
          WHERE at.A IN ($placeholders)
          ORDER BY t.name ASC";
  $stmt = db()->prepare($sql);
  $typeString = str_repeat('s', count($assocIds));
  bind_all($stmt, $typeString, $assocIds);
  $stmt->execute();
  $res = $stmt->get_result();
  while ($row = $res->fetch_assoc()) {
    $aid = (string)$row['association_id'];
    if (!isset($items[$aid])) {
      continue;
    }
    $items[$aid]['tags'][] = [
      'id' => (string)$row['id'],
      'name' => normalize_utf8($row['name'] ?? null),
    ];
  }
}

/**
 * Returns ORDER BY clause for supported sort keys.
 *
 * @param string|null $sort
 * @return string
 */
function build_sort_sql(?string $sort): string {
  switch ($sort) {
    case 'updated_asc':
      return 'ORDER BY a.updatedAt ASC';
    case 'updated_desc':
      return 'ORDER BY a.updatedAt DESC';
    case 'name_asc':
      return 'ORDER BY a.name ASC';
    case 'name_desc':
      return 'ORDER BY a.name DESC';
    case 'created_asc':
      return 'ORDER BY a.createdAt ASC';
    case 'created_desc':
      return 'ORDER BY a.createdAt DESC';
    case 'crm_status_asc':
      return 'ORDER BY a.crmStatus ASC';
    case 'crm_status_desc':
      return 'ORDER BY a.crmStatus DESC';
    case 'pipeline_asc':
      return 'ORDER BY a.pipeline ASC';
    case 'pipeline_desc':
      return 'ORDER BY a.pipeline DESC';
    case 'recent_activity_desc':
      return 'ORDER BY recent_activity_json DESC';
    case 'recent_activity_asc':
      return 'ORDER BY recent_activity_json ASC';
    default:
      return 'ORDER BY a.updatedAt DESC';
  }
}

/**
 * Helper to bind parameters with references.
 *
 * @param mysqli_stmt $stmt
 * @param string $types
 * @param array<int, mixed> $params
 * @return void
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

/**
 * Parses query array parameter (supports array or CSV formats).
 *
 * @param string $key
 * @return string[]
 */
function get_query_array(string $key): array {
  if (!isset($_GET[$key])) {
    return [];
  }
  $value = $_GET[$key];
  if (is_array($value)) {
    $items = $value;
  } else {
    $items = explode(',', (string)$value);
  }
  $items = array_map('trim', $items);
  $items = array_filter($items, fn($item) => $item !== '');
  return array_values($items);
}

/**
 * Parses query bool parameter returning null when absent.
 *
 * @param string $key
 * @return bool|null
 */
function get_query_bool(string $key): ?bool {
  if (!isset($_GET[$key])) {
    return null;
  }
  $value = $_GET[$key];
  if (is_bool($value)) {
    return $value;
  }
  $string = strtolower(trim((string)$value));
  if (in_array($string, ['1', 'true', 'yes', 'on'], true)) {
    return true;
  }
  if (in_array($string, ['0', 'false', 'no', 'off'], true)) {
    return false;
  }
  return null;
}

/**
 * Encodes array input as JSON string.
 *
 * @param mixed $value
 * @return string
 */
function encode_json_array($value): string {
  if (!is_array($value)) {
    return '[]';
  }
  $clean = [];
  foreach ($value as $entry) {
    if (is_string($entry) || is_numeric($entry)) {
      $candidate = trim((string)$entry);
      if ($candidate !== '') {
        $clean[] = $candidate;
      }
    }
  }
  return json_encode(array_values($clean), JSON_UNESCAPED_UNICODE) ?: '[]';
}

/**
 * Encodes mixed value as JSON or returns null.
 *
 * @param mixed $value
 * @return ?string
 */
function encode_json_field($value): ?string {
  if ($value === null || $value === '' || (is_array($value) && !count($value))) {
    return null;
  }
  $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
  return $encoded === false ? null : $encoded;
}

/**
 * Decodes a JSON field to associative array.
 *
 * @param mixed $value
 * @return mixed
 */
function decode_json_field($value) {
  if ($value === null || $value === '') {
    return null;
  }
  $decoded = json_decode((string)$value, true);
  if (json_last_error() !== JSON_ERROR_NONE) {
    return null;
  }
  return $decoded;
}

/**
 * Decodes JSON array to string array.
 *
 * @param mixed $value
 * @return string[]
 */
function decode_json_array($value): array {
  $decoded = decode_json_field($value);
  if (!is_array($decoded)) {
    return [];
  }
  $items = [];
  foreach ($decoded as $entry) {
    if (is_string($entry) || is_numeric($entry)) {
      $candidate = trim((string)$entry);
      if ($candidate !== '') {
        $items[] = $candidate;
      }
    }
  }
  return array_values($items);
}
