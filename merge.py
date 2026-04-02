import os

with open('server/user-server.js', 'r', encoding='utf-8') as f:
    user_code = f.read()

with open('server/admin-server.js', 'r', encoding='utf-8') as f:
    admin_code = f.read()

# Filter imports and app init
header = """const express = require('express');
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

"""

# Extract routes user
u_start = user_code.find('// ─── BOOKS')
u_end = user_code.find('// ─── CATCH ALL')
user_routes = user_code[u_start:u_end].strip()

# Extract routes admin
a_start = admin_code.find('// ─── AUTH MIDDLEWARE')
a_end = admin_code.find('// ─── CATCH ALL')
admin_routes = admin_code[a_start:a_end].strip()

catch_all = """

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
"""

with open('server/server.js', 'w', encoding='utf-8') as f:
    f.write(header + user_routes + '\\n\\n' + admin_routes + catch_all)
