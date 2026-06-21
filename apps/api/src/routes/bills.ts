import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All bills routes require authentication
router.use(authenticateToken);

// Helper: Get all branches for a business
function getBusinessBranchIds(businessId: string): string[] {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// POST /api/v1/bills/tab/:tabId/generate
router.post('/tab/:tabId/generate', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { serviceChargePercent = 0, discountKobo: inputDiscountKobo = 0 } = req.body;

  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }
  if (tab.status !== 'open' && tab.status !== 'billed') {
    return res.status(409).json({ message: 'Tab must be open or billed to generate bill' });
  }

  const orderItems = Array.from(db.orderItems.values())
    .filter(item => item.tabId === req.params.tabId);

  const subtotalKobo = orderItems.reduce((sum, item) =>
    sum + (item.priceKobo * item.quantity), 0);

  const serviceChargeKobo = Math.floor(subtotalKobo * (Number(serviceChargePercent) / 100));
  const discountKobo = Number(inputDiscountKobo);
  const totalKobo = subtotalKobo + serviceChargeKobo - discountKobo;

  const id = uuidv4();
  const bill = {
    id,
    tabId: req.params.tabId,
    branchId: tab.branchId,
    subtotalKobo,
    serviceChargePercent: Number(serviceChargePercent),
    discountKobo,
    totalKobo,
    createdAt: new Date()
  };

  db.bills.set(id, bill);
  tab.status = 'billed'; // Mark tab as billed if not already

  return res.status(201).json({ ...bill, orderItems });
});

// POST /api/v1/bills/tab/:tabId/pay
router.post('/tab/:tabId/pay', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { amount, method, reference } = req.body;

  if (amount === undefined || !method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }

  // Find the bill for this tab
  const bill = Array.from(db.bills.values()).find(b => b.tabId === req.params.tabId);
  if (!bill) {
    return res.status(404).json({ message: 'No bill found for this tab' });
  }
  if (bill.paidAt) {
    return res.status(409).json({ message: 'Bill is already paid' });
  }

  bill.paymentAmountKobo = Number(amount);
  bill.paymentMethod = method;
  bill.paymentReference = reference;
  bill.paidAt = new Date();

  tab.status = 'paid';
  tab.closedAt = new Date();

  // Mark table as available
  const table = db.tables.get(tab.tableId);
  if (table) {
    table.status = 'available';
  }

  return res.json(bill);
});

// GET /api/v1/bills/tab/:tabId/receipt
router.get('/tab/:tabId/receipt', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const tab = db.tabs.get(req.params.tabId);
  if (!tab || !branchIds.includes(tab.branchId)) {
    return res.sendStatus(404);
  }

  const bill = Array.from(db.bills.values()).find(b => b.tabId === req.params.tabId);
  if (!bill || !bill.paidAt) {
    return res.sendStatus(404);
  }

  const orderItems = Array.from(db.orderItems.values())
    .filter(item => item.tabId === req.params.tabId);

  return res.json({
    bill,
    tab,
    orderItems,
    receiptNumber: `REC-${bill.id.slice(0, 8).toUpperCase()}`
  });
});

export default router;
