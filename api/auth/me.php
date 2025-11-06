<?php
/**
 * Returns the authenticated user profile for the current PHP session.
 *
 * GET /api/auth/me.php
 *   - Reads $_SESSION['uid'] and loads the corresponding user record.
 *   - Responds with { user: null } when no active session exists.
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

$userId = isset($_SESSION['uid']) ? (string)$_SESSION['uid'] : '';
if ($userId === '') {
  log_event('api', 'auth.me.unauthenticated');
  json_out(200, ['user' => null]);
}

$stmt = db()->prepare('SELECT id, name, email, role FROM User WHERE id = ? LIMIT 1');
$stmt->bind_param('s', $userId);
$stmt->execute();
$result = $stmt->get_result();
$row = $result ? $result->fetch_assoc() : null;
$stmt->close();

if (!$row) {
  log_event('api', 'auth.me.user_not_found', ['userId' => $userId]);
  json_out(200, ['user' => null]);
}

$name = normalize_utf8($row['name'] ?? null);
$email = normalize_utf8($row['email'] ?? null);
$role = strtoupper((string)($row['role'] ?? 'USER'));

if ($role === '') {
  $role = 'USER';
}

$payload = [
  'user' => [
    'id' => (string)$row['id'],
    'name' => $name !== null && $name !== '' ? $name : null,
    'email' => $email !== null && $email !== '' ? $email : null,
    'role' => $role,
  ],
];

log_event('api', 'auth.me.success', ['userId' => $userId, 'role' => $role]);

json_out(200, $payload);
