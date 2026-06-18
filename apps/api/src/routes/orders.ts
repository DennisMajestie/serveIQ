import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All orders routes require authentication
router.use(authenticateToken);

// Helper: Get all branches for a business
function getBusinessBranchIds(businessId: string): string[] {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// POST /api/v1/orders/tab/:tabId
router.post('/tab/:tabId', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const items = req.body as Array<{ menu_item_id: string; quantity: number; notes?: string }>;

  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }
  if (tab.status !== 'open') {
    return res.status(409).json({ message: 'Cannot add orders to a closed tab' });
  }

  const createdItems: any[] = [];
  for (const item of items) {
    const menuItem = db.menuItems.get(item.menu_item_id);
    if (!menuItem) {
      return res.status(404).json({ message: `Menu item ${item.menu_item_id} not found` });
    }

    const id = uuidv4();
    const orderItem = {
      id,
      tabId: req.params.tabId,
      menuItemId: item.menu_item_id,
      menuItemName: menuItem.name,
      priceKobo: menuItem.priceKobo,
      quantity: Number(item.quantity),
      notes: item.notes
    };

    db.orderItems.set(id, orderItem);
    createdItems.push(orderItem);
  }

  return res.status(201).json(createdItems);
});

// GET /api/v1/orders/tab/:tabId
router.get('/tab/:tabId', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }

  const orderItems = Array.from(db.orderItems.values())
    .filter(item => item.tabId === req.params.tabId);
  return res.json(orderItems);
});

// GET /api/v1/orders/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const orderItem = db.orderItems.get(req.params.id);
  if (!orderItem) {
    return res.sendStatus(404);
  }

  // Verify business ownership
  const tab = db.tabs.get(orderItem.tabId);
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }

  return res.json(orderItem);
});

// PUT /api/v1/orders/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const orderItem = db.orderItems.get(req.params.id);
  if (!orderItem) {
    return res.sendStatus(404);
  }

  // Verify business ownership
  const tab = db.tabs.get(orderItem.tabId);
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }
  if (tab.status !== 'open') {
    return res.status(409).json({ message: 'Cannot update orders in a closed tab' });
  }

  const { quantity, notes } = req.body;
  if (quantity !== undefined) orderItem.quantity = Number(quantity);
  if (notes !== undefined) orderItem.notes = notes;

  return res.json(orderItem);
});

// DELETE /api/v1/orders/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const orderItem = db.orderItems.get(req.params.id);
  if (!orderItem) {
    return res.sendStatus(404);
  }

  // Verify business ownership
  const tab = db.tabs.get(orderItem.tabId);
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }
  if (tab.status !== 'open') {
    return res.status(409).json({ message: 'Cannot delete orders in a closed tab' });
  }

  db.orderItems.delete(req.params.id);
  return res.sendStatus(204);
});

export default router;
