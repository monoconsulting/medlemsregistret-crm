<?php
/**
 * Quick charset diagnostic tool
 */
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$db = db();

// Check connection charset
$result = $db->query("SELECT @@character_set_client, @@character_set_connection, @@character_set_results, @@character_set_database");
$charset = $result->fetch_assoc();

// Check tables
$tables = $db->query("SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
$tableInfo = [];
while ($row = $tables->fetch_assoc()) {
  $tableInfo[] = $row;
}

// Sample association with Swedish characters
$sample = $db->query("SELECT id, name, municipality_name FROM Association WHERE municipality_name LIKE '%ö%' OR municipality_name LIKE '%å%' OR municipality_name LIKE '%ä%' LIMIT 3");
$samples = [];
while ($row = $sample->fetch_assoc()) {
  $samples[] = $row;
}

json_out(200, [
  'connection_charset' => $charset,
  'tables' => $tableInfo,
  'sample_data' => $samples,
  'php_version' => phpversion(),
  'default_charset' => ini_get('default_charset'),
]);
