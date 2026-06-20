import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All business routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/business
 * Returns the authenticated user's business profile.
 */
router.get('/', (req: AuthRequest, res: Response) => {
  const business = db.businesses.get(req.user!.businessId);
  if (!business) {
    return res.sendStatus(404);
  }
  return res.json(business);
});

/**
 * PUT /api/v1/business
 * Update the business name and/or type (owner only).
 */
router.put('/', (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'owner') {
    return res.sendStatus(403);
  }

  const business = db.businesses.get(req.user!.businessId);
  if (!business) {
    return res.sendStatus(404);
  }

  const { name, type, logoUrl, cacDocumentUrl } = req.body;
  if (name) business.name = name;
  if (type) business.type = type;
  if (logoUrl) business.logoUrl = logoUrl;
  if (cacDocumentUrl) business.cacDocumentUrl = cacDocumentUrl;

  return res.json(business);
});

export default router;
