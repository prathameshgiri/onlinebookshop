# PageTurn — Online Book Shop 📚

Welcome to **PageTurn**, a fully-featured, dual-portal e-commerce web application for an online bookstore. This platform comes with a modern frontend for users to shop for books, track their orders, and contact support, alongside a secure admin dashboard to manage inventory, track realtime orders, and read customer messages.

> **Developer:** Prathamesh Giri  
> **Developed for:** Mayuri Kamble  

---

## 🌟 Key Features

### User Platform (`http://localhost:3000/`)
- **Modern UI/UX:** Premium aesthetic with dark themes, glassmorphism, and smooth animations.
- **Product Catalog:** Browse, filter, search, and view book details and stock status.
- **Cart & Checkout:** Fully functioning shopping cart with calculated shipping and multiple payment options (Card, UPI, COD).
- **Public Order Tracking:** A "Track Your Order" modal to view the realtime journey of your order along with a receipt of items purchased without needing to log in.
- **Contact Form:** Send inquiries and messages directly to the site administrators.
- **Real-Time Data:** Books display real covers dynamically from Open Library API and show actual INR (₹) prices.

### Admin Dashboard (`http://localhost:3000/admin`)
- **Actionable Analytics:** View realtime metrics including total sales, order statistics, unread messages, and sales categorized by genre.
- **Unified Server Architecture:** Both user and admin run off the same seamless single server instance, allowing for instant frontend deployment anywhere including Render!
- **Inventory Management:** Full CRUD operations — Add, edit, or delete books, update stock levels, prices, and manage book badges (e.g., "Bestseller").
- **Order Processing:** Track orders and update their delivery statuses (Pending, Processing, Shipped, Delivered, Cancelled).
- **Instant Notifications:** Polling-based notification bell alerts you of new orders and messages.

---

## 🛠️ Technology Stack
- **Frontend:** Vanilla HTML5, CSS3 (Custom Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+).
- **Backend Framework:** Node.js with Express.js.
- **Database:** LowDB (A lightweight, local JSON-based database).
- **Authentication:** JWT (JSON Web Tokens) & `bcryptjs` for secure admin logins.
- **Unified Structure:** Fully rewritten to use a single port (`server.js`), fully compatible with cloud hosting like Render!

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

### Step 4: Start the Project
To run the server properly, first install packages and seed the mock data, then run the project!
1. **Copy** and run this to install dependencies and mock data:
```bash
npm install && npm run seed
```
2. **Copy** and run this to start the actual website server!
```bash
npm start
```
3. *Wait for a few seconds.* It will display `Unified server running on port 3000`. You can leave it running.

### Step 5: Open in your Browser (Chrome/Edge)
Finally, to view your project, open your browser and go to these links:

- 🛒 **User Website (Main Shop):** Click 👉 [http://localhost:3000/](http://localhost:3000/)
- ⚙️ **Admin Dashboard Panel:** Click 👉 [http://localhost:3000/admin/](http://localhost:3000/admin/)

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

## 🌩️ Deployment (Render)

Deploying PageTurn to the cloud is incredibly simple thanks to our Unified Server Architecture! We highly recommend deploying as a **Web Service** on [Render.com](https://render.com/).

### Steps to Deploy:
1. **Push your code to GitHub:**
   Upload your repository to a new GitHub repository. Ensure your code is up to date.
2. **Login to Render:**
   Sign up or log in at the Render dashboard and click **New +** -> **Web Service**.
3. **Connect your Repository:**
   Select your GitHub repository from the list.
4. **Configure Settings:**
   - **Name:** *Your project name* (e.g., `pageturn-bookshop`)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run seed` *(This installs dependencies and seeds the mock database)*
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. **Deploy!**
   Click **Create Web Service**. Wait 2-3 minutes for the build to finish.
6. **Access your live website:**
   Your complete app is now live!
   - **User Store:** `https://your-app-name.onrender.com/`
   - **Admin Dashboard:** `https://your-app-name.onrender.com/admin/`

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
│   ├── server.js               # Unified backend logic & routes for the entire project!
│   ├── db.js                   # LowDB configuration adapter
│   └── seed.js                 # Database seeder script
├── package.json                # Project dependencies and script commands
└── README.md                   # Project documentation
```

---

*Thank you for exploring PageTurn!* 📖✨
