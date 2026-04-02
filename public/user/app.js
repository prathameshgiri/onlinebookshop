/* ─────────────────────────────────────────────────────────────────────────── */
/* USER SITE — app.js                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

const API = '/api';

// ─── STATE ─────────────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('pt_cart') || '[]');
let currentPage = 1;
let currentCategory = 'All';
let currentSort = '';
let searchQuery = '';
let bookCache = {}; // id → book object, used for cart price lookup

// ─── UTILS ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function saveCart() {
  localStorage.setItem('pt_cart', JSON.stringify(cart));
  updateCartUI();
}

function showToast(msg, type = 'success') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatPrice(n) {
  return '₹' + Math.round(parseFloat(n)).toLocaleString('en-IN');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++) stars += '<span class="star">★</span>';
  if (half) stars += '<span class="star" style="opacity:0.5">★</span>';
  return stars;
}

function getDiscount(price, original) {
  if (!original || original <= price) return null;
  return Math.round((1 - price / original) * 100) + '% off';
}

// ─── LOADER ─────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    $('loader').classList.add('hidden');
  }, 1200);
});

// ─── NAVBAR ─────────────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = $('navbar');
  if (window.scrollY > 30) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');

  // Active nav link
  const sections = ['home','featured','books','about','contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 100) current = id;
  });
  $$('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) link.classList.add('active');
  });
});

// Hamburger
$('hamburger').addEventListener('click', () => {
  $('navLinks').classList.toggle('mobile-open');
});

// Search toggle
$('searchToggle').addEventListener('click', () => {
  $('searchBar').classList.toggle('open');
  if ($('searchBar').classList.contains('open')) $('globalSearch').focus();
});
$('clearSearch').addEventListener('click', () => {
  $('globalSearch').value = '';
  searchQuery = '';
  currentPage = 1;
  loadBooks();
  $('searchBar').classList.remove('open');
});

let searchDebounce;
$('globalSearch').addEventListener('input', e => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = e.target.value;
    currentPage = 1;
    loadBooks();
    const booksSection = $('books');
    if (booksSection && e.target.value) {
      setTimeout(() => booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, 400);
});

// ─── HERO ───────────────────────────────────────────────────────────────────
function createFloatingBooks() {
  const container = $('floatingBooks');
  const colors = ['#7c3aed', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b'];
  for (let i = 0; i < 12; i++) {
    const book = document.createElement('div');
    book.className = 'floating-book';
    const size = 20 + Math.random() * 40;
    const height = size * 1.4;
    book.style.cssText = `
      width:${size}px; height:${height}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;
      animation-duration:${10 + Math.random() * 15}s;
      animation-delay:${-Math.random() * 20}s;
    `;
    container.appendChild(book);
  }
}

async function loadHeroStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    const nums = document.querySelectorAll('.stat-num[data-target]');
    nums.forEach(el => {
      const target = el.getAttribute('data-target') === '0'
        ? (el.closest('.stat').nextElementSibling?.nextElementSibling ? data.categories : data.totalBooks)
        : 0;
      animateCount(el, target);
    });
  } catch (e) {}
}

function animateCount(el, target) {
  let start = 0;
  const duration = 1500;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

async function loadHeroShowcase() {
  try {
    const res = await fetch(`${API}/books/featured`);
    const books = await res.json();
    const showcase = $('bookShowcase');
    showcase.innerHTML = '';
    books.slice(0, 4).forEach((book, i) => {
      const el = document.createElement('div');
      el.className = 'showcase-book';
      if (i === 0) el.style.gridColumn = 'span 2';
      el.style.background = book.coverColor;
      el.innerHTML = `
        ${book.coverImage ? `<img class="showcase-book-img" src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none'" loading="lazy">` : ''}
        <div class="showcase-book-badge">${book.badge}</div>
        <div class="showcase-book-title">${book.title}</div>
        <div class="showcase-book-author">${book.author}</div>
        <div class="showcase-book-price">${formatPrice(book.price)}</div>
      `;
      el.addEventListener('click', () => openBookModal(book));
      showcase.appendChild(el);
    });
  } catch (e) {}
}

// ─── FEATURED BOOKS ──────────────────────────────────────────────────────────
async function loadFeatured() {
  try {
    const res = await fetch(`${API}/books/featured`);
    const books = await res.json();
    books.forEach(b => { bookCache[b.id] = b; });
    const grid = $('featuredGrid');
    grid.innerHTML = books.map(b => renderBookCard(b)).join('');
    bindCardButtons();
  } catch (e) {
    $('featuredGrid').innerHTML = '<p style="color:var(--text3);text-align:center;grid-column:1/-1">Failed to load books.</p>';
  }
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await fetch(`${API}/books/categories`);
    const cats = await res.json();
    const filters = $('categoryFilters');
    filters.innerHTML = cats.map(c =>
      `<button class="cat-btn ${c === currentCategory ? 'active' : ''}" data-category="${c}">${c}</button>`
    ).join('');
    filters.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        currentPage = 1;
        loadBooks();
      });
    });
  } catch (e) {}
}

// ─── BOOKS GRID ──────────────────────────────────────────────────────────────
async function loadBooks() {
  const grid = $('booksGrid');
  grid.innerHTML = '<div class="loading-skeleton" style="height:300px;grid-column:1/-1"></div>';

  const params = new URLSearchParams({
    page: currentPage,
    limit: 8,
    category: currentCategory,
    sort: currentSort,
    search: searchQuery
  });

  try {
    const res = await fetch(`${API}/books?${params}`);
    const data = await res.json();

    if (data.books.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text2)">
          <div style="font-size:48px;margin-bottom:16px">📭</div>
          <p>No books found matching your search.</p>
        </div>`;
      $('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = data.books.map((b, i) => { bookCache[b.id] = b; return renderBookCard(b, i * 0.05); }).join('');
    bindCardButtons();
    renderPagination(data.pages);
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--text3);text-align:center;grid-column:1/-1">Failed to load books.</p>';
  }
}

function renderBookCard(book, delay = 0) {
  const discount = getDiscount(book.price, book.originalPrice);
  const stockClass = book.stock <= 5 ? 'stock-low' : '';
  const stockText = book.stock === 0 ? '❌ Out of stock' : book.stock <= 5 ? `⚠️ Only ${book.stock} left!` : `✅ In stock (${book.stock})`;
  const imgTag = book.coverImage
    ? `<img class="book-cover-img" src="${book.coverImage}" alt="${book.title}" loading="lazy" onerror="this.style.display='none'">`
    : '';
  return `
    <div class="book-card" data-id="${book.id}" style="animation-delay:${delay}s">
      <div class="book-cover" style="background:${book.coverColor}">
        ${imgTag}
        <div class="book-cover-badge">${book.badge}</div>
        <div class="book-cover-title">${book.title}</div>
        <div class="book-cover-author">${book.author}</div>
      </div>
      <div class="book-info">
        <div class="book-meta">
          <div class="book-rating">
            ${renderStars(book.rating)}
            <span style="font-size:13px;margin-left:4px;font-weight:600">${book.rating}</span>
            <span class="rating-count">(${book.reviews.toLocaleString()})</span>
          </div>
          <span class="book-category">${book.category}</span>
        </div>
        <div class="book-pricing">
          <span class="book-price">${formatPrice(book.price)}</span>
          ${book.originalPrice > book.price ? `<span class="book-original">${formatPrice(book.originalPrice)}</span>` : ''}
          ${discount ? `<span class="book-discount">${discount}</span>` : ''}
        </div>
        <div class="book-actions">
          ${book.stock > 0
            ? `<button class="add-to-cart" data-id="${book.id}">🛒 Add to Cart</button>`
            : `<button class="add-to-cart" disabled style="opacity:0.5;cursor:not-allowed">Out of Stock</button>`
          }
          <button class="view-btn" data-id="${book.id}">👁️</button>
        </div>
        <div class="book-stock ${stockClass}">${stockText}</div>
      </div>
    </div>`;
}

function bindCardButtons() {
  $$('.add-to-cart[data-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });
  $$('.view-btn[data-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      fetchAndOpenModal(btn.dataset.id);
    });
  });
  $$('.book-card[data-id]').forEach(card => {
    card.addEventListener('click', () => fetchAndOpenModal(card.dataset.id));
  });
}

function renderPagination(totalPages) {
  const pag = $('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  pag.innerHTML = html;
  $$('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      loadBooks();
      $('books').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// Sort
$('sortSelect').addEventListener('change', e => {
  currentSort = e.target.value;
  currentPage = 1;
  loadBooks();
});

// ─── CART ───────────────────────────────────────────────────────────────────
function addToCart(bookId) {
  const existing = cart.find(item => item.id === bookId);
  if (existing) {
    existing.quantity++;
  } else {
    // Prefer bookCache (from API), fall back to DOM
    const book = bookCache[bookId];
    const card = document.querySelector(`.book-card[data-id="${bookId}"]`);
    const title = book?.title || card?.querySelector('.book-cover-title')?.textContent || 'Unknown';
    const author = book?.author || card?.querySelector('.book-cover-author')?.textContent || '';
    const price = book?.price || 0;
    const coverColor = book?.coverColor || card?.querySelector('.book-cover')?.style.background || '#1a1a2e';
    const coverImage = book?.coverImage || '';
    cart.push({ id: bookId, title, author, price, quantity: 1, coverColor, coverImage });
  }
  saveCart();
  showToast('Added to cart! 🛒', 'success');
}

function updateCartUI() {
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const badge = $('cartBadge');
  badge.textContent = totalItems;
  badge.classList.toggle('visible', totalItems > 0);

  const itemsContainer = $('cartItems');
  const footer = $('cartFooter');

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <a href="#books" class="btn btn-primary btn-sm" onclick="closeCart()">Browse Books</a>
      </div>`;
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-cover" style="background:${item.coverColor}; color:#fff">
        ${item.title?.substring(0, 15) || ''}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-author">${item.author}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑</button>
    </div>
  `).join('');

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  $('cartTotal').textContent = formatPrice(total);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(id);
  else saveCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function openCart() {
  $('cartSidebar').classList.add('open');
  $('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('cartSidebar').classList.remove('open');
  $('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

$('cartToggle').addEventListener('click', openCart);
$('closeCart').addEventListener('click', closeCart);
$('cartOverlay').addEventListener('click', closeCart);

// ─── BOOK MODAL ──────────────────────────────────────────────────────────────
async function fetchAndOpenModal(id) {
  try {
    const res = await fetch(`${API}/books/${id}`);
    const book = await res.json();
    openBookModal(book);
  } catch (e) { showToast('Failed to load book details.', 'error'); }
}

function openBookModal(book) {
  const discount = getDiscount(book.price, book.originalPrice);
  const imgTag = book.coverImage
    ? `<img class="modal-cover-img" src="${book.coverImage}" alt="${book.title}" onerror="this.style.display='none'" loading="lazy">`
    : '';
  $('modalContent').innerHTML = `
    <div class="modal-cover" style="background:${book.coverColor}">
      ${imgTag}
      <span class="book-cover-badge">${book.badge}</span>
      <h2>${book.title}</h2>
      <p>${book.author}</p>
    </div>
    <div class="modal-info">
      <h3>${book.title}</h3>
      <div class="book-rating" style="margin-bottom:12px">
        ${renderStars(book.rating)}
        <span style="font-size:13px;font-weight:600;margin-left:4px">${book.rating}</span>
        <span class="rating-count">(${book.reviews.toLocaleString()} reviews)</span>
      </div>
      <div class="book-pricing">
        <span class="book-price">${formatPrice(book.price)}</span>
        ${book.originalPrice > book.price ? `<span class="book-original">${formatPrice(book.originalPrice)}</span>` : ''}
        ${discount ? `<span class="book-discount">${discount}</span>` : ''}
      </div>
      <p class="modal-desc">${book.description}</p>
      <div class="modal-meta">
        <div class="modal-meta-item"><span>Category</span><span>${book.category}</span></div>
        <div class="modal-meta-item"><span>Stock</span><span>${book.stock > 0 ? book.stock + ' copies' : 'Out of stock'}</span></div>
        <div class="modal-meta-item"><span>Rating</span><span>${book.rating}/5</span></div>
        <div class="modal-meta-item"><span>Reviews</span><span>${book.reviews.toLocaleString()}</span></div>
      </div>
      ${book.stock > 0
        ? `<button class="btn btn-primary w-full" onclick="addToCart('${book.id}'); closeBookModal()">🛒 Add to Cart</button>`
        : `<button class="btn btn-primary w-full" disabled style="opacity:0.5;cursor:not-allowed">Out of Stock</button>`
      }
    </div>`;
  $('bookModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBookModal() {
  $('bookModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

$('closeBookModal').addEventListener('click', closeBookModal);
$('bookModalOverlay').addEventListener('click', e => {
  if (e.target === $('bookModalOverlay')) closeBookModal();
});

// ─── CHECKOUT ────────────────────────────────────────────────────────────────
let checkoutStep = 1;
let selectedPayment = 'card';

$('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) return;
  closeCart();
  checkoutStep = 1;
  selectedPayment = 'card';
  renderCheckoutStep();
  $('checkoutModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
});

$('closeCheckoutModal').addEventListener('click', () => {
  $('checkoutModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
});
$('checkoutModalOverlay').addEventListener('click', e => {
  if (e.target === $('checkoutModalOverlay')) {
    $('checkoutModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }
});

function setStepIndicator(step) {
  [$('step1Ind'), $('step2Ind'), $('step3Ind')].forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < step) el.classList.add('done');
    else if (i + 1 === step) el.classList.add('active');
  });
}

function renderCheckoutStep() {
  setStepIndicator(checkoutStep);
  const body = $('checkoutBody');
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;


  if (checkoutStep === 1) {
    body.innerHTML = `
      <div class="checkout-section">
        <h3>Your Order (${cart.length} item${cart.length > 1 ? 's' : ''})</h3>
        <div class="checkout-items">
          ${cart.map(item => `
            <div class="checkout-item">
              <div class="cart-item-cover" style="background:${item.coverColor};color:#fff;width:40px;height:54px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;text-align:center;padding:4px;flex-shrink:0">${item.title?.substring(0, 12)}</div>
              <div class="checkout-item-info">
                <div class="checkout-item-title">${item.title}</div>
                <div class="checkout-item-qty">Qty: ${item.quantity}</div>
              </div>
              <div class="checkout-item-price">${formatPrice(item.price * item.quantity)}</div>
            </div>`).join('')}
        </div>
        <div class="checkout-summary">
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '🎉 FREE' : formatPrice(shipping)}</span></div>
          <div class="summary-row"><span style="color:var(--text3);font-size:12px">Free shipping on orders above ₹500</span><span></span></div>
          <div class="summary-row"><span>Total</span><span style="color:var(--accent3)">${formatPrice(total)}</span></div>
        </div>
      </div>
      <div class="checkout-section">
        <h3>Contact Details</h3>
        <div class="form-row">
          <div class="form-group"><label>First Name</label><input type="text" id="co-fname" placeholder="John" /></div>
          <div class="form-group"><label>Last Name</label><input type="text" id="co-lname" placeholder="Doe" /></div>
        </div>
        <div class="form-group"><label>Email</label><input type="email" id="co-email" placeholder="john@email.com" /></div>
        <div class="form-group"><label>Phone</label><input type="tel" id="co-phone" placeholder="+91 98765 43210" /></div>
        <div class="form-group"><label>Delivery Address</label><input type="text" id="co-address" placeholder="123 Main St, City, State ZIP" /></div>
      </div>
      <button class="btn btn-primary w-full" onclick="goToCheckoutStep2()">Continue to Payment →</button>`;
  } else if (checkoutStep === 2) {
    body.innerHTML = `
      <div class="checkout-section">
        <h3>Select Payment Method</h3>
        <div class="payment-options">
          <div class="payment-option ${selectedPayment==='card'?'selected':''}" onclick="selectPayment('card')">
            <span class="payment-icon">💳</span> Credit / Debit Card
          </div>
          <div class="payment-option ${selectedPayment==='upi'?'selected':''}" onclick="selectPayment('upi')">
            <span class="payment-icon">📱</span> UPI / Wallet
          </div>
          <div class="payment-option ${selectedPayment==='cod'?'selected':''}" onclick="selectPayment('cod')">
            <span class="payment-icon">💵</span> Cash on Delivery
          </div>
        </div>
        ${selectedPayment === 'card' ? `
          <div class="form-group"><label>Card Number</label><input type="text" placeholder="4242 4242 4242 4242" maxlength="19" /></div>
          <div class="form-row">
            <div class="form-group"><label>Expiry</label><input type="text" placeholder="MM/YY" maxlength="5" /></div>
            <div class="form-group"><label>CVV</label><input type="text" placeholder="123" maxlength="3" /></div>
          </div>
          <div class="form-group"><label>Cardholder Name</label><input type="text" placeholder="John Doe" /></div>` : ''}
        ${selectedPayment === 'upi' ? `
          <div class="form-group"><label>UPI ID</label><input type="text" placeholder="yourname@upi" /></div>` : ''}
        ${selectedPayment === 'cod' ? `
          <p style="color:var(--text2);font-size:14px;background:var(--surface);padding:16px;border-radius:12px">💵 Pay in cash when your order arrives. No additional charges.</p>` : ''}
      </div>
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn-ghost" onclick="checkoutStep=1;renderCheckoutStep()">← Back</button>
        <button class="btn btn-primary" style="flex:1" onclick="placeOrder()">🎉 Place Order (${formatPrice(total)})</button>
      </div>`;
  }
}

function selectPayment(method) {
  selectedPayment = method;
  renderCheckoutStep();
}

async function goToCheckoutStep2() {
  const fname = document.getElementById('co-fname')?.value.trim();
  const lname = document.getElementById('co-lname')?.value.trim();
  const email = document.getElementById('co-email')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  if (!fname || !email || !address) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }
  window._checkoutCustomer = { name: `${fname} ${lname}`, email, phone: document.getElementById('co-phone')?.value, address };
  checkoutStep = 2;
  renderCheckoutStep();
}

async function placeOrder() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal + shipping;


  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: window._checkoutCustomer,
        items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity })),
        total,
        paymentMethod: selectedPayment
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    cart = [];
    saveCart();

    setStepIndicator(3);
    $('checkoutBody').innerHTML = `
      <div class="order-success">
        <div class="order-success-icon">🎉</div>
        <h3>Order Placed!</h3>
        <p>Thank you for your order. You'll receive a confirmation email shortly.</p>
        <div class="order-number">${data.order.orderNumber}</div>
        <p style="color:var(--text3);font-size:13px">Estimated delivery: 2–4 business days</p>
        <button class="btn btn-primary" style="margin-top:24px" onclick="$('checkoutModalOverlay').classList.remove('open');document.body.style.overflow=''">
          Continue Shopping
        </button>
      </div>`;
    showToast('Order placed successfully!', 'success');
  } catch (e) {
    showToast('Failed to place order. Please try again.', 'error');
  }
}

// ─── CONTACT FORM ────────────────────────────────────────────────────────────
$('contactForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('contactSubmit');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Sending...';

  try {
    const res = await fetch(`${API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: $('cName').value,
        email: $('cEmail').value,
        subject: $('cSubject').value,
        message: $('cMessage').value
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error();
    $('formSuccess').classList.add('show');
    $('contactForm').reset();
    showToast('Message sent!', 'success');
  } catch (e) {
    showToast('Failed to send message. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Send Message';
  }
});

// ─── ORDER TRACKING ──────────────────────────────────────────────────────────
const TRACK_STEPS = [
  { key: 'pending',    icon: '📋', label: 'Order\nPlaced' },
  { key: 'processing', icon: '⚙️',  label: 'Processing' },
  { key: 'shipped',    icon: '🚚', label: 'Shipped' },
  { key: 'delivered',  icon: '✅', label: 'Delivered' }
];
const STEP_ORDER = ['pending','processing','shipped','delivered'];

function openTrackModal(prefillOrderNum) {
  $('trackModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  $('trackResult').innerHTML = '';
  if (prefillOrderNum && typeof prefillOrderNum === 'string') {
    $('trackInput').value = prefillOrderNum;
    trackOrder();
  } else {
    $('trackInput').value = '';
    trackAllOrders();
  }
}

function closeTrackModal() {
  $('trackModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function trackAllOrders() {
  const result = $('trackResult');
  result.innerHTML = `<div class="track-loading">📦 Loading recent orders...</div>`;
  $('trackSearchBtn').disabled = true;

  try {
    const res = await fetch(`${API}/orders/all-public`);
    const data = await res.json();

    if (!res.ok) throw new Error();

    if (!data.length) {
      result.innerHTML = `
        <div class="track-error" style="background:transparent;border:none">
          <div class="track-error-icon">📭</div>
          <strong>No orders yet</strong>
          <p style="margin-top:8px;font-size:13px;opacity:0.8">Be the first to place an order!</p>
        </div>`;
      return;
    }

    result.innerHTML = `
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;text-transform:uppercase;font-weight:600;text-align:center;">
        📚 Recent Orders
      </div>
      <div style="display:flex;flex-direction:column;gap:20px;">
        ${data.map(renderTrackResult).join('')}
      </div>
    `;
  } catch (e) {
    result.innerHTML = `<div class="track-error">⚠️ Failed to load orders.</div>`;
  } finally {
    $('trackSearchBtn').disabled = false;
  }
}

$('trackOrderBtn').addEventListener('click', () => openTrackModal());
$('closeTrackModal').addEventListener('click', closeTrackModal);
$('trackModalOverlay').addEventListener('click', e => {
  if (e.target === $('trackModalOverlay')) closeTrackModal();
});
$('trackSearchBtn').addEventListener('click', trackOrder);
$('trackInput').addEventListener('keydown', e => { if (e.key === 'Enter') trackOrder(); });

async function trackOrder() {
  const orderNum = $('trackInput').value.trim().toUpperCase();
  if (!orderNum) {
    showToast('Please enter an order number.', 'error');
    return;
  }

  const result = $('trackResult');
  result.innerHTML = `<div class="track-loading">🔍 Searching for your order...</div>`;
  $('trackSearchBtn').disabled = true;

  try {
    const res = await fetch(`${API}/orders/track/${encodeURIComponent(orderNum)}`);
    const data = await res.json();

    if (!res.ok) {
      result.innerHTML = `
        <div class="track-error">
          <div class="track-error-icon">📭</div>
          <strong>Order Not Found</strong>
          <p style="margin-top:8px;font-size:13px;opacity:0.8">${data.error || 'Please check your order number and try again.'}</p>
        </div>`;
      return;
    }

    result.innerHTML = renderTrackResult(data);

  } catch (e) {
    result.innerHTML = `
      <div class="track-error">
        <div class="track-error-icon">⚠️</div>
        <strong>Connection Error</strong>
        <p style="margin-top:8px;font-size:13px;opacity:0.8">Please try again in a moment.</p>
      </div>`;
  } finally {
    $('trackSearchBtn').disabled = false;
  }
}

function renderTrackResult(order) {
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  // Build timeline steps
  const stepsHtml = isCancelled
    ? `<div style="text-align:center;padding:16px;color:#f87171;font-weight:600">❌ Order Cancelled</div>`
    : TRACK_STEPS.map((step, i) => {
        const isDone   = i < currentIdx;
        const isActive = i === currentIdx;
        const cls = isDone ? 'done' : isActive ? 'active' : 'pending';
        return `
          <div class="timeline-step ${cls}">
            <div class="step-dot">${isDone ? '✓' : step.icon}</div>
            <div class="step-label">${step.label.replace('\n','<br>')}</div>
            ${isActive ? `<div class="step-date">${formatDate(order.createdAt)}</div>` : ''}
          </div>`;
      }).join('');

  // Items
  const itemsHtml = (order.items || []).map(item => `
    <div class="track-item">
      <div class="track-item-info">
        <div class="track-item-title">${item.title}</div>
        <div class="track-item-qty">Qty: ${item.quantity}</div>
      </div>
      <div class="track-item-price">${formatPrice(item.price * item.quantity)}</div>
    </div>`).join('');

  // Status message
  const statusMessages = {
    pending:    '📋 Your order has been placed and is awaiting confirmation.',
    processing: '⚙️ We are packing your books with care!',
    shipped:    '🚚 Your order is on its way! Estimated delivery: 2–3 days.',
    delivered:  '✅ Delivered! Enjoy your books. Happy reading! 📚',
    cancelled:  '❌ This order has been cancelled.'
  };

  return `
    <div class="track-result-card">
      <div class="track-result-top">
        <div>
          <div class="track-order-num">Order Number: <span>${order.orderNumber}</span></div>
          <div class="track-customer">👤 ${order.customerName} &nbsp;|&nbsp; 📅 ${formatDate(order.createdAt)}</div>
          <div style="margin-top:8px;font-size:13px;color:var(--text2)">${statusMessages[order.status] || ''}</div>
        </div>
        <div class="track-status-pill ${order.status}">${order.status}</div>
      </div>
      <div class="track-timeline">
        <div class="track-timeline-title">🗺️ Order Journey</div>
        <div class="timeline-steps">${stepsHtml}</div>
      </div>
      <div class="track-items">
        <div class="track-items-title">📚 Items in this order</div>
        ${itemsHtml}
      </div>
      <div class="track-total-row">
        <span class="track-total-label">Order Total</span>
        <span class="track-total-val">${formatPrice(order.total)}</span>
      </div>
    </div>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── INIT ───────────────────────────────────────────────────────────────────
async function init() {
  createFloatingBooks();
  updateCartUI();
  await Promise.all([
    loadHeroStats(),
    loadHeroShowcase(),
    loadFeatured(),
    loadCategories(),
    loadBooks()
  ]);
}

// Open track modal automatically after order placement
const _origPlaceOrder = placeOrder;
// Wire up track order from success screen (called inline in HTML)
window.openTrackModal = openTrackModal;

init();
