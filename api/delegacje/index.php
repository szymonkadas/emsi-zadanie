<?php
require_once '../config/config.php'; 

header('Content-Type: application/json');

try {
    $pdo = getDB();
    if (!$pdo) {
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT * FROM Delegacje ORDER BY lp ASC");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $rows = json_encode($result);
    echo $rows;
} catch (PDOException $e) {
    die("Query failed: " . $e->getMessage());
}
?>		