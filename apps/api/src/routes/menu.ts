import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All menu routes require authentication
router.use(authenticateToken);

// Helper: Get all branches for a business
function getBusinessBranchIds(businessId: string): string[] {
  return Array.from(db.branches.values())
    .filter(b => b.businessId === businessId)
    .map(b => b.id);
}

// GET /api/v1/menu
router.get('/', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const menuItems = Array.from(db.menuItems.values())
    .filter(item => branchIds.includes(item.branchId));
  return res.json(menuItems);
});

// POST /api/v1/menu
router.post('/', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { name, category, price_kobo, unit, sku, barcode, image_url, is_available } = req.body;

  if (!name || !category || price_kobo === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const id = uuidv4();
  const menuItem = {
    id,
    branchId: branchIds[0], // Default to first branch
    name,
    category,
    priceKobo: Number(price_kobo),
    unit,
    sku,
    barcode,
    imageUrl: image_url,
    isAvailable: is_available !== false
  };

  db.menuItems.set(id, menuItem);
  return res.status(201).json(menuItem);
});

// GET /api/v1/menu/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const menuItem = db.menuItems.get(req.params.id);
  if (!menuItem || !branchIds.includes(menuItem.branchId)) {
    return res.sendStatus(404);
  }
  return res.json(menuItem);
});

// PUT /api/v1/menu/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const menuItem = db.menuItems.get(req.params.id);
  if (!menuItem || !branchIds.includes(menuItem.branchId)) {
    return res.sendStatus(404);
  }

  const { name, category, price_kobo, unit, sku, barcode, image_url, is_available } = req.body;
  menuItem.name = name;
  menuItem.category = category;
  menuItem.priceKobo = Number(price_kobo);
  menuItem.unit = unit;
  menuItem.sku = sku;
  menuItem.barcode = barcode;
  menuItem.imageUrl = image_url;
  menuItem.isAvailable = is_available !== false;

  return res.json(menuItem);
});

export default router;
