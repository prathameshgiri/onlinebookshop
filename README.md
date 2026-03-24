# PageTurn — Online Book Shop 📚

Welcome to **PageTurn**, a fully-featured, dual-portal e-commerce web application for an online bookstore. This platform comes with a modern frontend for users to shop for books, track their orders, and contact support, alongside a secure admin dashboard to manage inventory, track realtime orders, and read customer messages.

> **Developer:** Prathamesh Giri  
> **Developed for:** Mayuri Kamble  

---

## 🌟 Key Features

### User Platform (`http://localhost:3000`)
- **Modern UI/UX:** Premium aesthetic with dark themes, glassmorphism, and smooth animations.
- **Product Catalog:** Browse, filter, search, and view book details and stock status.
- **Cart & Checkout:** Fully functioning shopping cart with calculated shipping and multiple payment options (Card, UPI, COD).
- **Public Order Tracking:** A "Track Your Order" modal to view the realtime journey of your order along with a receipt of items purchased without needing to log in.
- **Contact Form:** Send inquiries and messages directly to the site administrators.
- **Real-Time Data:** Books display real covers dynamically from Open Library API and show actual INR (₹) prices.

### Admin Dashboard (`http://localhost:3001`)
- **Actionable Analytics:** View realtime metrics including total sales, order statistics, unread messages, and sales categorized by genre.
- **Real-time Synchronization:** Orders placed by users reflect in the dashboard instantly without manual server restarts.
- **Inventory Management:** Full CRUD operations — Add, edit, or delete books, update stock levels, prices, and manage book badges (e.g., "Bestseller").
- **Order Processing:** Track orders and update their delivery statuses (Pending, Processing, Shipped, Delivered, Cancelled).
- **Instant Notifications:** Polling-based notification bell alerts you of new orders and messages.

---

## 🛠️ Technology Stack
- **Frontend:** Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+).
- **Backend Framework:** Node.js with Express.js.
- **Database:** LowDB (A lightweight, local JSON-based database).
- **Authentication:** JWT (JSON Web Tokens) & `bcryptjs` for secure admin logins.
- **Concurrency:** `concurrently` package to run both User and Admin portals from a single command.

---

## 🚀 How to Run the Project

Follow these steps to set up and run the application on your local machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your computer.

### 2. Install Dependencies
Open your terminal inside the project directory (`Online Book Shop`) and install the required NPM packages by running:
```bash
npm install
```

### 3. Seed the Database
Before starting the server, seed the database with initial books, clean order/message histories, and create the default admin credentials:
```bash
npm run seed
```
*(This will generate a clean `data/db.json` file).*

### 4. Start the Application
Run the following command to start both the User REST API and the Admin REST API concurrently:
```bash
npm run dev
```

### 5. Open Your Browser
Once the servers are running, you can access the portals using the following links:
- **User Shop Window:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3001](http://localhost:3001)

#### Admin Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## 📂 Project Structure Overview

```text
Online Book Shop/
├── data/
│   └── db.json                 # Auto-generated JSON database
├── public/
│   ├── admin/                  # Admin Dashboard Frontend (HTML, CSS, JS)
│   └── user/                   # User Shop Frontend (HTML, CSS, JS)
├── server/
│   ├── admin-server.js         # Backend logic/routes for the Admin panel (Port 3001)
│   ├── user-server.js          # Backend logic/routes for the User app (Port 3000)
│   ├── db.js                   # LowDB configuration adapter
│   └── seed.js                 # Database seeder script
├── package.json                # Project dependencies and script commands
└── README.md                   # Project documentation
```

---

*Thank you for exploring PageTurn!* 📖✨
