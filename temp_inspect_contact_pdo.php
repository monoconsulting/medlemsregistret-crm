<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
$host = 'mysql513.loopia.se';
$user = 'walla3jk@m383902';
$pass = 'Banjo192652';
$db   = 'medlemsregistret_se_db_4';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    echo "Connection error: " . $e->getMessage() . "\n";
    exit(1);
}
$stmt = $pdo->query('SHOW COLUMNS FROM Contact');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo implode(' | ', $row) . "\n";
}
?>
