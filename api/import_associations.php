<?php
/**
 * Import Associations endpoint
 *
 * Handles import of associations from CSV files.
 *
 * Methods:
 *   POST   - upload and process CSV file
 *   GET    - download template CSV
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
  handle_get_template();
} elseif ($method === 'POST') {
  handle_import();
} else {
  json_out(405, ['error' => 'Method not allowed']);
}

/**
 * GET handler - download template CSV.
 *
 * @return void
 */
function handle_get_template(): void {
  require_auth();

  $headers = [
    'Gruppnamn',
    'Kommun',
    'Ort',
    'Föreningsnamn',
    'Länk till föreningens hemsida',
    'Namn kontaktperson 1',
    'Epost kontaktperson 1',
    'Telefon kontaktperson 1',
    'Adress kontaktperson 1',
    'Namn kontaktperson 2',
    'Epost kontaktperson 2',
    'Namn kontaktperson 3',
    'Epost kontaktperson 3',
  ];

  $csvContent = implode(';', $headers) . "\r\n";
  
  // Add an example row
  $example = [
    'Exempelgruppen',
    'Stockholm',
    'Stockholm',
    'Exempelföreningen',
    'https://example.com',
    'Anna Andersson',
    'anna@example.com',
    '070-1234567',
    'Storgatan 1, 123 45 Stockholm',
    'Bertil Bengtsson',
    'bertil@example.com',
    '',
    '',
  ];
  $csvContent .= implode(';', $example) . "\r\n";

  // Convert to Windows-1252 (ANSI)
  $encoded = mb_convert_encoding($csvContent, 'Windows-1252', 'UTF-8');

  header('Content-Type: text/csv; charset=windows-1252');
  header('Content-Disposition: attachment; filename="mall_foreningar.csv"');
  echo $encoded;
  exit;
}

/**
 * POST handler - import CSV.
 *
 * @return void
 */
function handle_import(): void {
  require_auth();
  require_csrf(); // Assuming frontend sends CSRF token header/cookie? 
  // Actually, for file upload via FormData, we might need to check how CSRF is handled. 
  // Usually it's a header X-CSRF-Token.
  
  if (!isset($_FILES['file'])) {
    json_out(400, ['error' => 'No file uploaded']);
  }

  $file = $_FILES['file'];
  if ($file['error'] !== UPLOAD_ERR_OK) {
    json_out(400, ['error' => 'File upload failed with code ' . $file['error']]);
  }

  $content = file_get_contents($file['tmp_name']);
  if ($content === false) {
    json_out(500, ['error' => 'Failed to read file']);
  }

  // Detect encoding or assume Windows-1252 if it looks like it, but user said "ANSI-encoding".
  // We will force convert from Windows-1252 to UTF-8 as requested.
  $utf8Content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');

  $lines = explode("\n", $utf8Content);
  $lines = array_map('trim', $lines);
  $lines = array_filter($lines); // Remove empty lines

  if (count($lines) < 2) {
    json_out(400, ['error' => 'File is empty or missing header']);
  }

  $headerLine = array_shift($lines);
  $headers = str_getcsv($headerLine, ';');
  
  // Normalize headers to identify columns
  $headerMap = [];
  foreach ($headers as $index => $h) {
    $h = trim($h, "\"\t\n\r\0\x0B"); // Remove quotes and whitespace
    $headerMap[mb_strtolower($h, 'UTF-8')] = $index;
  }

  $required = ['föreningsnamn'];
  foreach ($required as $req) {
    if (!isset($headerMap[$req])) {
      json_out(400, ['error' => "Missing required column: $req"]);
    }
  }

  $stats = [
    'total' => 0,
    'imported' => 0,
    'failed' => 0,
    'errors' => [],
  ];

  $db = db();
  $db->begin_transaction();

  try {
    foreach ($lines as $lineIndex => $line) {
      $stats['total']++;
      $row = str_getcsv($line, ';');
      
      // Helper to get value by header name
      $getVal = function($name) use ($row, $headerMap) {
        $idx = $headerMap[mb_strtolower($name, 'UTF-8')] ?? null;
        if ($idx === null || !isset($row[$idx])) return '';
        return trim($row[$idx]);
      };

      $name = $getVal('föreningsnamn');
      if ($name === '') {
        $stats['failed']++;
        $stats['errors'][] = "Row " . ($lineIndex + 2) . ": Missing association name";
        continue;
      }

      // Extract values
      $groupName = $getVal('gruppnamn');
      $municipality = $getVal('kommun');
      $city = $getVal('ort');
      $website = $getVal('länk till föreningens hemsida');
      
      // Contacts
      $contacts = [];
      for ($i = 1; $i <= 3; $i++) {
        $cName = $getVal("namn kontaktperson $i");
        $cEmail = $getVal("epost kontaktperson $i");
        // Only contact 1 has phone and address in the export format provided by user
        $cPhone = ($i === 1) ? $getVal("telefon kontaktperson $i") : ''; 
        $cAddress = ($i === 1) ? $getVal("adress kontaktperson $i") : '';
        
        if ($cName !== '' || $cEmail !== '') {
          $contacts[] = [
            'name' => $cName,
            'email' => $cEmail,
            'phone' => $cPhone,
            'address' => $cAddress
          ];
        }
      }

      // Create Association
      $assocId = generate_id();
      $stmt = $db->prepare("INSERT INTO Association (
        id, name, municipality, city, homepageUrl, 
        types, activities, categories, 
        createdAt, updatedAt, crmStatus, sourceSystem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'UNCONTACTED', 'IMPORT')");
      
      $muniVal = $municipality !== '' ? $municipality : null;
      $cityVal = $city !== '' ? $city : null;
      $webVal = $website !== '' ? $website : null;
      $emptyJson = '[]';
      
      $stmt->bind_param('ssssssss', $assocId, $name, $muniVal, $cityVal, $webVal, $emptyJson, $emptyJson, $emptyJson);
      
      if (!$stmt->execute()) {
        $stats['failed']++;
        $stats['errors'][] = "Row " . ($lineIndex + 2) . ": Failed to create association ($name): " . $stmt->error;
        continue;
      }

      // Create Contacts
      foreach ($contacts as $c) {
        $contactId = generate_id();
        $cStmt = $db->prepare("INSERT INTO Contact (id, associationId, name, email, phone, streetAddress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        
        $cNameVal = $c['name'] !== '' ? $c['name'] : null;
        $cEmailVal = $c['email'] !== '' ? $c['email'] : null;
        $cPhoneVal = $c['phone'] !== '' ? $c['phone'] : null;
        $cAddrVal = $c['address'] !== '' ? $c['address'] : null;
        
        $cStmt->bind_param('ssssss', $contactId, $assocId, $cNameVal, $cEmailVal, $cPhoneVal, $cAddrVal);
        $cStmt->execute();
      }

      // Handle Group
      if ($groupName !== '') {
        // Check if group exists
        $gStmt = $db->prepare("SELECT id FROM `Group` WHERE name = ? AND isDeleted = 0 LIMIT 1");
        $gStmt->bind_param('s', $groupName);
        $gStmt->execute();
        $gRes = $gStmt->get_result();
        $groupId = null;
        
        if ($gRow = $gRes->fetch_assoc()) {
          $groupId = $gRow['id'];
        } else {
          // Create group
          $groupId = generate_id();
          $cgStmt = $db->prepare("INSERT INTO `Group` (id, name, createdById, createdAt, updatedAt, isDeleted) VALUES (?, ?, ?, NOW(), NOW(), 0)");
          $uid = $_SESSION['uid'] ?? null; // Assuming session has uid
          $cgStmt->bind_param('sss', $groupId, $groupName, $uid);
          $cgStmt->execute();
        }

        // Add to group
        if ($groupId) {
          $gmId = generate_id();
          $gmStmt = $db->prepare("INSERT INTO GroupMembership (id, groupId, associationId, addedAt) VALUES (?, ?, ?, NOW())");
          $gmStmt->bind_param('sss', $gmId, $groupId, $assocId);
          $gmStmt->execute();
        }
      }

      $stats['imported']++;
    }

    $db->commit();
    json_out(200, $stats);

  } catch (Exception $e) {
    $db->rollback();
    json_out(500, ['error' => 'Import failed: ' . $e->getMessage()]);
  }
}
