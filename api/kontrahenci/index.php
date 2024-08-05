<?php
require_once '../config/config.php';
header('Content-Type: application/json');
try {
  $pdo = getDB();
  if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
  }
  $method = $_SERVER['REQUEST_METHOD'];
  switch ($method) {
    case 'GET':
      handleGetMethod($pdo);
      break;
    case 'POST':
      handlePostMethod($pdo);
      break;
    case 'PUT':
      handlePutMethod($pdo);
      break;
    case 'DELETE':
      handleDeleteMethod($pdo);
      break;
    default:
      http_response_code(405);
      echo json_encode(['error' => 'Unsupported request method']);
      break;
  }
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Query failed: ' . $e->getMessage()]);
}
function handleGetMethod($pdo)
{
  $stmt = $pdo->prepare("SELECT * FROM Kontrahenci WHERE is_deleted = FALSE");
  $stmt->execute();
  $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($result);
}
function handlePostMethod($pdo)
{
  $data = json_decode(file_get_contents("php://input"), true);
  if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'No data provided or data is invalid']);
    exit;
  }
  $stmt = $pdo->prepare("SELECT * FROM Kontrahenci WHERE nip = :nip");
  $stmt->bindParam(':nip', $data['nip']);
  $stmt->execute();
  $kontrahent = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($kontrahent) {
    http_response_code(409);
    echo json_encode(['error' => 'Kontrahent with provided nip already exists']);
    exit;
  }
  $query = "INSERT INTO Kontrahenci (nip, regon, nazwa, czy_platnik_vat, ulica, numer_domu, numer_mieszkania) VALUES (:nip, :regon, :nazwa, :czy_platnik_vat, :ulica, :numer_domu, :numer_mieszkania)";
  $stmt = $pdo->prepare($query);
  bindParameters($stmt, $data);
  if ($stmt->execute()) {
    echo json_encode(['message' => 'Record added successfully', 'kontrahent' => $data]);
  } else {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to add record']);
  }
}
function handlePutMethod($pdo)
{
  $nip = $_GET['nip'] ?? null;
  if (!$nip) {
    http_response_code(400);
    echo json_encode(['error' => 'No original nip provided']);
    exit;
  }
  $data = json_decode(file_get_contents("php://input"), true);
  if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'No data provided or data is invalid']);
    exit;
  }
  $query = "UPDATE Kontrahenci SET nip=:nip, regon=:regon, nazwa=:nazwa, czy_platnik_vat=:czy_platnik_vat, ulica=:ulica, numer_domu=:numer_domu, numer_mieszkania=:numer_mieszkania WHERE nip=:ogNip";
  $stmt = $pdo->prepare($query);
  bindParameters($stmt, $data);
  $stmt->bindParam(':ogNip', $nip);
  if ($stmt->execute() && $stmt->rowCount() > 0) {
    echo json_encode(['message' => 'Record updated successfully']);
  } else {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to update record or no changes made']);
  }
}
function handleDeleteMethod($pdo)
{
  $nip = $_GET['nip'] ?? null;
  if (!$nip) {
    http_response_code(400);
    echo json_encode(['error' => 'No original nip provided']);
    exit;
  }
  $stmt = $pdo->prepare("UPDATE Kontrahenci SET is_deleted = TRUE WHERE nip = :nip");
  $stmt->bindParam(':nip', $nip, PDO::PARAM_INT);
  if ($stmt->execute()) {
    echo json_encode(['message' => 'Record marked as deleted successfully']);
  } else {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to mark record as deleted']);
  }
}
function bindParameters($stmt, $data)
{
  $stmt->bindParam(':nip', $data['nip']);
  $stmt->bindParam(':regon', $data['regon']);
  $stmt->bindParam(':nazwa', $data['nazwa']);
  $stmt->bindParam(':czy_platnik_vat', $data['czy_platnik_vat'], PDO::PARAM_BOOL);
  $stmt->bindParam(':ulica', $data['ulica']);
  $stmt->bindParam(':numer_domu', $data['numer_domu']);
  $stmt->bindParam(':numer_mieszkania', $data['numer_mieszkania']);
}
