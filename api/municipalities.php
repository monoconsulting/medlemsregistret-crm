<?php
/**
 * Municipalities endpoint
 *
 * GET: Returns list of municipalities (id, name, code).
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();

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
