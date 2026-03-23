CREATE DATABASE IF NOT EXISTS `sikwate_house`;
USE `sikwate_house`;

CREATE TABLE `USERS` (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Kitchen', 'Service', 'Cashier', 'Customer') NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `TABLES` (
    TableID INT AUTO_INCREMENT PRIMARY KEY,
    TableNumber INT NOT NULL UNIQUE,
    Status ENUM('Available', 'Occupied', 'Cleaning') DEFAULT 'Available'
);

CREATE TABLE `MENU` (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    ItemName VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    ItemImage VARCHAR(255) DEFAULT NULL,
    DeletedAt TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE `ORDERS` (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    TableNumber INT NOT NULL,
    OrderStatus ENUM('Ordered', 'Preparing', 'Served', 'Delivered', 'Paid') DEFAULT 'Ordered',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `ORDER_ITEMS` (
    OrderItemID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT,
    ItemName VARCHAR(100) NOT NULL,
    Quantity INT NOT NULL,
    PriceAtOrder DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES `ORDERS`(OrderID)
);

CREATE TABLE `RECEIPTS` (
    ReceiptNumber VARCHAR(20) PRIMARY KEY,
    OrderID INT,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    PaymentStatus ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES `ORDERS`(OrderID)
);

-- SEED DATA (Cleaned as requested)
INSERT INTO `USERS` (Username, Password, Role) VALUES 
('kitchen', '123', 'Kitchen'),
('service', '123', 'Service'),
('cashier', '123', 'Cashier');

INSERT INTO `TABLES` (TableNumber) VALUES (1), (2), (3), (4), (5), (6);
