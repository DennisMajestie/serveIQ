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

// GET /api/v1/branches/dashboard/stats
router.get('/dashboard/stats', (req: AuthRequest, res: Response) => {
  const businessId = req.user!.businessId;
  const branches = Array.from(db.branches.values()).filter(b => b.businessId === businessId);
  const tables = Array.from(db.tables.values()).filter(t => branches.some(b => b.id === t.branchId));
  const tabs = Array.from(db.tabs.values()).filter(tab => branches.some(b => b.id === tab.branchId));

  return res.json({
    totalBranches: branches.length,
    totalTables: tables.length,
    openTabs: tabs.filter(t => t.status === 'open').length,
    totalOrders: Array.from(db.orderItems.values()).length
  });
});

export default router;
