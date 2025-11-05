<?php
/**
 * Login endpoint
 *
 * POST {email, password}
 *   - Verifies user by email and password (bcrypt hash in DB).
 *   - On success, sets session uid.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

require_csrf(); // defend even login

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

$rateWindowSeconds = 60;
$maxAttemptsPerWindow = 5;
rate_limit('login', $maxAttemptsPerWindow, $rateWindowSeconds);

$body = read_json();
$email = isset($body['email']) ? trim((string)$body['email']) : '';
$pass  = isset($body['password']) ? (string)$body['password'] : '';

if ($email === '' || $pass === '') {
  log_event('api', 'login.missing_credentials');
  json_out(400, ['error' => 'Missing email or password']);
}

log_event('api', 'login.attempt', ['email' => $email]);

$sql = 'SELECT id, passwordHash FROM User WHERE email = ? LIMIT 1';
$stmt = db()->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  log_event('api', 'login.failed', ['reason' => 'user_not_found', 'email' => $email]);
  json_out(401, ['error' => 'Invalid credentials']);
}

if (!password_verify($pass, $row['passwordHash'])) {
  log_event('api', 'login.failed', ['reason' => 'invalid_password', 'email' => $email]);
  json_out(401, ['error' => 'Invalid credentials']);
}

$_SESSION['uid'] = $row['id'];
log_event('api', 'login.success', ['userId' => $row['id']]);
json_out(200, ['ok' => true]);
