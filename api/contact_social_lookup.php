<?php
/**
 * Queues an AI-driven social media lookup for a contact.
 *
 * This endpoint does not perform the enrichment itself. Instead, it records
 * an audit event so that the background automation can process the contact
 * with the preferred AI provider.
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();
require_csrf();
rate_limit('contact-ai-search', 20, 60);

$body = read_json();
$contactId = isset($body['contact_id']) ? trim((string)$body['contact_id']) : '';
if ($contactId === '') {
  json_out(400, ['error' => 'contact_id is required']);
}

$stmt = db()->prepare(
  'SELECT c.id,
          c.associationId,
          CONVERT(c.name USING utf8mb4) AS name,
          CONVERT(c.email USING utf8mb4) AS email,
          CONVERT(c.phone USING utf8mb4) AS phone,
          CONVERT(c.mobile USING utf8mb4) AS mobile,
          CONVERT(a.name USING utf8mb4) AS association_name,
          CONVERT(m.name USING utf8mb4) AS municipality_name
   FROM Contact c
   LEFT JOIN Association a ON a.id = c.associationId
   LEFT JOIN Municipality m ON m.id = a.municipalityId
   WHERE c.id = ?
     AND c.deletedAt IS NULL
   LIMIT 1'
);
$stmt->bind_param('s', $contactId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
if (!$row) {
  json_out(404, ['error' => 'Contact not found']);
}

$payload = [
  'contactId' => (string)$row['id'],
  'associationId' => (string)$row['associationId'],
  'contactName' => normalize_utf8($row['name'] ?? null),
  'associationName' => normalize_utf8($row['association_name'] ?? null),
  'municipality' => normalize_utf8($row['municipality_name'] ?? null),
  'email' => normalize_utf8($row['email'] ?? null),
  'phone' => normalize_utf8($row['phone'] ?? null),
  'mobile' => normalize_utf8($row['mobile'] ?? null),
  'requestedBy' => isset($_SESSION['uid']) ? (string)$_SESSION['uid'] : null,
];

log_event('api', 'contact_social_lookup.requested', $payload);

json_out(200, [
  'ok' => true,
  'status' => 'queued',
  'message' => 'AI-sökningen har köats och bearbetas av bakgrundstjänsten.',
]);
