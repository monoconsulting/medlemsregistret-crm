<?php
/**
 * Groups endpoint
 *
 * Provides CRUD-style access to Groups and GroupMemberships for bulk association management.
 *
 * Methods:
 *   GET    - list groups with membership counts
 *   POST   - create a new group OR add member to group (based on 'action' parameter)
 *   PUT    - update group fields
 *   DELETE - soft delete a group
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

switch ($method) {
  case 'GET':
    // If id parameter is provided, return single group with memberships
    if (isset($_GET['id']) && $_GET['id'] !== '') {
      handle_get_group_by_id();
    } else {
      handle_list_groups();
    }
    break;
  case 'POST':
    $body = read_json();
    $action = $body['action'] ?? 'create';
    if ($action === 'addMember') {
      handle_add_member();
    } elseif ($action === 'removeMember') {
      handle_remove_member();
    } elseif ($action === 'export') {
      handle_export_members();
    } else {
      handle_create_group();
    }
    break;
  case 'PUT':
  case 'PATCH':
    handle_update_group();
    break;
  case 'DELETE':
    handle_delete_group();
    break;
  default:
    json_out(405, ['error' => 'Method not allowed']);
}

/**
 * GET handler - list all non-deleted groups with membership counts.
 *
 * @return void
 */
function handle_list_groups(): void {
  require_auth();

  $sql = "SELECT
            g.id,
            CONVERT(g.name USING utf8mb4) AS name,
            CONVERT(g.description USING utf8mb4) AS description,
            g.searchQuery,
            g.autoUpdate,
            g.createdById,
            g.createdAt,
            g.updatedAt,
            g.deletedAt,
            g.isDeleted,
            COUNT(gm.id) AS membership_count
          FROM `Group` g
          LEFT JOIN GroupMembership gm ON gm.groupId = g.id
          WHERE g.isDeleted = 0
          GROUP BY g.id
          ORDER BY g.name ASC";

  $stmt = db()->prepare($sql);
  $stmt->execute();
  $res = $stmt->get_result();

  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'name' => normalize_utf8($row['name']),
      'description' => normalize_utf8($row['description']),
      'searchQuery' => $row['searchQuery'] ? json_decode($row['searchQuery'], true) : null,
      'autoUpdate' => (bool)$row['autoUpdate'],
      'createdById' => (string)$row['createdById'],
      'createdAt' => $row['createdAt'],
      'updatedAt' => $row['updatedAt'],
      'deletedAt' => $row['deletedAt'],
      'isDeleted' => (bool)$row['isDeleted'],
      '_count' => [
        'memberships' => (int)$row['membership_count']
      ]
    ];
  }

  log_event('api', 'groups.list', ['returned' => count($items)]);
  json_out(200, $items);
}

/**
 * GET handler (with id param) - get single group with memberships.
 *
 * @return void
 */
function handle_get_group_by_id(): void {
  require_auth();

  $id = normalize_nullable_string($_GET['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'Group id is required']);
  }

  // Get group with memberships and associations
  $sql = "SELECT
            g.id,
            CONVERT(g.name USING utf8mb4) AS name,
            CONVERT(g.description USING utf8mb4) AS description,
            g.searchQuery,
            g.autoUpdate,
            g.createdById,
            g.createdAt,
            g.updatedAt,
            g.deletedAt,
            g.isDeleted,
            u.id AS createdBy_id,
            CONVERT(u.name USING utf8mb4) AS createdBy_name,
            CONVERT(u.email USING utf8mb4) AS createdBy_email
          FROM `Group` g
          LEFT JOIN User u ON u.id = g.createdById
          WHERE g.id = ? AND g.isDeleted = 0
          LIMIT 1";

  $stmt = db()->prepare($sql);
  $stmt->bind_param('s', $id);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();

  if (!$row) {
    json_out(404, ['error' => 'Group not found or deleted']);
  }

  // Get memberships
  $membershipsSql = "SELECT
                      gm.id,
                      gm.groupId,
                      gm.associationId,
                      gm.addedAt,
                      a.id AS assoc_id,
                      CONVERT(a.name USING utf8mb4) AS assoc_name,
                      CONVERT(a.municipality USING utf8mb4) AS assoc_municipality,
                      a.crmStatus AS assoc_crmStatus
                    FROM GroupMembership gm
                    LEFT JOIN Association a ON a.id = gm.associationId AND a.deletedAt IS NULL
                    WHERE gm.groupId = ?
                    ORDER BY gm.addedAt DESC";

  $membershipsStmt = db()->prepare($membershipsSql);
  $membershipsStmt->bind_param('s', $id);
  $membershipsStmt->execute();
  $membershipsRes = $membershipsStmt->get_result();

  $memberships = [];
  while ($membershipRow = $membershipsRes->fetch_assoc()) {
    $membership = [
      'id' => (string)$membershipRow['id'],
      'groupId' => (string)$membershipRow['groupId'],
      'associationId' => (string)$membershipRow['associationId'],
      'addedAt' => $membershipRow['addedAt'],
    ];

    if ($membershipRow['assoc_id']) {
      $membership['association'] = [
        'id' => (string)$membershipRow['assoc_id'],
        'name' => normalize_utf8($membershipRow['assoc_name']),
        'municipality' => normalize_utf8($membershipRow['assoc_municipality']),
        'crmStatus' => $membershipRow['assoc_crmStatus'],
      ];
    }

    $memberships[] = $membership;
  }

  $result = [
    'id' => (string)$row['id'],
    'name' => normalize_utf8($row['name']),
    'description' => normalize_utf8($row['description']),
    'searchQuery' => $row['searchQuery'] ? json_decode($row['searchQuery'], true) : null,
    'autoUpdate' => (bool)$row['autoUpdate'],
    'createdById' => (string)$row['createdById'],
    'createdAt' => $row['createdAt'],
    'updatedAt' => $row['updatedAt'],
    'deletedAt' => $row['deletedAt'],
    'isDeleted' => (bool)$row['isDeleted'],
    'createdBy' => [
      'id' => (string)$row['createdBy_id'],
      'name' => normalize_utf8($row['createdBy_name']),
      'email' => normalize_utf8($row['createdBy_email']),
    ],
    'memberships' => $memberships,
    '_count' => [
      'memberships' => count($memberships)
    ]
  ];

  log_event('api', 'groups.getById', ['id' => $id, 'memberships' => count($memberships)]);
  json_out(200, $result);
}

/**
 * POST handler - create a new group.
 *
 * @return void
 */
function handle_create_group(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-create', 20, 60);

  $body = read_json();
  $userId = $_SESSION['uid'];

  $name = normalize_nullable_string($body['name'] ?? null, 255);
  if ($name === '') {
    json_out(400, ['error' => 'Group name is required']);
  }

  $description = normalize_nullable_string($body['description'] ?? null, 5000);
  $autoUpdate = normalize_bool($body['autoUpdate'] ?? false);
  $searchQuery = isset($body['searchQuery']) ? json_encode($body['searchQuery']) : null;

  $id = generate_id();

  $sql = "INSERT INTO `Group` (
            id,
            name,
            description,
            searchQuery,
            autoUpdate,
            createdById,
            createdAt,
            updatedAt,
            isDeleted
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)";

  $stmt = db()->prepare($sql);
  $descValue = $description !== '' ? $description : null;
  $autoUpdateInt = $autoUpdate ? 1 : 0;
  $stmt->bind_param(
    'ssssis',
    $id,
    $name,
    $descValue,
    $searchQuery,
    $autoUpdateInt,
    $userId
  );
  $stmt->execute();

  log_event('api', 'groups.created', ['id' => $id, 'name' => $name]);
  json_out(200, ['id' => $id]);
}

/**
 * POST handler (action=addMember) - add an association to a group.
 *
 * @return void
 */
function handle_add_member(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-addMember', 100, 60);

  $body = read_json();

  $groupId = normalize_nullable_string($body['groupId'] ?? null, 36);
  $associationId = normalize_nullable_string($body['associationId'] ?? null, 36);

  if ($groupId === '' || $associationId === '') {
    json_out(400, ['error' => 'groupId and associationId are required']);
  }

  // Check if group exists and is not deleted
  $checkGroupSql = "SELECT id FROM `Group` WHERE id = ? AND isDeleted = 0";
  $stmtGroup = db()->prepare($checkGroupSql);
  $stmtGroup->bind_param('s', $groupId);
  $stmtGroup->execute();
  if ($stmtGroup->get_result()->num_rows === 0) {
    json_out(404, ['error' => 'Group not found']);
  }

  // Check if association exists
  $checkAssocSql = "SELECT id FROM Association WHERE id = ? AND deletedAt IS NULL";
  $stmtAssoc = db()->prepare($checkAssocSql);
  $stmtAssoc->bind_param('s', $associationId);
  $stmtAssoc->execute();
  if ($stmtAssoc->get_result()->num_rows === 0) {
    json_out(404, ['error' => 'Association not found']);
  }

  // Check if membership already exists
  $checkMemberSql = "SELECT id FROM GroupMembership WHERE groupId = ? AND associationId = ?";
  $stmtCheck = db()->prepare($checkMemberSql);
  $stmtCheck->bind_param('ss', $groupId, $associationId);
  $stmtCheck->execute();
  if ($stmtCheck->get_result()->num_rows > 0) {
    // Already exists, return success
    json_out(200, ['message' => 'Membership already exists']);
    return;
  }

  // Create membership
  $id = generate_id();
  $insertSql = "INSERT INTO GroupMembership (id, groupId, associationId, addedAt) VALUES (?, ?, ?, NOW())";
  $stmtInsert = db()->prepare($insertSql);
  $stmtInsert->bind_param('sss', $id, $groupId, $associationId);
  $stmtInsert->execute();

  log_event('api', 'groups.addMember', ['groupId' => $groupId, 'associationId' => $associationId]);
  json_out(200, ['id' => $id]);
}

/**
 * POST handler (action=removeMember) - remove an association from a group.
 *
 * @return void
 */
function handle_remove_member(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-removeMember', 100, 60);

  $body = read_json();

  $groupId = normalize_nullable_string($body['groupId'] ?? null, 36);
  $associationId = normalize_nullable_string($body['associationId'] ?? null, 36);

  if ($groupId === '' || $associationId === '') {
    json_out(400, ['error' => 'groupId and associationId are required']);
  }

  // Check if group exists and is not deleted
  $checkGroupSql = "SELECT id FROM `Group` WHERE id = ? AND isDeleted = 0";
  $stmtGroup = db()->prepare($checkGroupSql);
  $stmtGroup->bind_param('s', $groupId);
  $stmtGroup->execute();
  if ($stmtGroup->get_result()->num_rows === 0) {
    json_out(404, ['error' => 'Group not found']);
  }

  // Delete membership
  $deleteSql = "DELETE FROM GroupMembership WHERE groupId = ? AND associationId = ?";
  $stmtDelete = db()->prepare($deleteSql);
  $stmtDelete->bind_param('ss', $groupId, $associationId);
  $stmtDelete->execute();

  log_event('api', 'groups.removeMember', ['groupId' => $groupId, 'associationId' => $associationId, 'affected' => $stmtDelete->affected_rows]);
  json_out(200, ['success' => true]);
}

/**
 * PUT handler - update group fields.
 *
 * @return void
 */
function handle_update_group(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-update', 40, 60);

  $body = read_json();

  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'Group id is required']);
  }

  // Check if group exists
  $checkSql = "SELECT id FROM `Group` WHERE id = ? AND isDeleted = 0";
  $stmtCheck = db()->prepare($checkSql);
  $stmtCheck->bind_param('s', $id);
  $stmtCheck->execute();
  if ($stmtCheck->get_result()->num_rows === 0) {
    json_out(404, ['error' => 'Group not found']);
  }

  $updates = [];
  $params = [];
  $types = '';

  if (isset($body['name'])) {
    $name = normalize_nullable_string($body['name'], 255);
    if ($name === '') {
      json_out(400, ['error' => 'Group name cannot be empty']);
    }
    $updates[] = 'name = ?';
    $params[] = $name;
    $types .= 's';
  }

  if (isset($body['description'])) {
    $desc = normalize_nullable_string($body['description'], 5000);
    $updates[] = 'description = ?';
    $params[] = $desc !== '' ? $desc : null;
    $types .= 's';
  }

  if (isset($body['autoUpdate'])) {
    $autoUpdate = normalize_bool($body['autoUpdate']) ? 1 : 0;
    $updates[] = 'autoUpdate = ?';
    $params[] = $autoUpdate;
    $types .= 'i';
  }

  if (isset($body['searchQuery'])) {
    $searchQuery = json_encode($body['searchQuery']);
    $updates[] = 'searchQuery = ?';
    $params[] = $searchQuery;
    $types .= 's';
  }

  if (empty($updates)) {
    json_out(400, ['error' => 'No fields to update']);
  }

  $updates[] = 'updatedAt = NOW()';

  $sql = "UPDATE `Group` SET " . implode(', ', $updates) . " WHERE id = ?";
  $params[] = $id;
  $types .= 's';

  $stmt = db()->prepare($sql);
  bind_all($stmt, $types, $params);
  $stmt->execute();

  log_event('api', 'groups.updated', ['id' => $id]);
  json_out(200, ['success' => true]);
}

/**
 * DELETE handler - soft delete a group.
 *
 * @return void
 */
function handle_delete_group(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-delete', 20, 60);

  $body = read_json();

  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'Group id is required']);
  }

  $sql = "UPDATE `Group` SET isDeleted = 1, deletedAt = NOW(), updatedAt = NOW() WHERE id = ? AND isDeleted = 0";
  $stmt = db()->prepare($sql);
  $stmt->bind_param('s', $id);
  $stmt->execute();

  if ($stmt->affected_rows === 0) {
    json_out(404, ['error' => 'Group not found or already deleted']);
  }

  log_event('api', 'groups.deleted', ['id' => $id]);
  json_out(200, ['success' => true]);
}

/**
 * POST handler (action=export) - export group members to CSV.
 *
 * @return void
 */
function handle_export_members(): void {
  require_auth();
  require_csrf();
  rate_limit('groups-export', 10, 60);

  $body = read_json();
  $groupId = normalize_nullable_string($body['groupId'] ?? null, 36);

  if ($groupId === '') {
    json_out(400, ['error' => 'groupId is required']);
  }

  // Get group with memberships
  $groupSql = "SELECT
                g.id,
                CONVERT(g.name USING utf8mb4) AS name,
                g.isDeleted
              FROM `Group` g
              WHERE g.id = ?
              LIMIT 1";

  $stmt = db()->prepare($groupSql);
  $stmt->bind_param('s', $groupId);
  $stmt->execute();
  $res = $stmt->get_result();
  $group = $res->fetch_assoc();

  if (!$group) {
    json_out(404, ['error' => 'Group not found']);
  }

  if ($group['isDeleted']) {
    json_out(404, ['error' => 'Group is deleted']);
  }

  // Get memberships with associations and contacts
  $membersSql = "SELECT
                  a.id AS assoc_id,
                  CONVERT(a.name USING utf8mb4) AS assoc_name,
                  CONVERT(a.municipality USING utf8mb4) AS assoc_municipality,
                  CONVERT(a.city USING utf8mb4) AS assoc_city,
                  CONVERT(a.website USING utf8mb4) AS assoc_website,
                  CONVERT(a.streetAddress USING utf8mb4) AS assoc_street,
                  CONVERT(a.postalCode USING utf8mb4) AS assoc_postal,
                  a.phone AS assoc_phone
                FROM GroupMembership gm
                INNER JOIN Association a ON a.id = gm.associationId AND a.deletedAt IS NULL
                WHERE gm.groupId = ?
                ORDER BY a.name ASC";

  $membersStmt = db()->prepare($membersSql);
  $membersStmt->bind_param('s', $groupId);
  $membersStmt->execute();
  $membersRes = $membersStmt->get_result();

  $rows = [];
  while ($assoc = $membersRes->fetch_assoc()) {
    // Get up to 3 contacts for this association
    $contactsSql = "SELECT
                      CONVERT(c.name USING utf8mb4) AS contact_name,
                      CONVERT(c.email USING utf8mb4) AS contact_email,
                      c.phone AS contact_phone,
                      c.mobile AS contact_mobile
                    FROM Contact c
                    WHERE c.associationId = ?
                    ORDER BY c.isPrimary DESC, c.createdAt ASC
                    LIMIT 3";

    $contactsStmt = db()->prepare($contactsSql);
    $contactsStmt->bind_param('s', $assoc['assoc_id']);
    $contactsStmt->execute();
    $contactsRes = $contactsStmt->get_result();

    $contacts = [];
    while ($contact = $contactsRes->fetch_assoc()) {
      $contacts[] = $contact;
    }

    // Build address
    $addressParts = [];
    if ($assoc['assoc_street']) {
      $addressParts[] = $assoc['assoc_street'];
    }
    $postalCity = trim(($assoc['assoc_postal'] ?? '') . ' ' . ($assoc['assoc_city'] ?? ''));
    if ($postalCity) {
      $addressParts[] = $postalCity;
    }
    $address = implode(', ', $addressParts);

    // Build row
    $contact1 = $contacts[0] ?? null;
    $contact2 = $contacts[1] ?? null;
    $contact3 = $contacts[2] ?? null;

    $contact1Phone = $contact1 ? ($contact1['contact_phone'] ?: $contact1['contact_mobile'] ?: $assoc['assoc_phone'] ?: '') : '';

    $rows[] = [
      normalize_utf8($group['name']) ?: '',
      normalize_utf8($assoc['assoc_municipality']) ?: '',
      normalize_utf8($assoc['assoc_city']) ?: '',
      normalize_utf8($assoc['assoc_name']) ?: '',
      normalize_utf8($assoc['assoc_website']) ?: '',
      $contact1 ? normalize_utf8($contact1['contact_name']) : '',
      $contact1 ? normalize_utf8($contact1['contact_email']) : '',
      $contact1Phone,
      $address,
      $contact2 ? normalize_utf8($contact2['contact_name']) : '',
      $contact2 ? normalize_utf8($contact2['contact_email']) : '',
      $contact3 ? normalize_utf8($contact3['contact_name']) : '',
      $contact3 ? normalize_utf8($contact3['contact_email']) : '',
    ];
  }

  // Build CSV
  $headers = [
    'Gruppnamn',
    'Kommun',
    'Ort',
    'Föreningsnamn',
    'Länk till föreningens hemsida',
    'Namn kontaktperson 1',
    'Epost kontaktperson 1',
    'Telefon kontaktperson 1',
    'Adress kontaktperson 1',
    'Namn kontaktperson 2',
    'Epost kontaktperson 2',
    'Namn kontaktperson 3',
    'Epost kontaktperson 3',
  ];

  $csvLines = [];
  $csvLines[] = implode(';', array_map('escape_csv_value', $headers));

  foreach ($rows as $row) {
    $csvLines[] = implode(';', array_map('escape_csv_value', $row));
  }

  $csvContent = implode("\r\n", $csvLines);

  // Convert to Windows-1252 (ANSI)
  $encoded = mb_convert_encoding($csvContent, 'Windows-1252', 'UTF-8');

  // Generate safe filename
  $safeName = slugify($group['name']) ?: 'grupp';
  $filename = $safeName . '-medlemmar.csv';

  log_event('api', 'groups.export', ['id' => $groupId, 'rows' => count($rows)]);
  json_out(200, [
    'filename' => $filename,
    'mimeType' => 'text/csv',
    'data' => base64_encode($encoded),
  ]);
}

/**
 * Escape a value for CSV output.
 *
 * @param mixed $value
 * @return string
 */
function escape_csv_value($value): string {
  if ($value === null || $value === '') {
    return '';
  }

  $stringValue = (string)$value;
  if ($stringValue === '') {
    return '';
  }

  $needsQuoting = preg_match('/[;"\n\r]/', $stringValue);
  $cleaned = str_replace('"', '""', $stringValue);
  return $needsQuoting ? '"' . $cleaned . '"' : $cleaned;
}

/**
 * Create a URL-safe slug from a string.
 *
 * @param string $value
 * @return string
 */
function slugify(string $value): string {
  // Normalize and remove accents
  $normalized = normalizer_normalize($value, Normalizer::NFKD);
  if ($normalized === false) {
    $normalized = $value;
  }

  // Remove non-ASCII characters
  $cleaned = preg_replace('/[^\x20-\x7E]/', '', $normalized);

  // Replace non-alphanumeric with hyphens
  $slug = preg_replace('/[^a-zA-Z0-9-_]+/', '-', $cleaned);

  // Remove duplicate hyphens
  $slug = preg_replace('/-+/', '-', $slug);

  // Trim hyphens from ends
  $slug = trim($slug, '-');

  return strtolower($slug);
}
