const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'bookshop_admin_secret_2024';

app.use(cors());
app.use(express.json());

// Ensure the latest database state is read from disk on every request
app.use((req, res, next) => {
  db.read();
  next();
});

app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));
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

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.get('admins').find({ username }).value();
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, admin: { id: admin.id, username: admin.username, name: admin.name } });
});

app.get('/api/admin/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const books = db.get('books').value();
  const orders = db.get('orders').value();
  const messages = db.get('messages').value();
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const unreadMessages = messages.filter(m => !m.read).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const salesByCategory = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const book = books.find(b => b.id === item.id);
      if (book) {
        salesByCategory[book.category] = (salesByCategory[book.category] || 0) + item.quantity;
      }
    });
  });

  res.json({
    totalBooks: books.length,
    totalOrders: orders.length,
    totalRevenue: revenue.toFixed(2),
    unreadMessages,
    recentOrders,
    salesByCategory
  });
});

// ─── BOOKS CRUD ───────────────────────────────────────────────────────────────

app.get('/api/admin/books', authMiddleware, (req, res) => {
  const { search, category, page = 1, limit = 10 } = req.query;
  let books = db.get('books').value();

  if (search) {
    const q = search.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q)
    );
  }
  if (category && category !== 'All') {
    books = books.filter(b => b.category === category);
  }

  books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = books.length;
  const start = (page - 1) * limit;
  const paginated = books.slice(start, start + parseInt(limit));

  res.json({ books: paginated, total, pages: Math.ceil(total / limit) });
});

app.post('/api/admin/books', authMiddleware, (req, res) => {
  const { title, author, price, originalPrice, category, stock, description, badge, featured, coverImage } = req.body;
  if (!title || !author || !price || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const colors = ['#1a1a2e', '#0f3460', '#16213e', '#1b4332', '#2d1b69', '#1a3a4a', '#3d2b1f', '#0d2137'];
  const accents = ['#e94560', '#e2b04a', '#c84b31', '#f4d03f', '#f39c12', '#27ae60', '#e67e22', '#3498db'];
  const randIdx = Math.floor(Math.random() * colors.length);

  const book = {
    id: uuidv4(),
    title,
    author,
    price: parseFloat(price),
    originalPrice: parseFloat(originalPrice || price),
    category,
    stock: parseInt(stock || 0),
    description: description || '',
    rating: 4.0,
    reviews: 0,
    badge: badge || 'New',
    featured: featured === true || featured === 'true',
    coverColor: colors[randIdx],
    coverAccent: accents[randIdx],
    coverImage: coverImage || '',
    createdAt: new Date().toISOString()
  };

  db.get('books').push(book).write();
  res.status(201).json({ success: true, book });
});

app.put('/api/admin/books/:id', authMiddleware, (req, res) => {
  const book = db.get('books').find({ id: req.params.id }).value();
  if (!book) return res.status(404).json({ error: 'Book not found' });

  const updates = { ...req.body };
  if (updates.price) updates.price = parseFloat(updates.price);
  if (updates.originalPrice) updates.originalPrice = parseFloat(updates.originalPrice);
  if (updates.stock) updates.stock = parseInt(updates.stock);

  db.get('books').find({ id: req.params.id }).assign(updates).write();
  const updated = db.get('books').find({ id: req.params.id }).value();
  res.json({ success: true, book: updated });
});

app.delete('/api/admin/books/:id', authMiddleware, (req, res) => {
  const book = db.get('books').find({ id: req.params.id }).value();
  if (!book) return res.status(404).json({ error: 'Book not found' });
  db.get('books').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

app.get('/api/admin/orders', authMiddleware, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  let orders = db.get('orders').value();

  if (status && status !== 'all') {
    orders = orders.filter(o => o.status === status);
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = orders.length;
  const start = (page - 1) * limit;
  const paginated = orders.slice(start, start + parseInt(limit));

  res.json({ orders: paginated, total, pages: Math.ceil(total / limit) });
});

app.put('/api/admin/orders/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.get('orders').find({ id: req.params.id }).assign({ status }).write();
  res.json({ success: true });
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

app.get('/api/admin/messages', authMiddleware, (req, res) => {
  const messages = db.get('messages').value()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(messages);
});

app.put('/api/admin/messages/:id/read', authMiddleware, (req, res) => {
  db.get('messages').find({ id: req.params.id }).assign({ read: true }).write();
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', authMiddleware, (req, res) => {
  db.get('messages').remove({ id: req.params.id }).write();
  res.json({ success: true });
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

app.get('/api/admin/notifications', authMiddleware, (req, res) => {
  const { since } = req.query;
  const sinceDate = since ? new Date(since) : new Date(0);

  const orders = db.get('orders').value();
  const messages = db.get('messages').value();

  const newOrders = orders.filter(o => new Date(o.createdAt) > sinceDate);
  const newMessages = messages.filter(m => new Date(m.createdAt) > sinceDate && !m.read);

  const notifications = [
    ...newOrders.map(o => ({
      id: o.id,
      type: 'order',
      icon: '📦',
      title: 'New Order',
      body: `${o.orderNumber} — ${o.customer?.name || 'Guest'} (${formatPrice(o.total)})`,
      createdAt: o.createdAt,
      link: 'orders'
    })),
    ...newMessages.map(m => ({
      id: m.id,
      type: 'message',
      icon: '✉️',
      title: 'New Message',
      body: `${m.name}: ${m.subject}`,
      createdAt: m.createdAt,
      link: 'messages'
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    notifications,
    totalNew: newOrders.length + newMessages.length,
    newOrders: newOrders.length,
    newMessages: newMessages.length
  });
});

function formatPrice(n) {
  return '₹' + Math.round(parseFloat(n)).toLocaleString('en-IN');
}

// ─── CATCH ALL ────────────────────────────────────────────────────────────────
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'user', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Unified server running on port ${PORT}`);
});
