import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { generateToken } from '../middleware';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, businessName, businessType, logoUrl, cacDocumentUrl } = req.body;

    console.log(`[Register] Attempting registration for: ${email} (${businessName})`);

    // Check if email exists
    if (db.emails.has(email)) {
      console.warn(`[Register] Email already exists: ${email}`);
      return res.status(409).json({ message: 'Email already registered. Try logging in or use a different email.' });
    }

    // Create business and user in transaction
    const businessId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.businesses.set(businessId, {
      id: businessId,
      name: businessName,
      type: businessType,
      logoUrl,
      cacDocumentUrl
    });

    db.users.set(userId, {
      id: userId,
      businessId,
      fullName,
      email,
      passwordHash,
      role: 'owner'
    });

    db.emails.set(email, userId);

    return res.status(201).json({
      business: db.businesses.get(businessId),
      owner: { id: userId, fullName, email, role: 'owner' }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const userId = db.emails.get(email);
    if (!userId) {
      return res.sendStatus(401);
    }

    const user = db.users.get(userId);
    if (!user) {
      return res.sendStatus(401);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.sendStatus(401);
    }

    const accessToken = generateToken({
      userId: user.id,
      businessId: user.businessId,
      role: user.role
    });

    const branchIds = Array.from(db.branches.values())
      .filter(b => b.businessId === user.businessId)
      .map(b => b.id);

    return res.json({ 
      data: { 
        access_token: accessToken,
        user: { 
          id: user.id, 
          fullName: user.fullName, 
          email: user.email, 
          role: user.role, 
          businessId: user.businessId,
          branch_id: branchIds[0] || null
        }
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/activate
 * Admin login specifically for linking a terminal to a business.
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const userId = db.emails.get(email);
    const user = userId ? db.users.get(userId) : null;

    if (!user || user.role !== 'owner') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid admin credentials' });

    const business = db.businesses.get(user.businessId);
    const accessToken = generateToken({ userId: user.id, businessId: user.businessId, role: user.role });

    const branchIds = Array.from(db.branches.values())
      .filter(b => b.businessId === user.businessId)
      .map(b => b.id);

    return res.json({
      data: {
        businessId: business?.id,
        businessName: business?.name,
        branch_id: branchIds[0] || null,
        access_token: accessToken
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Activation error' });
  }
});

/**
 * POST /api/v1/auth/staff-login
 * Staff (waiter) login using PIN and businessId.
 */
router.post('/staff-login', async (req: Request, res: Response) => {
  try {
    const { pin, businessId } = req.body;
    
    const staff = Array.from(db.users.values()).find(u => 
      u.businessId === businessId && u.pin === pin && u.role === 'waiter'
    );

    if (!staff) {
      return res.status(401).json({ message: 'Incorrect PIN' });
    }

    const accessToken = generateToken({
      userId: staff.id,
      businessId: staff.businessId,
      role: staff.role
    });

    return res.json({
      data: {
        user: { 
          id: staff.id, 
          fullName: staff.fullName, 
          role: staff.role, 
          businessId: staff.businessId,
          branch_id: staff.branchId
        },
        access_token: accessToken
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Staff login error' });
  }
});

export default router;
