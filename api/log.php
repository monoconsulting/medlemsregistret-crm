<?php
/**
 * Client log ingestion endpoint.
 *
 * POST { stage: string, context?: object }
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

$payload = read_json();
$stage = isset($payload['stage']) ? trim((string)$payload['stage']) : '';
if ($stage === '') {
  json_out(400, ['error' => 'stage is required']);
}

$context = [];
if (isset($payload['context']) && is_array($payload['context'])) {
  $context = $payload['context'];
}

log_event('client', $stage, $context);

json_out(200, ['ok' => true]);
