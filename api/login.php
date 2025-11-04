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

$body = read_json();
$email = isset($body['email']) ? trim((string)$body['email']) : '';
$pass  = isset($body['password']) ? (string)$body['password'] : '';

if ($email === '' || $pass === '') {
  json_out(400, ['error' => 'Missing email or password']);
}

$sql = 'SELECT id, password_hash FROM users WHERE email = ? LIMIT 1';
$stmt = db()->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  json_out(401, ['error' => 'Invalid credentials']);
}

if (!password_verify($pass, $row['password_hash'])) {
  json_out(401, ['error' => 'Invalid credentials']);
}

$_SESSION['uid'] = (int)$row['id'];
json_out(200, ['ok' => true]);
