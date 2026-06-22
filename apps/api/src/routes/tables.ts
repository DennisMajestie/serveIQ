import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All tables routes require authentication
router.use(authenticateToken);

// Helper: Get all branches for a business
function getBusinessBranchIds(businessId: string): string[] {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// GET /api/v1/tables
router.get('/', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const tables = Array.from(db.tables.values())
    .filter(table => branchIds.includes(table.branchId));
  const mappedTables = tables.map(table => ({
    ...table,
    table_number: table.tableNumber
  }));
  return res.json(mappedTables);
});

// POST /api/v1/tables
router.post('/', (req: AuthRequest, res: Response) => {
  const { table_number, tableNumber, capacity, label, branchId: bodyBranchId } = req.body;
  const finalTableNumber = String(tableNumber || table_number || '').trim();
  
  if (!finalTableNumber || capacity === undefined) {
    return res.status(400).json({ message: 'Table number and capacity are required' });
  }

  // Use provided branchId or fallback to business first branch
  const branchIds = Array.from(db.branches.values())
    .filter(b => b.businessId === req.user!.businessId)
    .map(b => b.id);
  
  const finalBranchId = bodyBranchId || branchIds[0] || 'default-branch';

  const id = uuidv4();
  const table = {
    id,
    branchId: finalBranchId,
    tableNumber: finalTableNumber,
    capacity: Number(capacity),
    label,
    status: 'available' as const
  };

  db.tables.set(id, table);
  return res.status(201).json({
    ...table,
    table_number: table.tableNumber
  });
});

// GET /api/v1/tables/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const table = db.tables.get(req.params.id);
  if (!table || !branchIds.includes(table.branchId)) {
    return res.sendStatus(404);
  }
  return res.json({
    ...table,
    table_number: table.tableNumber
  });
});

// PUT /api/v1/tables/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const table = db.tables.get(req.params.id);
  if (!table || !branchIds.includes(table.branchId)) {
    return res.sendStatus(404);
  }

  const { table_number, tableNumber, capacity, label } = req.body;
  const finalTableNumber = tableNumber || table_number;

  if (finalTableNumber) table.tableNumber = finalTableNumber;
  table.capacity = Number(capacity);
  table.label = label;

  return res.json({
    ...table,
    table_number: table.tableNumber
  });
});

// PUT /api/v1/tables/:id/status
router.put('/:id/status', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const table = db.tables.get(req.params.id);
  if (!table || !branchIds.includes(table.branchId)) {
    return res.sendStatus(404);
  }

  const status = req.body.status as 'available' | 'occupied' | 'reserved';
  if (!['available', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  table.status = status;
  return res.json({
    ...table,
    table_number: table.tableNumber
  });
});

export default router;
