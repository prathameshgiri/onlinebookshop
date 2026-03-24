const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Ensure the latest database state is read from disk on every request
// (Important because user-server and admin-server run in separate processes)
app.use((req, res, next) => {
  db.read();
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public', 'user')));

// ─── BOOKS ────────────────────────────────────────────────────────────────────

app.get('/api/books', (req, res) => {
  const { category, search, sort, page = 1, limit = 8 } = req.query;
  let books = db.get('books').value();

  if (category && category !== 'All') {
    books = books.filter(b => b.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }
  if (sort === 'price-asc') books.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') books.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') books.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = books.length;
  const start = (page - 1) * limit;
  const paginated = books.slice(start, start + parseInt(limit));

  res.json({ books: paginated, total, pages: Math.ceil(total / limit) });
});

app.get('/api/books/featured', (req, res) => {
  const featured = db.get('books').filter({ featured: true }).value();
  res.json(featured);
});

app.get('/api/books/categories', (req, res) => {
  const books = db.get('books').value();
  const categories = ['All', ...new Set(books.map(b => b.category))];
  res.json(categories);
});

app.get('/api/books/:id', (req, res) => {
  const book = db.get('books').find({ id: req.params.id }).value();
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

// Public endpoint to get all recent orders (requested by user)
app.get('/api/orders/all-public', (req, res) => {
  const orders = db.get('orders').value() || [];
  const safeOrders = orders.slice(-50).reverse().map(order => ({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    items: order.items,
    total: order.total,
    createdAt: order.createdAt,
    customerName: order.customer?.name || 'Customer'
  }));
  res.json(safeOrders);
});

// Public order tracking by order number
app.get('/api/orders/track/:orderNumber', (req, res) => {
  const order = db.get('orders').find({ orderNumber: req.params.orderNumber }).value();
  if (!order) return res.status(404).json({ error: 'Order not found. Please check your order number.' });
  // Return safe fields only (no full customer PII)
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    items: order.items,
    total: order.total,
    createdAt: order.createdAt,
    customerName: order.customer?.name || 'Customer',
    customerEmail: order.customer?.email || ''
  });
});

app.post('/api/orders', (req, res) => {
  const { customer, items, total, paymentMethod } = req.body;
  if (!customer || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const order = {
    id: uuidv4(),
    orderNumber: `ORD-${Date.now()}`,
    customer,
    items,
    total,
    paymentMethod: paymentMethod || 'card',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Reduce stock
  items.forEach(item => {
    const book = db.get('books').find({ id: item.id }).value();
    if (book && book.stock >= item.quantity) {
      db.get('books').find({ id: item.id }).assign({ stock: book.stock - item.quantity }).write();
    }
  });

  db.get('orders').push(order).write();
  res.status(201).json({ success: true, order });
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

app.post('/api/messages', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const msg = {
    id: uuidv4(),
    name,
    email,
    subject: subject || 'General Enquiry',
    message,
    read: false,
    createdAt: new Date().toISOString()
  };

  db.get('messages').push(msg).write();
  res.status(201).json({ success: true });
});

// ─── STATS (public) ───────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const books = db.get('books').value();
  const categories = new Set(books.map(b => b.category)).size;
  res.json({
    totalBooks: books.length,
    categories,
    happyReaders: '50K+',
    yearsOfService: 12
  });
});

// ─── CATCH ALL ────────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`📚 User server running at http://localhost:${PORT}`);
});
