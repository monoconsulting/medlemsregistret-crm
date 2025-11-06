<?php
/**
 * Association detail endpoint.
 *
 * GET ?id=... -> returns rich association payload with contacts, notes, tags, activity, groups.
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();

$associationId = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
if ($associationId === '') {
  json_out(400, ['error' => 'id is required']);
}

/**
 * Helper to bind parameters with reference semantics.
 *
 * @param mysqli_stmt $stmt
 * @param string $types
 * @param array<int, mixed> $params
 */
if (!function_exists('bind_all')) {
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

/**
 * Safe JSON decode helper.
 *
 * @param mixed $value
 * @return mixed
 */
if (!function_exists('decode_json_field')) {
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
}

$sql = "SELECT
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
          a.detailUrl AS detail_url
        FROM Association a
        LEFT JOIN Municipality m ON m.id = a.municipalityId
        LEFT JOIN User u ON u.id = a.assignedToId
        WHERE a.id = ?
        LIMIT 1";
$stmt = db()->prepare($sql);
$stmt->bind_param('s', $associationId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) {
  json_out(404, ['error' => 'Association not found']);
}

$description = decode_json_field($row['description_json']);
if ($description === null && $row['description_raw'] !== null) {
  $description = normalize_utf8($row['description_raw']);
}

$extras = decode_json_field($row['extras_json']);

$detail = [
  'id' => (string)$row['id'],
  'name' => normalize_utf8($row['name'] ?? null),
  'municipality_id' => $row['municipality_id'] !== null ? (string)$row['municipality_id'] : null,
  'municipality_name' => normalize_utf8($row['municipality_name'] ?? null),
  'municipality' => normalize_utf8($row['municipality'] ?? null),
  'source_system' => normalize_utf8($row['source_system'] ?? null),
  'org_number' => normalize_utf8($row['org_number'] ?? null),
  'types' => decode_json_field($row['types_json']) ?? [],
  'activities' => decode_json_field($row['activities_json']) ?? [],
  'categories' => decode_json_field($row['categories_json']) ?? [],
  'crm_status' => normalize_utf8($row['crm_status'] ?? null),
  'pipeline' => normalize_utf8($row['pipeline'] ?? null),
  'is_member' => (bool)$row['is_member'],
  'member_since' => $row['member_since'],
  'email' => normalize_utf8($row['email'] ?? null),
  'phone' => normalize_utf8($row['phone'] ?? null),
  'street_address' => normalize_utf8($row['street_address'] ?? null),
  'postal_code' => normalize_utf8($row['postal_code'] ?? null),
  'city' => normalize_utf8($row['city'] ?? null),
  'website' => normalize_utf8($row['website'] ?? null),
  'detail_url' => normalize_utf8($row['detail_url'] ?? null),
  'description' => $description,
  'description_free_text' => normalize_utf8($row['description_free_text'] ?? null),
  'extras' => $extras,
  'assigned_to' => $row['assigned_to_id'] !== null ? [
    'id' => (string)$row['assigned_to_id'],
    'name' => normalize_utf8($row['assigned_to_name'] ?? null),
    'email' => normalize_utf8($row['assigned_to_email'] ?? null),
  ] : null,
  'created_at' => $row['created_at'],
  'updated_at' => $row['updated_at'],
  'deleted_at' => $row['deleted_at'],
  'tags' => [],
  'contacts' => [],
  'notes' => [],
  'activity_log' => [],
  'group_memberships' => [],
];

// Tags
$tagSql = "SELECT t.id, CONVERT(t.name USING utf8mb4) AS name
           FROM _AssociationTags at
           INNER JOIN Tag t ON t.id = at.B
           WHERE at.A = ?
           ORDER BY t.name ASC";
$stmtTags = db()->prepare($tagSql);
$stmtTags->bind_param('s', $associationId);
$stmtTags->execute();
$tagRes = $stmtTags->get_result();
while ($tagRow = $tagRes->fetch_assoc()) {
  $detail['tags'][] = [
    'id' => (string)$tagRow['id'],
    'name' => normalize_utf8($tagRow['name'] ?? null),
  ];
}

// Contacts
$contactSql = "SELECT
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
$stmtContacts = db()->prepare($contactSql);
$stmtContacts->bind_param('s', $associationId);
$stmtContacts->execute();
$contactRes = $stmtContacts->get_result();
while ($contactRow = $contactRes->fetch_assoc()) {
  $detail['contacts'][] = [
    'id' => (string)$contactRow['id'],
    'association_id' => (string)$contactRow['associationId'],
    'name' => normalize_utf8($contactRow['name'] ?? null),
    'role' => normalize_utf8($contactRow['role'] ?? null),
    'email' => normalize_utf8($contactRow['email'] ?? null),
    'phone' => normalize_utf8($contactRow['phone'] ?? null),
    'mobile' => normalize_utf8($contactRow['mobile'] ?? null),
    'linkedin_url' => normalize_utf8($contactRow['linkedin_url'] ?? null),
    'facebook_url' => normalize_utf8($contactRow['facebook_url'] ?? null),
    'twitter_url' => normalize_utf8($contactRow['twitter_url'] ?? null),
    'instagram_url' => normalize_utf8($contactRow['instagram_url'] ?? null),
    'is_primary' => (bool)$contactRow['is_primary'],
    'created_at' => $contactRow['created_at'],
    'updated_at' => $contactRow['updated_at'],
  ];
}

// Notes
$noteSql = "SELECT id,
                   associationId,
                   CONVERT(content USING utf8mb4) AS content,
                   CONVERT(authorName USING utf8mb4) AS author,
                   createdAt AS created_at
            FROM Note
            WHERE associationId = ?
            ORDER BY createdAt DESC
            LIMIT 50";
$stmtNotes = db()->prepare($noteSql);
$stmtNotes->bind_param('s', $associationId);
$stmtNotes->execute();
$noteRes = $stmtNotes->get_result();
while ($noteRow = $noteRes->fetch_assoc()) {
  $detail['notes'][] = [
    'id' => (string)$noteRow['id'],
    'association_id' => (string)$noteRow['associationId'],
    'content' => normalize_utf8($noteRow['content'] ?? null) ?? '',
    'author' => normalize_utf8($noteRow['author'] ?? null),
    'created_at' => $noteRow['created_at'],
  ];
}

// Activity
$activitySql = "SELECT id,
                       type,
                       CONVERT(description USING utf8mb4) AS description,
                       createdAt AS created_at
                FROM Activity
                WHERE associationId = ?
                ORDER BY createdAt DESC
                LIMIT 25";
$stmtActivity = db()->prepare($activitySql);
$stmtActivity->bind_param('s', $associationId);
$stmtActivity->execute();
$activityRes = $stmtActivity->get_result();
while ($activityRow = $activityRes->fetch_assoc()) {
  $detail['activity_log'][] = [
    'id' => (string)$activityRow['id'],
    'type' => $activityRow['type'],
    'description' => normalize_utf8($activityRow['description'] ?? null),
    'created_at' => $activityRow['created_at'],
  ];
}

// Group memberships
$groupSql = "SELECT gm.id,
                    gm.groupId,
                    CONVERT(g.name USING utf8mb4) AS name
             FROM GroupMembership gm
             INNER JOIN `Group` g ON g.id = gm.groupId
             WHERE gm.associationId = ?
             ORDER BY g.name ASC";
$stmtGroups = db()->prepare($groupSql);
$stmtGroups->bind_param('s', $associationId);
$stmtGroups->execute();
$groupRes = $stmtGroups->get_result();
while ($groupRow = $groupRes->fetch_assoc()) {
  $detail['group_memberships'][] = [
    'id' => (string)$groupRow['groupId'],
    'membership_id' => (string)$groupRow['id'],
    'name' => normalize_utf8($groupRow['name'] ?? null),
  ];
}

log_event('api', 'associations.detail', ['id' => $associationId]);

json_out(200, ['association' => $detail]);
