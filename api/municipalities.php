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

$sql = 'SELECT id, name, code FROM municipalities ORDER BY name ASC';
$res = db()->query($sql);
$items = [];
while ($row = $res->fetch_assoc()) {
  $items[] = [
    'id' => (int)$row['id'],
    'name' => $row['name'],
    'code' => $row['code'],
  ];
}

json_out(200, ['items' => $items]);
