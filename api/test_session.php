<?php
require __DIR__ . '/bootstrap.php';
$started = session_status() === PHP_SESSION_ACTIVE;
if (!$started) {
    $started = session_start();
}
header('Content-Type: text/plain; charset=utf-8');
print_r([
    'session_id' => session_id(),
    'status' => session_status(),
    'save_path' => session_save_path(),
    'cookie_params' => session_get_cookie_params(),
    'started' => $started,
    'headers_sent' => headers_sent(),
]);
