<?php
require_once 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($data['username']) || empty($data['password'])) {
        echo json_encode(["error" => "Missing credentials"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM USERS WHERE Username = ? AND Password = ?");
    $stmt->execute([$data['username'], $data['password']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        unset($user['Password']); // Don't send password back
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["error" => "Invalid username or password"]);
    }
}
?>
