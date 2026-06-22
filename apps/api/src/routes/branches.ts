import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All branches routes require authentication
router.use(authenticateToken);

// GET /api/v1/branches
router.get('/', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const branches = Array.from(db.branches.values()).filter(b => b.businessId === businessId);
  return res.json(branches);
});

// POST /api/v1/branches
router.post('/', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const { name, address, phone_number, location } = req.body;

  if (!name || !address || !phone_number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const id = uuidv4();
  const branch = { id, businessId, name, address, phoneNumber: phone_number, location };
  db.branches.set(id, branch);
  return res.status(201).json(branch);
});

// GET /api/v1/branches/dashboard/stats
router.get('/dashboard/stats', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const branches = Array.from(db.branches.values()).filter(b => b.businessId === businessId);
  const branchIds = branches.map(b => b.id);

  const tables = Array.from(db.tables.values()).filter(t => branchIds.includes(t.branchId));
  const tabs = Array.from(db.tabs.values()).filter(tab => branchIds.includes(tab.branchId));
  const bills = Array.from(db.bills.values()).filter(bill => branchIds.includes(bill.branchId));
  const orderItems = Array.from(db.orderItems.values()).filter(order => {
    const tab = db.tabs.get(order.tabId);
    return tab && branchIds.includes(tab.branchId);
  });

  // 1. Real-time sales (total paid amount in kobo)
  const real_time_sales = bills.reduce((sum, bill) => sum + bill.totalKobo, 0);

  // 2. Active tables (occupied)
  const active_tables = tables.filter(t => t.status === 'occupied').length;

  // 3. Waiter performance
  const performanceMap = new Map<string, { revenue: number; tabCount: number; name: string }>();
  tabs.forEach(tab => {
    if (!tab.staffId) return;
    const staff = db.users.get(tab.staffId);
    if (!staff) return;

    const stats = performanceMap.get(tab.staffId) || { revenue: 0, tabCount: 0, name: staff.fullName };
    stats.tabCount++;
    
    // Add bill total if tab is billed/paid
    const bill = bills.find(b => b.tabId === tab.id);
    if (bill) {
      stats.revenue += bill.totalKobo;
    }
    
    performanceMap.set(tab.staffId, stats);
  });

  const waiter_performance = Array.from(performanceMap.entries()).map(([id, stats]) => ({
    waiterId: id,
    ...stats
  }));

  // 4. Recent orders (last 20)
  const recent_orders = orderItems
    .slice(-20)
    .reverse();

  return res.json({
    real_time_sales,
    active_tables,
    waiter_performance,
    recent_orders
  });
});

// GET /api/v1/branches/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const branch = db.branches.get(req.params.id);
  if (!branch || branch.businessId !== businessId) {
    return res.sendStatus(404);
  }
  return res.json(branch);
});

// PATCH /api/v1/branches/:id
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const branch = db.branches.get(req.params.id);
  if (!branch || branch.businessId !== businessId) {
    return res.sendStatus(404);
  }

  const { name, address, phone_number, location } = req.body;
  if (name) branch.name = name;
  if (address) branch.address = address;
  if (phone_number) branch.phoneNumber = phone_number;
  if (location !== undefined) branch.location = location;

  return res.json(branch);
});

export default router;
