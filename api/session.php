<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$uid = isset($_SESSION['uid']) ? (int)$_SESSION['uid'] : 0;
if ($uid <= 0) {
  json_out(200, ['authenticated' => false]);
}

json_out(200, ['authenticated' => true, 'uid' => $uid]);
