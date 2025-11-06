<?php
/**
 * Logout endpoint
 *
 * POST: Destroys session.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

require_auth();
require_csrf();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  json_out(405, ['error' => 'Method not allowed']);
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $params = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

log_event('api', 'logout.success');

json_out(200, ['ok' => true]);
