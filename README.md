# Sikwate House QR Prototype - Web System Overview

![Sikwate Theme](https://img.shields.io/badge/UI-Mobile%20First-34271D?style=for-the-badge&logo=react) ![Database](https://img.shields.io/badge/DB-MySQL-4479A1?style=for-the-badge&logo=mysql) ![Version](https://img.shields.io/badge/Status-PROTOTYPE-FFB14D?style=for-the-badge)

## ⚠️ PROTOTYPE DISCLAIMER
This software is currently a **Web-Based Prototype** built for testing and demonstration purposes. It simulates the core functionality (ordering, kitchen management, billing, and cashier checkout) of the restaurant system. 

**The actual production Mobile App will be published later.** This prototype ensures all databases, APIs, and business logic are fully verified before native mobile development begins.
**QR CODE IMAGES ARE STORED INSIDE THE FOLDER, THIS USES "IMPORT FROM" SINCE THE APP IS STILL UNDER PROTOYPE. ONCE FULLY BUILT, IT WILL USE THE ACTUAL CAMERA INSTEAD OF "IMPORT"
---

## 📖 System Overview

The **Sikwate House QR System** is a 4-role restaurant management platform designed with a strict mobile-first aesthetic. It handles the complete lifecycle of a customer's visit, from scanning a QR code to process checkout.

### Roles & Dashboards
1. **Customer**: Scans QR code, browses the menu, adds items to cart with inline quantity selectors, and tracks or cancels their pending orders.
2. **Kitchen Staff**: Receives order tickets in real-time, marks them as 'Ready for Delivery', and manages the entire restaurant menu (including uploading local photos).
3. **Service Staff**: Sees orders marked ready by the kitchen and delivers them to the specific table, logging a delivery history.
4. **Cashier**: Generates detailed receipts for generated orders, verifies itemized bills, and processes final payments to clear tables.

---

## 🛠️ How to Install & Run

### Prerequisites
1. **XAMPP / WAMP** Server (For MySQL and PHP hosting).
2. **Node.js** (v18 or higher recommended).

### 1. Database Setup
1. Open XAMPP and start **Apache** and **MySQL**.
2. Go to `http://localhost/phpmyadmin`.
3. Create a new database named `sikwate_house`.
4. Import the `database/schema.sql` file provided in this repository. 
   *(This creates the tables and default staff users).*

### 2. API Setup
Ensure the project folder `Sikwate_QR` is located inside your `htdocs` (XAMPP) or `www` (WAMP) folder so the PHP scripts can execute locally.

### 3. Frontend Dependencies
Open a terminal inside the `/frontend` directory and run:
```bash
npm install
```

### 4. Running the App (Desktop App Mode)
The client specifically requested the ability to run the system **without a standard web browser**. 

To launch the prototype as a standalone "Desktop Window" (no URL bar, no tabs, native feel), run the following command in the `/frontend` directory:

```bash
npm start
```

*How it works: This command starts the Vite development server in the background and uses `wait-on` to detect when it's ready. Once ready, it forces Microsoft Edge (or Chrome) to open the page in strict `--app=` mode, stripping away the browser UI.*

---

## 📊 Entity Relationship Diagram (ERD)

Below is the database structure powering the prototype:

```mermaid
erDiagram
    USERS {
        INT UserID PK "Auto Increment"
        VARCHAR Username "Unique"
        VARCHAR Password "Plaintext (Prototype)"
        ENUM Role "'Kitchen', 'Service', 'Cashier', 'Customer'"
        TIMESTAMP CreatedAt
    }

    TABLES {
        INT TableID PK "Auto Increment"
        INT TableNumber "Unique (1 to 6)"
        ENUM Status "'Available', 'Occupied', 'Cleaning'"
    }

    MENU {
        INT ItemID PK "Auto Increment"
        VARCHAR ItemName
        DECIMAL Price "(10,2)"
        VARCHAR Category
        VARCHAR ItemImage "Path to api/uploads/"
    }

    ORDERS {
        INT OrderID PK "Auto Increment"
        INT TableNumber
        ENUM OrderStatus "'Ordered', 'Preparing', 'Served', 'Delivered', 'Paid'"
        TIMESTAMP CreatedAt
    }

    ORDER_ITEMS {
        INT OrderItemID PK "Auto Increment"
        INT OrderID FK "Ref to ORDERS"
        VARCHAR ItemName
        INT Quantity
        DECIMAL PriceAtOrder "Locked price at checkout"
    }

    RECEIPTS {
        VARCHAR ReceiptNumber PK "Generated REC-timestamp-ID"
        INT OrderID FK "Ref to ORDERS"
        DECIMAL TotalAmount
        ENUM PaymentStatus "'Unpaid', 'Paid'"
        TIMESTAMP CreatedAt
    }

    ORDERS ||--o{ ORDER_ITEMS : "Contains"
    ORDERS ||--o| RECEIPTS : "Generates"
```

---

## 🔒 Default Login Credentials
For testing the staff portals, use the following credentials from the Launcher:

| Role | Username | Password |
|------|----------|----------|
| Kitchen | `kitchen` | `123` |
| Service | `service` | `123` |
| Cashier | `cashier` | `123` |

*(Note: Customers do not log in. They gain access by scanning a Table QR code from the Launcher's 'Import Image' or 'Scan' feature).*
