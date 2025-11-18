<?php
/**
 * Users endpoint
 *
 * Provides administrative CRUD + soft delete for platform users.
 *
 * Methods:
 *   GET    - list users (optionally include deleted) or fetch single user by id
 *   POST   - create a new user (default) or restore when action=restore
 *   PUT    - update user fields (name, email, role, password)
 *   PATCH  - alias for PUT
 *   DELETE - soft delete a user
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

switch ($method) {
  case 'GET':
    if (isset($_GET['id']) && $_GET['id'] !== '') {
      handle_get_user();
    } else {
      handle_list_users();
    }
    break;
  case 'POST':
    $body = read_json();
    if (($body['action'] ?? '') === 'restore') {
      handle_restore_user($body);
    } else {
      handle_create_user($body);
    }
    break;
  case 'PUT':
  case 'PATCH':
    handle_update_user();
    break;
  case 'DELETE':
    handle_delete_user();
    break;
  default:
    json_out(405, ['error' => 'Method not allowed']);
}

/**
 * Lists users with optional search & deleted filter.
 *
 * @return void
 */
function handle_list_users(): void {
  ensure_admin_user();

  $rawQuery = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
  $query = $rawQuery !== '' ? normalize_nullable_string($rawQuery, 200) : '';
  $includeDeleted = filter_var($_GET['includeDeleted'] ?? false, FILTER_VALIDATE_BOOLEAN);

  $conditions = [];
  $types = '';
  $params = [];

  if (!$includeDeleted) {
    $conditions[] = '(isDeleted = 0 OR isDeleted IS NULL)';
  }

  if ($query !== '') {
    $conditions[] = '(name LIKE ? OR email LIKE ?)';
    $like = '%' . $query . '%';
    $params[] = $like;
    $params[] = $like;
    $types .= 'ss';
  }

  $where = count($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

  $sql = "SELECT
            id,
            CONVERT(name USING utf8mb4) AS name,
            CONVERT(email USING utf8mb4) AS email,
            role,
            COALESCE(isDeleted, 0) AS isDeleted,
            deletedAt,
            createdAt,
            updatedAt
          FROM User
          {$where}
          ORDER BY COALESCE(isDeleted, 0) ASC, name ASC, email ASC";

  $stmt = db()->prepare($sql);
  if ($types !== '') {
    $stmt->bind_param($types, ...$params);
  }
  $stmt->execute();
  $result = $stmt->get_result();

  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = map_user_row($row);
  }
  $stmt->close();

  json_out(200, ['items' => $items, 'total' => count($items)]);
}

/**
 * Retrieves a single user by id.
 *
 * @return void
 */
function handle_get_user(): void {
  ensure_admin_user();

  $id = normalize_nullable_string($_GET['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmt = db()->prepare('SELECT id, CONVERT(name USING utf8mb4) AS name, CONVERT(email USING utf8mb4) AS email, role, COALESCE(isDeleted,0) AS isDeleted, deletedAt, createdAt, updatedAt FROM User WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $id);
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if (!$row) {
    json_out(404, ['error' => 'User not found']);
  }

  json_out(200, map_user_row($row));
}

/**
 * Creates a new user with hashed password.
 *
 * @param array $body
 * @return void
 */
function handle_create_user(array $body): void {
  ensure_admin_user();
  require_csrf();
  rate_limit('users-write', 30, 60);

  $name = normalize_nullable_string($body['name'] ?? null, 160);
  $email = normalize_email($body['email'] ?? '');
  $role = normalize_user_role($body['role'] ?? 'USER');
  $password = isset($body['password']) ? trim((string)$body['password']) : '';

  if ($email === '') {
    json_out(400, ['error' => 'E-postadress krävs']);
  }

  if (strlen($password) < 8) {
    json_out(400, ['error' => 'Lösenord måste innehålla minst 8 tecken']);
  }

  ensure_email_available($email, null);

  $passwordHash = password_hash($password, PASSWORD_BCRYPT);
  if (!$passwordHash) {
    json_out(500, ['error' => 'Misslyckades att hasha lösenordet']);
  }

  $id = generate_id();
  $nameValue = $name !== '' ? $name : null;
  $emailValue = $email !== '' ? $email : null;

  $sql = 'INSERT INTO User (id, name, email, role, passwordHash, isDeleted, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())';
  $stmt = db()->prepare($sql);
  $stmt->bind_param('sssss', $id, $nameValue, $emailValue, $role, $passwordHash);

  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Kunde inte skapa användaren']);
  }
  $stmt->close();

  log_event('api', 'users.create', ['id' => $id, 'email' => $email]);

  json_out(200, ['id' => $id]);
}

/**
 * Updates fields for an existing user.
 *
 * @return void
 */
function handle_update_user(): void {
  $current = ensure_admin_user();
  require_csrf();
  rate_limit('users-write', 40, 60);

  $body = read_json();
  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmtFetch = db()->prepare('SELECT id, role, COALESCE(isDeleted,0) AS isDeleted FROM User WHERE id = ? LIMIT 1');
  $stmtFetch->bind_param('s', $id);
  $stmtFetch->execute();
  $existing = $stmtFetch->get_result()->fetch_assoc();
  $stmtFetch->close();

  if (!$existing) {
    json_out(404, ['error' => 'User not found']);
  }

  $fields = [];
  $params = [];
  $types = '';

  if (array_key_exists('name', $body)) {
    $name = normalize_nullable_string($body['name'], 160);
    $value = $name !== '' ? $name : null;
    $fields[] = 'name = ?';
    $params[] = $value;
    $types .= 's';
  }

  if (array_key_exists('email', $body)) {
    $email = normalize_email($body['email']);
    if ($email === '') {
      json_out(400, ['error' => 'Ogiltig e-postadress']);
    }
    ensure_email_available($email, $id);
    $fields[] = 'email = ?';
    $params[] = $email;
    $types .= 's';
  }

  if (array_key_exists('role', $body)) {
    $newRole = normalize_user_role($body['role']);
    if ($existing['role'] === 'ADMIN' && $newRole !== 'ADMIN') {
      ensure_other_admin_exists($id);
    }
    $fields[] = 'role = ?';
    $params[] = $newRole;
    $types .= 's';
  }

  if (array_key_exists('password', $body)) {
    $password = trim((string)$body['password']);
    if ($password !== '') {
      if (strlen($password) < 8) {
        json_out(400, ['error' => 'Lösenord måste innehålla minst 8 tecken']);
      }
      $hash = password_hash($password, PASSWORD_BCRYPT);
      if (!$hash) {
        json_out(500, ['error' => 'Misslyckades att hasha lösenordet']);
      }
      $fields[] = 'passwordHash = ?';
      $params[] = $hash;
      $types .= 's';
    }
  }

  if (!count($fields)) {
    json_out(400, ['error' => 'Inga fält att uppdatera']);
  }

  $fields[] = 'updatedAt = NOW()';
  $sql = 'UPDATE User SET ' . implode(', ', $fields) . ' WHERE id = ? LIMIT 1';
  $params[] = $id;
  $types .= 's';

  $stmt = db()->prepare($sql);
  $stmt->bind_param($types, ...$params);
  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Kunde inte uppdatera användaren']);
  }
  $stmt->close();

  log_event('api', 'users.update', ['id' => $id, 'updatedBy' => $current['id']]);

  json_out(200, ['success' => true]);
}

/**
 * Soft deletes a user.
 *
 * @return void
 */
function handle_delete_user(): void {
  $current = ensure_admin_user();
  require_csrf();
  rate_limit('users-write', 30, 60);

  $body = read_json();
  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  if ($id === $current['id']) {
    json_out(400, ['error' => 'Du kan inte radera din egen användare']);
  }

  $stmtFetch = db()->prepare('SELECT role, COALESCE(isDeleted,0) AS isDeleted FROM User WHERE id = ? LIMIT 1');
  $stmtFetch->bind_param('s', $id);
  $stmtFetch->execute();
  $row = $stmtFetch->get_result()->fetch_assoc();
  $stmtFetch->close();

  if (!$row) {
    json_out(404, ['error' => 'User not found']);
  }

  if (($row['role'] ?? '') === 'ADMIN') {
    ensure_other_admin_exists($id);
  }

  if ((int)($row['isDeleted'] ?? 0) === 1) {
    json_out(200, ['success' => true]);
  }

  $stmt = db()->prepare('UPDATE User SET isDeleted = 1, deletedAt = NOW(), updatedAt = NOW() WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $id);
  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Kunde inte radera användaren']);
  }
  $stmt->close();

  log_event('api', 'users.delete', ['id' => $id, 'deletedBy' => $current['id']]);

  json_out(200, ['success' => true]);
}

/**
 * Restores a soft-deleted user.
 *
 * @param array $body
 * @return void
 */
function handle_restore_user(array $body): void {
  ensure_admin_user();
  require_csrf();
  rate_limit('users-write', 30, 60);

  $id = normalize_nullable_string($body['id'] ?? null, 36);
  if ($id === '') {
    json_out(400, ['error' => 'id is required']);
  }

  $stmtFetch = db()->prepare('SELECT COALESCE(isDeleted,0) AS isDeleted FROM User WHERE id = ? LIMIT 1');
  $stmtFetch->bind_param('s', $id);
  $stmtFetch->execute();
  $row = $stmtFetch->get_result()->fetch_assoc();
  $stmtFetch->close();

  if (!$row) {
    json_out(404, ['error' => 'User not found']);
  }

  if ((int)($row['isDeleted'] ?? 0) === 0) {
    json_out(200, ['success' => true]);
  }

  $stmt = db()->prepare('UPDATE User SET isDeleted = 0, deletedAt = NULL, updatedAt = NOW() WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $id);
  if (!$stmt->execute()) {
    json_out(500, ['error' => 'Kunde inte återställa användaren']);
  }
  $stmt->close();

  json_out(200, ['success' => true]);
}

/**
 * Ensures current session belongs to an admin user.
 *
 * @return array{id: string, role: string}
 */
function ensure_admin_user(): array {
  require_auth();
  $userId = isset($_SESSION['uid']) ? (string)$_SESSION['uid'] : '';
  if ($userId === '') {
    json_out(401, ['error' => 'Inte autentiserad']);
  }

  $stmt = db()->prepare('SELECT id, role FROM User WHERE id = ? LIMIT 1');
  $stmt->bind_param('s', $userId);
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if (!$row) {
    json_out(401, ['error' => 'Sessionen saknar giltig användare']);
  }

  $role = strtoupper((string)($row['role'] ?? ''));
  if ($role === '') {
    $role = 'ADMIN';
  }
  if ($role !== 'ADMIN') {
    json_out(403, ['error' => 'Endast administratörer får hantera användare']);
  }

  return [
    'id' => (string)$row['id'],
    'role' => $role,
  ];
}

/**
 * Normalises and validates role input.
 *
 * @param mixed $value
 * @return string
 */
function normalize_user_role($value): string {
  $role = strtoupper(trim((string)$value));
  $allowed = ['ADMIN', 'MANAGER', 'USER'];
  if ($role === '') {
    $role = 'USER';
  }
  if (!in_array($role, $allowed, true)) {
    json_out(400, ['error' => 'Ogiltig roll']);
  }
  return $role;
}

/**
 * Formats a DB row into response payload.
 *
 * @param array $row
 * @return array
 */
function map_user_row(array $row): array {
  return [
    'id' => (string)$row['id'],
    'name' => normalize_utf8($row['name'] ?? null),
    'email' => normalize_utf8($row['email'] ?? null),
    'role' => strtoupper((string)($row['role'] ?? 'USER')),
    'isDeleted' => (int)($row['isDeleted'] ?? 0) === 1,
    'deletedAt' => isset($row['deletedAt']) ? ($row['deletedAt'] ? (string)$row['deletedAt'] : null) : null,
    'createdAt' => isset($row['createdAt']) ? (string)$row['createdAt'] : null,
    'updatedAt' => isset($row['updatedAt']) ? (string)$row['updatedAt'] : null,
  ];
}

/**
 * Ensures email uniqueness.
 *
 * @param string $email
 * @param string|null $ignoreId
 * @return void
 */
function ensure_email_available(string $email, ?string $ignoreId): void {
  $sql = 'SELECT id FROM User WHERE email = ?';
  $types = 's';
  $params = [$email];

  if ($ignoreId !== null) {
    $sql .= ' AND id <> ?';
    $types .= 's';
    $params[] = $ignoreId;
  }
  $sql .= ' LIMIT 1';

  $stmt = db()->prepare($sql);
  $stmt->bind_param($types, ...$params);
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  if ($row) {
    json_out(400, ['error' => 'E-postadressen används redan av en annan användare']);
  }
}

/**
 * Ensures at least one other admin remains active.
 *
 * @param string $excludeId
 * @return void
 */
function ensure_other_admin_exists(string $excludeId): void {
  $stmt = db()->prepare('SELECT COUNT(*) AS total FROM User WHERE role = "ADMIN" AND (isDeleted = 0 OR isDeleted IS NULL) AND id <> ?');
  $stmt->bind_param('s', $excludeId);
  $stmt->execute();
  $row = $stmt->get_result()->fetch_assoc();
  $stmt->close();

  $remaining = isset($row['total']) ? (int)$row['total'] : 0;
  if ($remaining <= 0) {
    json_out(400, ['error' => 'Det måste finnas minst en aktiv administratör kvar']);
  }
}
