<?php
/**
 * CSRF endpoint
 *
 * GET: Issues a CSRF cookie and returns the token in JSON.
 *
 * @package API
 */

declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$token = get_csrf_token();

// Mirror CSRF in a non-HttpOnly cookie (so frontend can read it)
// This cookie only holds a random token, not a session ID.
$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
setcookie('csrf', $token, [
  'expires' => 0,
  'path' => '/',
  'domain' => '',
  'secure' => $cookieSecure,
  'httponly' => false,
  'samesite' => 'Lax',
]);

json_out(200, ['token' => $token, 'ok' => true]);
