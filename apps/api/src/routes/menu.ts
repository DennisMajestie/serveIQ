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
  const mappedMenuItems = menuItems.map(item => ({
    ...item,
    price_kobo: item.priceKobo,
    is_available: item.isAvailable,
    image_url: item.imageUrl
  }));
  return res.json(mappedMenuItems);
});

// POST /api/v1/menu
router.post('/', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const { name, category, priceKobo, price_kobo, unit, sku, barcode, imageUrl, image_url, isAvailable, is_available } = req.body;
  
  const finalPriceKobo = priceKobo !== undefined ? priceKobo : price_kobo;
  const finalImageUrl = imageUrl || image_url;
  const finalIsAvailable = isAvailable !== undefined ? isAvailable : (is_available !== undefined ? is_available : true);

  if (!name || !category || finalPriceKobo === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const id = uuidv4();
  const menuItem = {
    id,
    branchId: branchIds[0], // Default to first branch
    name,
    category,
    priceKobo: Number(finalPriceKobo),
    unit,
    sku,
    barcode,
    imageUrl: finalImageUrl,
    isAvailable: finalIsAvailable !== false
  };

  db.menuItems.set(id, menuItem);
  return res.status(201).json({
    ...menuItem,
    price_kobo: menuItem.priceKobo,
    is_available: menuItem.isAvailable,
    image_url: menuItem.imageUrl
  });
});

// GET /api/v1/menu/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const menuItem = db.menuItems.get(req.params.id);
  if (!menuItem || !branchIds.includes(menuItem.branchId)) {
    return res.sendStatus(404);
  }
  return res.json({
    ...menuItem,
    price_kobo: menuItem.priceKobo,
    is_available: menuItem.isAvailable,
    image_url: menuItem.imageUrl
  });
});

// PUT /api/v1/menu/:id
router.put('/:id', (req: AuthRequest, res: Response) => {
  const branchIds = getBusinessBranchIds(req.user!.businessId);
  const menuItem = db.menuItems.get(req.params.id);
  if (!menuItem || !branchIds.includes(menuItem.branchId)) {
    return res.sendStatus(404);
  }

  const { name, category, priceKobo, price_kobo, unit, sku, barcode, imageUrl, image_url, isAvailable, is_available } = req.body;
  
  if (name) menuItem.name = name;
  if (category) menuItem.category = category;
  if (priceKobo !== undefined || price_kobo !== undefined) {
    menuItem.priceKobo = Number(priceKobo !== undefined ? priceKobo : price_kobo);
  }
  if (unit !== undefined) menuItem.unit = unit;
  if (sku !== undefined) menuItem.sku = sku;
  if (barcode !== undefined) menuItem.barcode = barcode;
  if (imageUrl || image_url) menuItem.imageUrl = imageUrl || image_url;
  if (isAvailable !== undefined || is_available !== undefined) {
    menuItem.isAvailable = (isAvailable !== undefined ? isAvailable : is_available) !== false;
  }

  return res.json({
    ...menuItem,
    price_kobo: menuItem.priceKobo,
    is_available: menuItem.isAvailable,
    image_url: menuItem.imageUrl
  });
});

export default router;
