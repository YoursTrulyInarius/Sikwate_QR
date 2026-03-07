<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Generate Receipt
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['orderId'])) {
        echo json_encode(["error" => "Missing orderId"]);
        exit;
    }

    try {
        // Calculate Total
        $stmt = $conn->prepare("SELECT SUM(Quantity * PriceAtOrder) as Total FROM ORDER_ITEMS WHERE OrderID = ?");
        $stmt->execute([$data['orderId']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $total = $result['Total'] ?? 0;

        $receiptNo = "REC-" . time() . "-" . $data['orderId'];

        $stmt = $conn->prepare("INSERT INTO RECEIPTS (ReceiptNumber, OrderID, TotalAmount, PaymentStatus) VALUES (?, ?, ?, 'Unpaid')");
        $stmt->execute([$receiptNo, $data['orderId'], $total]);

        echo json_encode(["message" => "Receipt generated", "receiptNumber" => $receiptNo, "total" => $total]);
    } catch (Exception $e) {
        echo json_encode(["error" => "Failed to generate receipt: " . $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    // Get Receipt details or all receipts
    $orderId = isset($_GET['orderId']) ? $_GET['orderId'] : null;
    if ($orderId) {
        $stmt = $conn->prepare("SELECT r.*, o.TableNumber FROM RECEIPTS r JOIN ORDERS o ON r.OrderID = o.OrderID WHERE r.OrderID = ?");
        $stmt->execute([$orderId]);
        $receipt = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($receipt);
    } else {
        $stmt = $conn->prepare("SELECT r.*, o.TableNumber FROM RECEIPTS r JOIN ORDERS o ON r.OrderID = o.OrderID ORDER BY r.CreatedAt DESC");
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} elseif ($method === 'PATCH') {
    // Process Payment
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['receiptNumber'])) {
        echo json_encode(["error" => "Missing receiptNumber"]);
        exit;
    }

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("UPDATE RECEIPTS SET PaymentStatus = 'Paid' WHERE ReceiptNumber = ?");
        $stmt->execute([$data['receiptNumber']]);

        // Get OrderID from Receipt
        $stmt = $conn->prepare("SELECT OrderID FROM RECEIPTS WHERE ReceiptNumber = ?");
        $stmt->execute([$data['receiptNumber']]);
        $receipt = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($receipt) {
            $stmt = $conn->prepare("UPDATE ORDERS SET OrderStatus = 'Paid' WHERE OrderID = ?");
            $stmt->execute([$receipt['OrderID']]);
        }

        $conn->commit();
        echo json_encode(["message" => "Payment successful"]);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(["error" => "Payment failed: " . $e->getMessage()]);
    }
}
?>
