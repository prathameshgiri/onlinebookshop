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

## 🚀 How to Run the Project (Step-by-Step Guide)

Follow these exact steps to run the project on your computer. It is very simple!

### Step 1: Install Node.js (If not installed)
Before running the project, you need Node.js installed on your laptop/PC.
1. Go to Google and search for **Node.js** or click this link: [Download Node.js](https://nodejs.org/).
2. Download the version that says **"LTS (Recommended for Most Users)"**.
3. Install it exactly like you install any normal software (just click Next > Next > Finish).

### Step 2: Open the Project in VS Code
1. Open **Visual Studio Code (VS Code)**.
2. Click on `File` > `Open Folder...` (or press `Ctrl+K Ctrl+O`).
3. Select the `Online Book Shop` folder and click **Open**.

### Step 3: Open the Terminal in VS Code
Now, you need to open the terminal where you will paste the commands.
1. In VS Code, look at the top menu.
2. Click on `Terminal` > `New Terminal` (or press `` Ctrl + ` ``).
3. A terminal panel will open at the bottom of your screen. 
**Make sure the path in the terminal shows your project folder (e.g., `...\Online Book Shop>`).**

### Step 4: Start the Project (All-in-One Command)
You can install packages, generate mock data, and start both the user website and admin dashboard using just **one single command**!
1. **Copy** the command below:
```bash
npm start
```
2. **Paste** it into the VS Code terminal and press **Enter**.
3. *Wait for 1-2 minutes.* It will automatically download required folders (`node_modules`), create the database (`data/db.json`), and start the servers on Port 3000 and Port 3001.
4. Keep the terminal **OPEN**. Do not close VS Code while checking the website!

### Step 5: Open in your Browser (Chrome/Edge)
Finally, to view your project, open your browser and go to these links:

- 🛒 **User Website (Main Shop):** Click 👉 [http://localhost:3000](http://localhost:3000)
- ⚙️ **Admin Dashboard Panel:** Click 👉 [http://localhost:3001](http://localhost:3001)

> 💡 **Tip for Admin Login:**
> When you open the Admin Panel, it will ask for a login. Use these credentials:
> - **Username:** `admin`
> - **Password:** `admin123`

### How to Stop the Project?
When you are done checking the project and want to turn it off:
1. Go back to the VS Code terminal where the project is running.
2. Press `Ctrl + C` on your keyboard.
3. If it asks "Terminate batch job (Y/N)?", type `Y` and press **Enter**.

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
