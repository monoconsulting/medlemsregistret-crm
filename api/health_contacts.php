<?php
/**
 * Contact health check endpoint.
 *
 * Allows deploy scripts to confirm that the Contact table schema matches the
 * expectations in contacts.php (notably the deletedAt column).
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

try {
  $stmt = db()->prepare('SELECT COUNT(*) AS total FROM Contact WHERE deletedAt IS NULL');
  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result ? $result->fetch_assoc() : null;
  if ($result) {
    $result->free();
  }
  $stmt->close();

  $count = isset($row['total']) ? (int) $row['total'] : 0;

  json_out(200, [
    'status' => 'ok',
    'contacts' => $count,
    'timestamp' => gmdate('c'),
  ]);
} catch (mysqli_sql_exception $e) {
  log_event('api', 'contacts.healthcheck_failed', [
    'code' => $e->getCode(),
    'message' => $e->getMessage(),
  ]);
  json_out(500, [
    'status' => 'error',
    'message' => 'Contact health check failed.',
  ]);
}
