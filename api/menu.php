<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("SELECT * FROM MENU ORDER BY Category, ItemName");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($method === 'POST') {
    // Check if it's an Update or Create
    $id = $_POST['id'] ?? null;
    $itemName = $_POST['itemName'] ?? null;
    $price = $_POST['price'] ?? null;
    $category = $_POST['category'] ?? null;
    $itemImage = null;

    // Handle File Upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '.' . $fileExtension;
        $targetFile = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            $itemImage = $targetFile;
            
            // If updating, delete old image
            if ($id) {
                $stmt = $conn->prepare("SELECT ItemImage FROM MENU WHERE ItemID = ?");
                $stmt->execute([$id]);
                $old = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($old && $old['ItemImage'] && file_exists($old['ItemImage'])) {
                    unlink($old['ItemImage']);
                }
            }
        }
    }

    // Fallback to JSON if POST is empty
    if (!$itemName && !$id) {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $itemName = $data['itemName'] ?? null;
        $price = $data['price'] ?? null;
        $category = $data['category'] ?? null;
        $itemImage = $data['itemImage'] ?? null;
    }

    if ($id) {
        // UPDATE
        $sql = "UPDATE MENU SET ItemName = ?, Price = ?, Category = ?";
        $params = [$itemName, $price, $category];
        if ($itemImage) {
            $sql .= ", ItemImage = ?";
            $params[] = $itemImage;
        }
        $sql .= " WHERE ItemID = ?";
        $params[] = $id;
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        echo json_encode(["message" => "Item updated successfully"]);
    } else {
        // CREATE
        if (empty($itemName) || empty($price) || empty($category)) {
            echo json_encode(["error" => "Incomplete data"]);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO MENU (ItemName, Price, Category, ItemImage) VALUES (?, ?, ?, ?)");
        $stmt->execute([$itemName, $price, $category, $itemImage]);
        echo json_encode(["message" => "Item added successfully", "id" => $conn->lastInsertId()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        echo json_encode(["error" => "No ID provided"]);
        exit;
    }

    // Remove file if exists
    $stmt = $conn->prepare("SELECT ItemImage FROM MENU WHERE ItemID = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($item && $item['ItemImage'] && file_exists($item['ItemImage'])) {
        unlink($item['ItemImage']);
    }

    $stmt = $conn->prepare("DELETE FROM MENU WHERE ItemID = ?");
    $stmt->execute([$id]);
    echo json_encode(["message" => "Item deleted"]);
}
?>
