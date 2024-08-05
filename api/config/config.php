<?php
$host = 'localhost';
$dbname = 'szymonkda';
$username = 'korzenPolski';
$password = 'JDf2140@9fSA^';

function getDB() {
  global $host, $dbname, $username, $password;
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die($e->getMessage());
        }
    }
    return $pdo;
}
?>