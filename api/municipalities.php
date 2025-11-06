<?php
/**
 * Municipalities endpoint
 *
 * GET: Returns list of municipalities or a single municipality by ID
 *   Query params:
 *     ?id=<municipality_id> - Get single municipality with full details
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();

// Check if requesting a single municipality by ID
$municipalityId = $_GET['id'] ?? null;

if ($municipalityId) {
  // Get single municipality with full details
  $stmt = db()->prepare('
    SELECT
      m.id,
      CONVERT(m.name USING utf8mb4) AS name,
      m.code,
      m.county_code AS countyCode,
      CONVERT(m.county USING utf8mb4) AS county,
      CONVERT(m.region USING utf8mb4) AS region,
      CONVERT(m.province USING utf8mb4) AS province,
      m.latitude,
      m.longitude,
      m.population,
      m.register_url AS registerUrl,
      m.register_status AS registerStatus,
      m.homepage,
      m.platform,
      COUNT(a.id) AS associationCount
    FROM Municipality m
    LEFT JOIN Association a ON a.municipality_id = m.id AND a.deleted_at IS NULL
    WHERE m.id = ?
    GROUP BY m.id
  ');
  $stmt->bind_param('s', $municipalityId);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();

  if (!$row) {
    json_out(404, ['error' => 'Municipality not found']);
  }

  $municipality = [
    'id' => (string)$row['id'],
    'name' => normalize_utf8($row['name'] ?? null) ?? '',
    'code' => $row['code'],
    'countyCode' => $row['countyCode'],
    'county' => normalize_utf8($row['county'] ?? null),
    'region' => normalize_utf8($row['region'] ?? null),
    'province' => normalize_utf8($row['province'] ?? null),
    'latitude' => $row['latitude'] ? (float)$row['latitude'] : null,
    'longitude' => $row['longitude'] ? (float)$row['longitude'] : null,
    'population' => $row['population'] ? (int)$row['population'] : null,
    'registerUrl' => $row['registerUrl'],
    'registerStatus' => $row['registerStatus'],
    'homepage' => $row['homepage'],
    'platform' => $row['platform'],
    'associationCount' => (int)$row['associationCount'],
  ];

  log_event('api', 'municipalities.getById', ['id' => $municipalityId]);
  json_out(200, $municipality);
} else {
  // Get list of all municipalities
  $sql = 'SELECT id, CONVERT(name USING utf8mb4) AS name, code FROM Municipality ORDER BY name ASC';
  $res = db()->query($sql);
  $items = [];
  while ($row = $res->fetch_assoc()) {
    $items[] = [
      'id' => (string)$row['id'],
      'name' => normalize_utf8($row['name'] ?? null) ?? '',
      'code' => $row['code'],
    ];
  }

  log_event('api', 'municipalities.list', ['count' => count($items)]);
  json_out(200, ['items' => $items]);
}
