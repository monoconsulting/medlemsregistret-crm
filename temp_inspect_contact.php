<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
$host = 'mysql513.loopia.se';
$user = 'walla3jk@m383902';
$pass = 'Banjo192652';
$db   = 'medlemsregistret_se_db_4';
$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error) {
    echo "Connect error: " . $mysqli->connect_error . "\n";
    exit(1);
}
$res = $mysqli->query('DESCRIBE Contact');
if (!$res) {
    echo "Query error: " . $mysqli->error . "\n";
    exit(1);
}
while ($row = $res->fetch_assoc()) {
    echo implode(' | ', $row) . "\n";
}
?>
