<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Place an Order
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['tableNumber']) || empty($data['items'])) {
        echo json_encode(["error" => "Incomplete order data"]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("INSERT INTO ORDERS (TableNumber, OrderStatus) VALUES (?, 'Ordered')");
        $stmt->execute([$data['tableNumber']]);
        $orderId = $conn->lastInsertId();

        $stmtItem = $conn->prepare("INSERT INTO ORDER_ITEMS (OrderID, ItemName, Quantity, PriceAtOrder) VALUES (?, ?, ?, ?)");
        
        foreach ($data['items'] as $item) {
            $stmtItem->execute([
                $orderId, 
                $item['name'], 
                $item['quantity'], 
                $item['price']
            ]);
        }

        $conn->commit();
        echo json_encode(["message" => "Order placed successfully", "orderId" => $orderId]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["error" => "Order failed: " . $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    // Get Orders for Kitchen/Service/Cashier/Customer
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    $tableNumber = isset($_GET['tableNumber']) ? $_GET['tableNumber'] : null;
    
    $query = "SELECT o.*, GROUP_CONCAT(CONCAT(oi.Quantity, 'x ', oi.ItemName) SEPARATOR ', ') as ItemSummary 
              FROM ORDERS o
              JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID";
    
    $conditions = [];
    $params = [];

    if ($status) {
        $conditions[] = "o.OrderStatus = :status";
        $params[':status'] = $status;
    }
    if ($tableNumber) {
        $conditions[] = "o.TableNumber = :tableNumber";
        $params[':tableNumber'] = $tableNumber;
    }

    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $query .= " GROUP BY o.OrderID ORDER BY o.CreatedAt DESC";
    
    $stmt = $conn->prepare($query);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch items for each order to include images
    foreach ($orders as &$order) {
        $stmtItems = $conn->prepare("SELECT oi.*, m.ItemImage FROM ORDER_ITEMS oi LEFT JOIN MENU m ON oi.ItemName = m.ItemName WHERE oi.OrderID = ?");
        $stmtItems->execute([$order['OrderID']]);
        $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode($orders);
} elseif ($method === 'PATCH') {
    // Update Order Status
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['orderId']) || empty($data['status'])) {
        echo json_encode(["error" => "Missing orderId or status"]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE ORDERS SET OrderStatus = ? WHERE OrderID = ?");
    $stmt->execute([$data['status'], $data['orderId']]);
    echo json_encode(["message" => "Order updated to " . $data['status']]);
}
?>
