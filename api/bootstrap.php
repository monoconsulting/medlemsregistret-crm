<?php
/**
 * Bootstrap: DB connection, session, CSRF, helpers.
 *
 * Environment:
 *   DB_HOST, DB_NAME, DB_USER, DB_PASS must be provided by hosting env.
 *
 * Security:
 *   - Same-origin only; session cookie is configured as HttpOnly, Secure (if HTTPS).
 *   - CSRF token stored in session; client sends X-CSRF-Token for write ops.
 *
 * @package API
 */

declare(strict_types=1);

// ---------- Headers ----------
header('Content-Type: application/json; charset=utf-8');

// ---------- Logging ----------
/**
 * Writes a message to PHP's error log with lightweight context.
 *
 * Args:
 *   string $message - main log message
 *   array<string, mixed> $context - optional key/value context
 *
 * Returns:
 *   void
 */
function api_log(string $message, array $context = []): void {
  $timestamp = gmdate('c');
  $suffix = '';
  if (!empty($context)) {
    $encoded = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $suffix = $encoded === false ? '' : " {$encoded}";
  }
  error_log("[crm-api][{$timestamp}] {$message}{$suffix}");
}

// ---------- Session settings ----------
$cookieSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'domain' => '',       // same host
  'secure' => $cookieSecure,
  'httponly' => true,
  'samesite' => 'Lax',
]);
if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

// ---------- DB connection ----------
/**
 * Returns a mysqli connection using environment variables.
 *
 * Returns:
 *   mysqli: Active connection.
 *
 * Throws:
 *   Exception: When env vars are missing or connection fails.
 */
function db(): mysqli {
  static $conn = null;
  if ($conn instanceof mysqli) {
    return $conn;
  }

  $host = getenv('DB_HOST');
  $name = getenv('DB_NAME');
  $user = getenv('DB_USER');
  $pass = getenv('DB_PASS');

  if ((!$host || !$name || !$user) && file_exists(__DIR__ . '/config.php')) {
    /** @noinspection PhpIncludeInspection */
    $cfg = require __DIR__ . '/config.php';
    $host = $host ?: ($cfg['DB_HOST'] ?? null);
    $name = $name ?: ($cfg['DB_NAME'] ?? null);
    $user = $user ?: ($cfg['DB_USER'] ?? null);
    $pass = $pass ?: ($cfg['DB_PASS'] ?? null);
  }

  if (!$host || !$name || !$user) {
    api_log('Missing database configuration', [
      'has_config_file' => file_exists(__DIR__ . '/config.php'),
      'env' => [
        'host' => (bool) $host,
        'name' => (bool) $name,
        'user' => (bool) $user,
      ],
    ]);
    http_response_code(500);
    echo json_encode(['error' => 'Database environment variables are not set (DB_HOST, DB_NAME, DB_USER, DB_PASS).']);
    exit;
  }

  $conn = @new mysqli($host, $user, $pass, $name);
  if ($conn->connect_error) {
    api_log('Database connection failed', ['error' => $conn->connect_error, 'errno' => $conn->connect_errno]);
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
  }
  $conn->set_charset('utf8mb4');
  return $conn;
}

/**
 * Sends a JSON response and exits.
 *
 * Args:
 *   int $status - HTTP status code
 *   mixed $payload - Serializable payload
 *
 * Returns:
 *   void
 */
function json_out(int $status, $payload): void {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

/**
 * Reads the raw JSON request body.
 *
 * Returns:
 *   array: Decoded JSON object or empty array.
 */
function read_json(): array {
  $raw = file_get_contents('php://input') ?: '';
  if ($raw === '') return [];
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    api_log('Invalid JSON payload received', ['body_preview' => substr($raw, 0, 200)]);
    return [];
  }
  return $data;
}

/**
 * Ensures the user is authenticated by checking session.
 *
 * Returns:
 *   void
 */
function require_auth(): void {
  if (empty($_SESSION['uid'])) {
    json_out(401, ['error' => 'Not authenticated']);
  }
}

/**
 * Generates or returns existing CSRF token from session.
 *
 * Returns:
 *   string: CSRF token
 */
function get_csrf_token(): string {
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf'];
}

/**
 * Validates CSRF header for state-changing requests.
 *
 * Returns:
 *   void
 */
function require_csrf(): void {
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if (in_array($method, ['POST','PUT','PATCH','DELETE'], true)) {
    $hdr = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $valid = hash_equals($_SESSION['csrf'] ?? '', $hdr);
    if (!$valid) {
      json_out(403, ['error' => 'Invalid CSRF token']);
    }
  }
}

/**
 * Sanitizes and whitelists order by tokens to prevent SQL injection.
 *
 * Args:
 *   string|null $sort - sort key from client
 *
 * Returns:
 *   string: ORDER BY clause fragment.
 */
function order_by(?string $sort): string {
  switch ($sort) {
    case 'name_asc': return 'ORDER BY a.name ASC';
    case 'name_desc': return 'ORDER BY a.name DESC';
    case 'updated_asc': return 'ORDER BY a.updated_at ASC';
    case 'updated_desc': return 'ORDER BY a.updated_at DESC';
    default: return 'ORDER BY a.updated_at DESC';
  }
}
