import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All tabs routes require authentication
router.use(authenticateToken);

// Helper: Get all branches for a business
function getBusinessBranchIds(businessId: string): string[] {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// POST /api/v1/tabs/open
router.post('/open', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { tableId, partySize, customerName, notes } = req.body;

  if (!tableId || partySize === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const table = db.tables.get(tableId);
  if (!table || !branchIds.includes(table.branchId)) {
    return res.sendStatus(404);
  }

  // Check if table is already occupied
  const existingOpenTab = Array.from(db.tabs.values()).find(tab =>
    tab.tableId === tableId && tab.status === 'open'
  );
  if (existingOpenTab) {
    return res.status(409).json({ message: 'Table already has an open tab' });
  }

  const id = uuidv4();
  const tab = {
    id,
    branchId: table.branchId,
    tableId,
    partySize: Number(partySize),
    customerName: customerName,
    notes,
    status: 'open' as const,
    openedAt: new Date()
  };

  db.tabs.set(id, tab);
  table.status = 'occupied'; // Mark table as occupied
  return res.status(201).json(tab);
});

// GET /api/v1/tabs
router.get('/', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { status } = req.query;

  let tabs = Array.from(db.tabs.values())
    .filter(tab => branchIds.includes(tab.branchId));

  if (status) {
    tabs = tabs.filter(tab => tab.status === status);
  }

  return res.json(tabs);
});

// GET /api/v1/tabs/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const tab = db.tabs.get(req.params.id);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }

  const orderItems = Array.from(db.orderItems.values())
    .filter(item => item.tabId === tab.id);

  return res.json({ ...tab, orderItems });
});

// POST /api/v1/tabs/:id/close
router.post('/:id/close', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const tab = db.tabs.get(req.params.id);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }
  if (tab.status !== 'open') {
    return res.status(409).json({ message: 'Tab is not open' });
  }

  tab.status = 'billed';
  tab.closedAt = new Date();
  return res.json(tab);
});

export default router;
