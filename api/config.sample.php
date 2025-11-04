<?php
// Copy to api/config.php on each environment and fill real values OR
// use hosting env vars; bootstrap.php should prefer getenv() and only
// fallback to include config.php if needed.

// Example only; do NOT commit real secrets.
$CFG = [
  'DB_HOST' => 'mysqlXX.loopia.se',
  'DB_NAME' => 'YOUR_DB_NAME',
  'DB_USER' => 'YOUR_DB_USER',
  'DB_PASS' => 'YOUR_DB_PASS',
];
