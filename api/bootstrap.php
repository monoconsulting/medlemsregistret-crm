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
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// ---------- Session settings ----------
$sessionPath = __DIR__ . '/storage/sessions';
if (!is_dir($sessionPath)) {
  @mkdir($sessionPath, 0775, true);
}
if (is_dir($sessionPath)) {
  ini_set('session.save_handler', 'files');
  session_save_path($sessionPath);
}
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
  $started = @session_start();
  if (!$started || session_id() === '') {
    $err = error_get_last();
    log_event('api', 'session.start_failed', [
      'save_path' => session_save_path(),
      'started' => $started,
      'error' => $err ? $err['message'] : null,
    ]);
  } else {
    log_event('api', 'session.start', [
      'save_path' => session_save_path(),
    ]);
  }
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
    if (is_array($cfg)) {
      $host = $host ?: ($cfg['DB_HOST'] ?? null);
      $name = $name ?: ($cfg['DB_NAME'] ?? null);
      $user = $user ?: ($cfg['DB_USER'] ?? null);
      $pass = $pass ?: ($cfg['DB_PASS'] ?? null);
    }
  }

  if (!$host || !$name || !$user) {
    http_response_code(500);
    echo json_encode(['error' => 'Database environment variables are not set (DB_HOST, DB_NAME, DB_USER, DB_PASS).']);
    exit;
  }

  $conn = @new mysqli($host, $user, $pass ?? '', $name);
  if ($conn->connect_error) {
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
 * Appends a structured line to the remote login log.
 *
 * Args:
 *   string $source - e.g. 'api' or 'client'
 *   string $stage  - event identifier
 *   array  $context - additional metadata
 *
 * Returns:
 *   void
 */
function log_event(string $source, string $stage, array $context = []): void {
  static $logFile = null;
  if ($logFile === null) {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
      @mkdir($logDir, 0775, true);
    }
    $logFile = $logDir . '/remote-login.log';
  }

  $entry = [
    'timestamp' => gmdate('c'),
    'source' => $source,
    'stage' => $stage,
    'sessionId' => session_id() ?: null,
    'userId' => $_SESSION['uid'] ?? null,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    'path' => $_SERVER['REQUEST_URI'] ?? null,
    'context' => $context,
  ];

  $encoded = json_encode($entry, JSON_UNESCAPED_UNICODE);
  if ($encoded !== false) {
    @file_put_contents($logFile, $encoded . PHP_EOL, FILE_APPEND | LOCK_EX);
  }
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
  if (!is_array($data)) return [];
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
    log_event('api', 'auth.required_failed', [
      'path' => $_SERVER['REQUEST_URI'] ?? '',
    ]);
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
      log_event('api', 'csrf.invalid', [
        'path' => $_SERVER['REQUEST_URI'] ?? '',
      ]);
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
    case 'updated_asc': return 'ORDER BY a.updatedAt ASC';
    case 'updated_desc': return 'ORDER BY a.updatedAt DESC';
    default: return 'ORDER BY a.updatedAt DESC';
  }
}

/**
 * Returns the current client identifier used for lightweight rate limiting.
 *
 * Args:
 *   string $scope - Scope name (e.g. "login")
 *
 * Returns:
 *   string
 */
function rate_limit_key(string $scope): string {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  return $scope . '|' . $ip;
}

/**
 * Basic in-session rate limiting helper.
 *
 * Args:
 *   string $scope - logical scope name
 *   int    $limit - max hits per window
 *   int    $windowSeconds - window size (seconds)
 *
 * Returns:
 *   void (throws HTTP 429 when exceeded)
 */
function rate_limit(string $scope, int $limit, int $windowSeconds): void {
  $key = rate_limit_key($scope);
  $now = time();
  if (!isset($_SESSION['_rate'])) {
    $_SESSION['_rate'] = [];
  }
  if (!isset($_SESSION['_rate'][$key]) || !is_array($_SESSION['_rate'][$key])) {
    $_SESSION['_rate'][$key] = [];
  }

  $_SESSION['_rate'][$key] = array_values(array_filter(
    $_SESSION['_rate'][$key],
    static fn(int $ts): bool => ($now - $ts) < $windowSeconds
  ));

  if (count($_SESSION['_rate'][$key]) >= $limit) {
    json_out(429, ['error' => 'Rate limit exceeded']);
  }

  $_SESSION['_rate'][$key][] = $now;
}

/**
 * Returns allowed association statuses from env or defaults.
 *
 * Returns:
 *   string[]
 */
function allowed_association_statuses(): array {
  static $cache = null;
  if ($cache !== null) {
    return $cache;
  }

  $env = getenv('CRM_ALLOWED_ASSOC_STATUSES');
  if ($env !== false && trim($env) !== '') {
    $items = array_filter(array_map('trim', explode(',', $env)));
    $cache = array_values($items);
    return $cache;
  }

  $cache = [
    'UNCONTACTED',
    'CONTACTED',
    'INTERESTED',
    'NEGOTIATION',
    'MEMBER',
    'LOST',
    'INACTIVE',
  ];
  return $cache;
}

/**
 * Returns allowed association types (empty array disables enforcement).
 *
 * Returns:
 *   string[]
 */
function allowed_association_types(): array {
  static $cache = null;
  if ($cache !== null) {
    return $cache;
  }

  $env = getenv('CRM_ALLOWED_ASSOC_TYPES');
  if ($env !== false && trim($env) !== '') {
    $items = array_filter(array_map('trim', explode(',', $env)));
    $cache = array_values($items);
    return $cache;
  }

  $cache = [];
  return $cache;
}

/**
 * Normalizes a nullable string input.
 *
 * Args:
 *   mixed  $value
 *   int    $maxLength
 *
 * Returns:
 *   string trimmed value or empty string when null/blank
 */
function normalize_nullable_string($value, int $maxLength): string {
  if ($value === null) return '';
  $trimmed = trim((string)$value);
  if ($trimmed === '') return '';
  if (mb_strlen($trimmed, 'UTF-8') > $maxLength) {
    $trimmed = mb_substr($trimmed, 0, $maxLength, 'UTF-8');
  }
  return $trimmed;
}

/**
 * Validates email format; returns empty string when invalid/absent.
 *
 * Args:
 *   mixed $value
 *
 * Returns:
 *   string
 */
function normalize_email($value): string {
  $normalized = normalize_nullable_string($value, 190);
  if ($normalized === '') {
    return '';
  }
  if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
    json_out(400, ['error' => 'Invalid email address']);
  }
  return $normalized;
}

/**
 * Validates website/URL fields.
 *
 * Args:
 *   mixed $value
 *
 * Returns:
 *   string
 */
function normalize_url($value): string {
  $normalized = normalize_nullable_string($value, 255);
  if ($normalized === '') {
    return '';
  }
  if (!filter_var($normalized, FILTER_VALIDATE_URL)) {
    json_out(400, ['error' => 'Invalid URL']);
  }
  return $normalized;
}

/**
 * Validates association status against allowlist.
 *
 * Args:
 *   mixed $value
 *
 * Returns:
 *   string
 */
function normalize_association_status($value): string {
  $normalized = normalize_nullable_string($value, 60);
  if ($normalized === '') {
    return '';
  }
  $normalized = strtoupper($normalized);
  $allowed = allowed_association_statuses();
  if (!in_array($normalized, $allowed, true)) {
    json_out(400, ['error' => 'Invalid association status']);
  }
  return $normalized;
}

/**
 * Attempts to normalise legacy-encoded strings to UTF-8.
 *
 * Args:
 *   ?string $value
 *
 * Returns:
 *   ?string
 */
function normalize_utf8(?string $value): ?string {
  if ($value === null || $value === '') {
    return $value;
  }
  $needsFix = !mb_detect_encoding($value, 'UTF-8', true) || preg_match('/Ã.|├./u', $value);
  if ($needsFix) {
    $converted = @iconv('Windows-1252', 'UTF-8//IGNORE', $value);
    if ($converted !== false && $converted !== '') {
      return $converted;
    }
  }
  return $value;
}

/**
 * Generates a short, URL-safe identifier.
 *
 * Args:
 *   int $length
 *
 * Returns:
 *   string
 */
function generate_id(int $length = 24): string {
  $buffer = '';
  while (strlen($buffer) < $length) {
    $chunk = rtrim(strtr(base64_encode(random_bytes(8)), '+/', '-_'), '=');
    $buffer .= $chunk;
  }
  return substr($buffer, 0, $length);
}

/**
 * Validates association type (when allowlist provided).
 *
 * Args:
 *   mixed $value
 *
 * Returns:
 *   string
 */
function normalize_association_type($value): string {
  $normalized = normalize_nullable_string($value, 120);
  if ($normalized === '') {
    return '';
  }
  $allowed = allowed_association_types();
  if ($allowed !== [] && !in_array($normalized, $allowed, true)) {
    json_out(400, ['error' => 'Invalid association type']);
  }
  return $normalized;
}
