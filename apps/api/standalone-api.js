// Standalone API server (runs with plain Node.js)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ------------------------------
// In-Memory Database
// ------------------------------
const db = {
  users: new Map(),
  businesses: new Map(),
  branches: new Map(),
  menuItems: new Map(),
  tables: new Map(),
  tabs: new Map(),
  orderItems: new Map(),
  bills: new Map(),
  emails: new Map()
};

// Seed Database
async function seedDatabase() {
  const businessId = uuidv4();
  const userId = uuidv4();
  const branchId = uuidv4();
  const passwordHash = await bcrypt.hash('password', 10);

  db.businesses.set(businessId, {
    id: businessId,
    name: "ServeIQ Demo",
    type: "restaurant"
  });

  db.users.set(userId, {
    id: userId,
    businessId,
    fullName: "Demo User",
    email: "demo@serveiq.com",
    passwordHash,
    role: "owner"
  });
  db.emails.set("demo@serveiq.com", userId);

  db.branches.set(branchId, {
    id: branchId,
    businessId,
    name: "Main Branch",
    address: "123 Demo Street",
    phoneNumber: "123-456-7890"
  });

  // Add menu items
  const menuItems = [
    { name: "Jollof Rice", category: "Main", priceKobo: 250000 },
    { name: "Fried Rice", category: "Main", priceKobo: 200000 },
    { name: "Grilled Chicken", category: "Protein", priceKobo: 150000 },
    { name: "Chapman", category: "Drinks", priceKobo: 50000 }
  ];
  menuItems.forEach(item => {
    const id = uuidv4();
    db.menuItems.set(id, {
      id, branchId, ...item, isAvailable: true
    });
  });

  // Add tables
  for (let i = 1; i <= 5; i++) {
    const id = uuidv4();
    db.tables.set(id, {
      id, branchId,
      tableNumber: String(i),
      capacity: 4,
      status: "available"
    });
  }
  console.log("✅ Database seeded!");
}

// ------------------------------
// Auth Middleware
// ------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'serveiq-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function getBusinessBranchIds(businessId) {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// ------------------------------
// Express App
// ------------------------------
const app = express();
const PORT = process.env.PORT || 4205;

app.use(cors());
app.use(express.json());

// ------------------------------
// Auth Routes
// ------------------------------
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, businessName, businessType } = req.body;
    if (db.emails.has(email)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const businessId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.businesses.set(businessId, { id: businessId, name: businessName, type: businessType });
    db.users.set(userId, { id: userId, businessId, fullName, email, passwordHash, role: 'owner' });
    db.emails.set(email, userId);

    // Create default branch
    const branchId = uuidv4();
    db.branches.set(branchId, {
      id: branchId, businessId,
      name: "Default Branch",
      address: "",
      phoneNumber: ""
    });

    res.status(201).json({
      business: db.businesses.get(businessId),
      owner: { id: userId, fullName, email, role: 'owner' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const userId = db.emails.get(email);
  if (!userId) return res.sendStatus(401);

  const user = db.users.get(userId);
  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) return res.sendStatus(401);

  const accessToken = jwt.sign(
    { userId: user.id, businessId: user.businessId, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ accessToken });
});

// ------------------------------
// Branches Routes
// ------------------------------
app.get('/api/v1/branches', authenticateToken, (req, res) => {
  const branches = Array.from(db.branches.values())
    .filter(b => b.businessId === req.user.businessId);
  res.json(branches);
});

app.post('/api/v1/branches', authenticateToken, (req, res) => {
  const { name, address, phoneNumber, location } = req.body;
  const id = uuidv4();
  const branch = { id, businessId: req.user.businessId, name, address, phoneNumber, location };
  db.branches.set(id, branch);
  res.status(201).json(branch);
});

app.get('/api/v1/branches/:id', authenticateToken, (req, res) => {
  const branch = db.branches.get(req.params.id);
  if (!branch || branch.businessId !== req.user.businessId) return res.sendStatus(404);
  res.json(branch);
});

app.patch('/api/v1/branches/:id', authenticateToken, (req, res) => {
  const branch = db.branches.get(req.params.id);
  if (!branch || branch.businessId !== req.user.businessId) return res.sendStatus(404);
  Object.assign(branch, req.body);
  res.json(branch);
});

// ------------------------------
// Menu Routes
// ------------------------------
app.get('/api/v1/menu', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const menuItems = Array.from(db.menuItems.values())
    .filter(item => branchIds.includes(item.branchId));
  res.json(menuItems);
});

app.post('/api/v1/menu', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { name, category, priceKobo, unit, sku, barcode, imageUrl, isAvailable = true } = req.body;
  const id = uuidv4();
  const item = { id, branchId: branchIds[0], name, category, priceKobo, unit, sku, barcode, imageUrl, isAvailable };
  db.menuItems.set(id, item);
  res.status(201).json(item);
});

app.get('/api/v1/menu/:id', authenticateToken, (req, res) => {
  const item = db.menuItems.get(req.params.id);
  const branchIds = getBusinessBranchIds(req.user.businessId);
  if (!item || !branchIds.includes(item.branchId)) return res.sendStatus(404);
  res.json(item);
});

app.put('/api/v1/menu/:id', authenticateToken, (req, res) => {
  const item = db.menuItems.get(req.params.id);
  const branchIds = getBusinessBranchIds(req.user.businessId);
  if (!item || !branchIds.includes(item.branchId)) return res.sendStatus(404);
  Object.assign(item, req.body);
  res.json(item);
});

// ------------------------------
// Tables Routes
// ------------------------------
app.get('/api/v1/tables', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const tables = Array.from(db.tables.values())
    .filter(t => branchIds.includes(t.branchId));
  res.json(tables);
});

app.post('/api/v1/tables', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { tableNumber, capacity, label } = req.body;
  const id = uuidv4();
  const table = { id, branchId: branchIds[0], tableNumber, capacity, label, status: 'available' };
  db.tables.set(id, table);
  res.status(201).json(table);
});

app.get('/api/v1/tables/:id', authenticateToken, (req, res) => {
  const table = db.tables.get(req.params.id);
  const branchIds = getBusinessBranchIds(req.user.businessId);
  if (!table || !branchIds.includes(table.branchId)) return res.sendStatus(404);
  res.json(table);
});

app.put('/api/v1/tables/:id', authenticateToken, (req, res) => {
  const table = db.tables.get(req.params.id);
  const branchIds = getBusinessBranchIds(req.user.businessId);
  if (!table || !branchIds.includes(table.branchId)) return res.sendStatus(404);
  Object.assign(table, req.body);
  res.json(table);
});

app.put('/api/v1/tables/:id/status', authenticateToken, (req, res) => {
  const table = db.tables.get(req.params.id);
  const branchIds = getBusinessBranchIds(req.user.businessId);
  if (!table || !branchIds.includes(table.branchId)) return res.sendStatus(404);
  table.status = req.body.status;
  res.json(table);
});

// ------------------------------
// Tabs Routes
// ------------------------------
app.post('/api/v1/tabs/open', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { tableId, partySize, customerName, notes } = req.body;

  const table = db.tables.get(tableId);
  if (!table || !branchIds.includes(table.branchId)) return res.sendStatus(404);

  const existingOpenTab = Array.from(db.tabs.values()).find(t => t.tableId === tableId && t.status === 'open');
  if (existingOpenTab) return res.status(409).json({ message: 'Table already has open tab' });

  const id = uuidv4();
  const tab = { id, branchId: table.branchId, tableId, partySize, customerName, notes, status: 'open', openedAt: new Date() };
  db.tabs.set(id, tab);
  table.status = 'occupied';
  res.status(201).json(tab);
});

app.get('/api/v1/tabs', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { status } = req.query;
  let tabs = Array.from(db.tabs.values()).filter(t => branchIds.includes(t.branchId));
  if (status) tabs = tabs.filter(t => t.status === status);
  res.json(tabs);
});

app.get('/api/v1/tabs/:id', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const tab = db.tabs.get(req.params.id);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);
  const orderItems = Array.from(db.orderItems.values()).filter(i => i.tabId === tab.id);
  res.json({ ...tab, orderItems });
});

app.post('/api/v1/tabs/:id/close', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const tab = db.tabs.get(req.params.id);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);
  if (tab.status !== 'open') return res.status(409).json({ message: 'Tab not open' });
  tab.status = 'billed';
  tab.closedAt = new Date();
  res.json(tab);
});

// ------------------------------
// Orders Routes
// ------------------------------
app.post('/api/v1/orders/tab/:tabId', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const items = req.body;
  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);
  if (tab.status !== 'open') return res.status(409).json({ message: 'Tab not open' });

  const createdItems = [];
  for (const item of items) {
    const menuItem = db.menuItems.get(item.menuItemId);
    if (!menuItem) return res.sendStatus(404);
    const id = uuidv4();
    const orderItem = {
      id, tabId: req.params.tabId, menuItemId: item.menuItemId,
      menuItemName: menuItem.name, priceKobo: menuItem.priceKobo,
      quantity: item.quantity, notes: item.notes
    };
    db.orderItems.set(id, orderItem);
    createdItems.push(orderItem);
  }
  res.status(201).json(createdItems);
});

app.get('/api/v1/orders/tab/:tabId', authenticateToken, (req, res) => {
  const orderItems = Array.from(db.orderItems.values()).filter(i => i.tabId === req.params.tabId);
  res.json(orderItems);
});

app.delete('/api/v1/orders/:id', authenticateToken, (req, res) => {
  db.orderItems.delete(req.params.id);
  res.sendStatus(204);
});

// ------------------------------
// Bills Routes
// ------------------------------
app.post('/api/v1/bills/tab/:tabId/generate', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { serviceChargePercent = 0, discountKobo = 0 } = req.body;

  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);

  const orderItems = Array.from(db.orderItems.values()).filter(i => i.tabId === req.params.tabId);
  const subtotalKobo = orderItems.reduce((sum, i) => sum + (i.priceKobo * i.quantity), 0);
  const serviceChargeKobo = Math.floor(subtotalKobo * (serviceChargePercent / 100));
  const totalKobo = subtotalKobo + serviceChargeKobo - discountKobo;

  const id = uuidv4();
  const bill = { id, tabId: req.params.tabId, branchId: tab.branchId, subtotalKobo, serviceChargePercent, discountKobo, totalKobo, createdAt: new Date() };
  db.bills.set(id, bill);
  tab.status = 'billed';
  res.status(201).json({ ...bill, orderItems });
});

app.post('/api/v1/bills/tab/:tabId/pay', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const { amount, method, reference } = req.body;

  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);

  const bill = Array.from(db.bills.values()).find(b => b.tabId === req.params.tabId);
  if (!bill) return res.status(404).json({ message: 'No bill found' });
  if (bill.paidAt) return res.status(409).json({ message: 'Already paid' });

  bill.paymentAmountKobo = amount;
  bill.paymentMethod = method;
  bill.paymentReference = reference;
  bill.paidAt = new Date();
  tab.status = 'paid';
  tab.closedAt = new Date();
  const table = db.tables.get(tab.tableId);
  if (table) table.status = 'available';
  res.json(bill);
});

app.get('/api/v1/bills/tab/:tabId/receipt', authenticateToken, (req, res) => {
  const branchIds = getBusinessBranchIds(req.user.businessId);
  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) return res.sendStatus(404);

  const bill = Array.from(db.bills.values()).find(b => b.tabId === req.params.tabId);
  if (!bill || !bill.paidAt) return res.sendStatus(404);

  const orderItems = Array.from(db.orderItems.values()).filter(i => i.tabId === req.params.tabId);
  res.json({ bill, tab, orderItems, receiptNumber: `REC-${bill.id.slice(0,8).toUpperCase()}` });
});

// ------------------------------
// Root & Health Check & Nemotron Proxy
// ------------------------------
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>ServeIQ API</title></head>
      <body style="font-family: system-ui; padding: 40px;">
        <h1>🚀 ServeIQ API is Running!</h1>
        <h2>Endpoints:</h2>
        <ul>
          <li><a href="/health">/health</a> - Health check</li>
          <li>POST /api/v1/auth/register - Register</li>
          <li>POST /api/v1/auth/login - Login</li>
          <li>GET /api/v1/branches - Branches</li>
          <li>GET /api/v1/menu - Menu</li>
          <li>GET /api/v1/tables - Tables</li>
        </ul>
        <h3>Demo Credentials:</h3>
        <p>Email: demo@serveiq.com<br>Password: password</p>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ServeIQ API' }));

// Proxy Nemotron API (for existing nemotron bridge compatibility)
const https = require('https');
app.post('/v1/chat/completions', (req, res) => {
  const proxyReq = https.request({
    host: 'integrate.api.nvidia.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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'
    }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
  req.pipe(proxyReq);
});

// ------------------------------
// Start Server
// ------------------------------
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 ServeIQ API is running!`);
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`\n🎯 Demo credentials:`);
    console.log(`   Email: demo@serveiq.com`);
    console.log(`   Password: password`);
    console.log(`\n`);
  });
});
