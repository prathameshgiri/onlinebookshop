/* ─────────────────────────────────────────────────────────────────────────── */
/* ADMIN DASHBOARD — admin.js                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const API = '/api/admin';
let token = localStorage.getItem('pt_admin_token');
let currentPage = { books: 1, orders: 1 };
let orderStatusFilter = 'all';
let bookSearchQuery = '';
let notifLastChecked = localStorage.getItem('pt_notif_last') || new Date(0).toISOString();
let notifPollInterval = null;
let notifItems = [];

// ─── UTILS ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  $('toastContainer').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatPrice(n) { return '₹' + Math.round(parseFloat(n)).toLocaleString('en-IN'); }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function apiRequest(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── AUTH ───────────────────────────────────────────────────────────────────
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Signing in...';
  $('loginError').classList.remove('show');

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('loginUser').value,
        password: $('loginPass').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    token = data.token;
    localStorage.setItem('pt_admin_token', token);
    $('adminName').textContent = data.admin.name || data.admin.username;
    showDashboard();
  } catch (err) {
    const errEl = $('loginError');
    errEl.textContent = err.message || 'Invalid username or password';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Sign In';
  }
});

async function checkAuth() {
  if (!token) return;
  try {
    const data = await apiRequest('/verify');
    if (data.valid) {
      $('adminName').textContent = data.admin.username;
      showDashboard();
    }
  } catch {
    localStorage.removeItem('pt_admin_token');
    token = null;
  }
}

$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('pt_admin_token');
  token = null;
  if (notifPollInterval) clearInterval(notifPollInterval);
  notifItems = [];
  $('dashboard').style.display = 'none';
  $('loginScreen').style.display = 'flex';
  $('loginForm').reset();
});

function showDashboard() {
  $('loginScreen').style.display = 'none';
  $('dashboard').style.display = 'flex';
  // Set notification baseline to now on fresh login
  notifLastChecked = new Date().toISOString();
  localStorage.setItem('pt_notif_last', notifLastChecked);
  loadStats();
  showPage('overview');
  startNotifPolling();
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
function startNotifPolling() {
  pollNotifications(); // immediate
  if (notifPollInterval) clearInterval(notifPollInterval);
  notifPollInterval = setInterval(pollNotifications, 20000); // every 20s
}

async function pollNotifications() {
  if (!token) return;
  try {
    const since = notifLastChecked;
    const data = await apiRequest(`/notifications?since=${encodeURIComponent(since)}`);

    if (data.totalNew > 0) {
      // Show toast for truly new items (arrived since last poll)
      if (data.newOrders > 0) {
        showToast(`📦 ${data.newOrders} new order${data.newOrders > 1 ? 's' : ''}!`, 'info');
      }
      if (data.newMessages > 0) {
        showToast(`✉️ ${data.newMessages} new message${data.newMessages > 1 ? 's' : ''}!`, 'info');
      }
      // Try browser notification
      if (Notification.permission === 'granted') {
        new Notification('PageTurn Admin', {
          body: `You have ${data.totalNew} new notification${data.totalNew > 1 ? 's' : ''}`,
          icon: ''
        });
      }
    }

    // Prepend to our local notif list
    notifItems = [...data.notifications, ...notifItems.filter(n => !data.notifications.find(d => d.id === n.id))];
    notifItems = notifItems.slice(0, 30); // cap at 30

    updateNotifUI();

    // Update last-checked timestamp
    notifLastChecked = new Date().toISOString();
    localStorage.setItem('pt_notif_last', notifLastChecked);
  } catch (e) {}
}

function updateNotifUI() {
  const badge = $('notifBadge');
  const btn = $('notifBtn');
  const list = $('notifList');
  const unread = notifItems.filter(n => !n._read);

  if (unread.length > 0) {
    badge.style.display = 'flex';
    badge.textContent = unread.length > 9 ? '9+' : unread.length;
    btn.classList.add('has-new');
  } else {
    badge.style.display = 'none';
    btn.classList.remove('has-new');
  }

  if (!notifItems.length) {
    list.innerHTML = '<div class="notif-empty">🔔 No notifications yet</div>';
    return;
  }

  list.innerHTML = notifItems.map(n => `
    <div class="notif-item ${!n._read ? 'unread' : ''}" onclick="handleNotifClick('${n.id}', '${n.link}')">
      <div class="notif-icon ${n.type}">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.body}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>
    </div>`).join('');
}

function handleNotifClick(id, link) {
  // Mark as read locally
  const item = notifItems.find(n => n.id === id);
  if (item) item._read = true;
  updateNotifUI();
  $('notifDropdown').classList.remove('open');
  showPage(link);
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Bell toggle
$('notifBtn').addEventListener('click', e => {
  e.stopPropagation();
  $('notifDropdown').classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!$('notifWrap').contains(e.target)) {
    $('notifDropdown').classList.remove('open');
  }
});
$('markAllRead').addEventListener('click', () => {
  notifItems.forEach(n => n._read = true);
  updateNotifUI();
});

// Request browser notification permission
if (Notification.permission === 'default') Notification.requestPermission();


$('sidebarToggle').addEventListener('click', () => {
  const sidebar = $('sidebar');
  const main = document.querySelector('.main-content');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
  }
});

function showPage(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  $(`page-${pageId}`)?.classList.add('active');
  $(`nav${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`)?.classList.add('active');

  const titles = { overview: 'Overview', books: 'Books', orders: 'Orders', messages: 'Messages' };
  $('pageTitle').textContent = titles[pageId] || pageId;

  if (pageId === 'books') loadBooks();
  else if (pageId === 'orders') loadOrders();
  else if (pageId === 'messages') loadMessages();
}

$$('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showPage(item.dataset.page);
    if (window.innerWidth <= 768) $('sidebar').classList.remove('open');
  });
});

// ─── STATS & OVERVIEW ────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const data = await apiRequest('/stats');
    animateNum($('statBooks'), data.totalBooks);
    animateNum($('statOrders'), data.totalOrders);
    $('statRevenue').textContent = formatPrice(data.totalRevenue);
    animateNum($('statMessages'), data.unreadMessages);

    // Book count badge
    $('bookCountBadge').textContent = data.totalBooks;

    // Unread message badge
    if (data.unreadMessages > 0) {
      const badge = $('msgBadge');
      badge.textContent = data.unreadMessages;
      badge.style.display = 'inline-block';
    }

    // Recent orders
    const recentList = $('recentOrdersList');
    if (!data.recentOrders?.length) {
      recentList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No orders yet</p></div>';
    } else {
      recentList.innerHTML = data.recentOrders.map(o => `
        <div class="order-row">
          <span class="order-num">${o.orderNumber}</span>
          <span class="order-customer">${o.customer?.name || 'Guest'}</span>
          <span class="status-badge status-${o.status}">${o.status}</span>
          <span class="order-total">${formatPrice(o.total)}</span>
        </div>`).join('');
    }

    // Sales by category
    const catContainer = $('salesByCategory');
    const catData = data.salesByCategory || {};
    const maxVal = Math.max(...Object.values(catData), 1);
    if (!Object.keys(catData).length) {
      catContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>No sales data yet</p></div>';
    } else {
      catContainer.innerHTML = Object.entries(catData)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `
          <div class="category-bar">
            <div class="cat-bar-label"><span>${cat}</span><span>${count} sold</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${(count / maxVal) * 100}%"></div></div>
          </div>`).join('');
    }
  } catch (e) {
    showToast('Failed to load stats', 'error');
  }
}

function animateNum(el, target) {
  let start = 0;
  const step = target / 30;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 30);
}

// ─── BOOKS ───────────────────────────────────────────────────────────────────
let bookDebounce;
$('bookSearch').addEventListener('input', e => {
  clearTimeout(bookDebounce);
  bookDebounce = setTimeout(() => {
    bookSearchQuery = e.target.value;
    currentPage.books = 1;
    loadBooks();
  }, 400);
});

async function loadBooks() {
  const tbody = $('booksTbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">Loading…</td></tr>`;
  try {
    const params = new URLSearchParams({ page: currentPage.books, limit: 10, search: bookSearchQuery });
    const data = await apiRequest(`/books?${params}`);
    renderBooksTable(data.books);
    renderPagination('booksPagination', data.pages, 'books');
    $('bookCountBadge').textContent = data.total;
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--red)">Failed to load books.</td></tr>`;
  }
}

function renderBooksTable(books) {
  const tbody = $('booksTbody');
  if (!books.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📭</div><p>No books found</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = books.map(book => {
    const stockClass = book.stock === 0 ? 'badge-low' : book.stock <= 5 ? 'badge-low' : 'badge-ok';
    const stockLabel = book.stock === 0 ? 'Out' : book.stock <= 5 ? 'Low' : 'OK';
    const coverImg = book.coverImage
      ? `<img src="${book.coverImage}" alt="" onerror="this.style.display='none'" loading="lazy">`
      : '';
    return `
      <tr>
        <td>
          <div class="book-mini-cover" style="background:${book.coverColor}">
            ${coverImg}
            <span>${book.coverImage ? '' : book.title.substring(0, 8)}</span>
          </div>
        </td>
        <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500">${book.title}</td>
        <td style="color:var(--text2)">${book.author}</td>
        <td><span class="badge badge-new">${book.category}</span></td>
        <td style="font-weight:600">${formatPrice(book.price)}</td>
        <td><span class="badge ${stockClass}">${book.stock} · ${stockLabel}</span></td>
        <td style="color:var(--gold)">★ ${book.rating}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn" title="Edit" onclick="openEditBook('${book.id}')">✏️</button>
            <button class="action-btn danger" title="Delete" onclick="deleteBook('${book.id}', '${book.title.replace(/'/g,"\\'")}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Add Book
$('addBookBtn').addEventListener('click', () => {
  $('bookFormTitle').textContent = 'Add New Book';
  $('bookForm').reset();
  $('editBookId').value = '';
  $('saveBookBtn').textContent = 'Add Book';
  $('bookFormOverlay').classList.add('open');
});

$('closeBookForm').addEventListener('click', closeBookForm);
$('cancelBookForm').addEventListener('click', closeBookForm);
$('bookFormOverlay').addEventListener('click', e => { if (e.target === $('bookFormOverlay')) closeBookForm(); });

function closeBookForm() {
  $('bookFormOverlay').classList.remove('open');
  $('bookForm').reset();
}

async function openEditBook(id) {
  try {
    const params = new URLSearchParams({ page: 1, limit: 100 });
    const data = await apiRequest(`/books?${params}`);
    const book = data.books.find(b => b.id === id);
    if (!book) throw new Error('Not found');

    $('bookFormTitle').textContent = 'Edit Book';
    $('editBookId').value = id;
    $('bf-title').value = book.title;
    $('bf-author').value = book.author;
    $('bf-price').value = book.price;
    $('bf-original').value = book.originalPrice;
    $('bf-category').value = book.category;
    $('bf-stock').value = book.stock;
    $('bf-badge').value = book.badge;
    $('bf-featured').checked = book.featured;
    $('bf-image').value = book.coverImage || '';
    $('bf-desc').value = book.description;
    $('saveBookBtn').textContent = 'Save Changes';
    $('bookFormOverlay').classList.add('open');
  } catch (e) {
    showToast('Failed to load book.', 'error');
  }
}

$('bookForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('saveBookBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const payload = {
    title: $('bf-title').value,
    author: $('bf-author').value,
    price: $('bf-price').value,
    originalPrice: $('bf-original').value,
    category: $('bf-category').value,
    stock: $('bf-stock').value,
    badge: $('bf-badge').value,
    featured: $('bf-featured').checked,
    coverImage: $('bf-image').value,
    description: $('bf-desc').value
  };

  const editId = $('editBookId').value;
  try {
    if (editId) {
      await apiRequest(`/books/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Book updated!');
    } else {
      await apiRequest('/books', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Book added!');
    }
    closeBookForm();
    loadBooks();
    loadStats();
  } catch (err) {
    showToast(err.message || 'Failed to save.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'Save Changes' : 'Add Book';
  }
});

async function deleteBook(id, title) {
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  try {
    await apiRequest(`/books/${id}`, { method: 'DELETE' });
    showToast('Book deleted.');
    loadBooks();
    loadStats();
  } catch (e) {
    showToast('Failed to delete.', 'error');
  }
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
$$('#orderStatusFilter .filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('#orderStatusFilter .filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    orderStatusFilter = tab.dataset.status;
    currentPage.orders = 1;
    loadOrders();
  });
});

async function loadOrders() {
  const tbody = $('ordersTbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">Loading…</td></tr>`;
  try {
    const params = new URLSearchParams({ page: currentPage.orders, limit: 10, status: orderStatusFilter });
    const data = await apiRequest(`/orders?${params}`);
    renderOrdersTable(data.orders);
    renderPagination('ordersPagination', data.pages, 'orders');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--red);padding:40px">Failed to load orders.</td></tr>`;
  }
}

function renderOrdersTable(orders) {
  const tbody = $('ordersTbody');
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📭</div><p>No orders found</p></div></td></tr>`;
    return;
  }
  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const payIcons = { card: '💳', upi: '📱', cod: '💵' };

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="font-weight:600;font-size:12px;color:var(--accent3)">${o.orderNumber}</td>
      <td>
        <div style="font-weight:500">${o.customer?.name || 'Guest'}</div>
        <div style="font-size:11px;color:var(--text3)">${o.customer?.email || ''}</div>
      </td>
      <td style="color:var(--text2)">${o.items?.length || 0} item(s)</td>
      <td style="font-weight:600">${formatPrice(o.total)}</td>
      <td>${payIcons[o.paymentMethod] || '💰'} ${o.paymentMethod || 'N/A'}</td>
      <td>
        <select class="status-select" data-id="${o.id}" onchange="updateOrderStatus('${o.id}', this.value)">
          ${statusOptions.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </td>
      <td style="color:var(--text3);font-size:12px">${formatDate(o.createdAt)}</td>
      <td>
        <button class="action-btn" title="View Items" onclick="viewOrderItems('${o.id}')">👁️</button>
      </td>
    </tr>`).join('');
}

async function updateOrderStatus(id, status) {
  try {
    await apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast('Order status updated!');
    loadStats();
  } catch (e) {
    showToast('Failed to update status.', 'error');
  }
}

function viewOrderItems(orderId) {
  showToast('Open orders panel to see full details.', 'info');
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
async function loadMessages() {
  const list = $('messagesList');
  list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">Loading…</div>';
  try {
    const messages = await apiRequest('/messages');
    if (!messages.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No messages yet</p></div>';
      return;
    }
    list.innerHTML = messages.map(m => `
      <div class="message-card ${!m.read ? 'unread' : ''}" id="msg-${m.id}">
        ${!m.read ? '<div class="unread-dot"></div>' : ''}
        <div class="msg-header">
          <div class="msg-avatar">${m.name.charAt(0).toUpperCase()}</div>
          <div class="msg-from">
            <div class="msg-name">${m.name}</div>
            <div class="msg-email">${m.email}</div>
          </div>
          <div class="msg-time">${formatDate(m.createdAt)}</div>
        </div>
        <div class="msg-subject">📌 ${m.subject}</div>
        <div class="msg-body">${m.message}</div>
        <div class="msg-actions">
          ${!m.read ? `<button class="btn-primary btn-sm" onclick="markRead('${m.id}')">✅ Mark as Read</button>` : '<span style="color:var(--green);font-size:12px">✓ Read</span>'}
          <button class="btn-danger btn-sm" onclick="deleteMsg('${m.id}')">🗑️ Delete</button>
        </div>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Failed to load messages</p></div>';
  }
}

async function markRead(id) {
  try {
    await apiRequest(`/messages/${id}/read`, { method: 'PUT' });
    showToast('Marked as read.');
    loadMessages();
    loadStats();
  } catch (e) { showToast('Failed.', 'error'); }
}

async function deleteMsg(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await apiRequest(`/messages/${id}`, { method: 'DELETE' });
    showToast('Message deleted.');
    $(`msg-${id}`)?.remove();
    loadStats();
  } catch (e) { showToast('Failed.', 'error'); }
}

// ─── PAGINATION ────────────────────────────────────────────────────────────────
function renderPagination(containerId, totalPages, section) {
  const container = $(containerId);
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${currentPage[section] === i ? 'active' : ''}" onclick="goPage('${section}', ${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function goPage(section, page) {
  currentPage[section] = page;
  if (section === 'books') loadBooks();
  else if (section === 'orders') loadOrders();
}

// ─── INIT ───────────────────────────────────────────────────────────────────
checkAuth();
