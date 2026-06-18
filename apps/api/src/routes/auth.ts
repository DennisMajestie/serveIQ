import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { generateToken } from '../middleware';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, businessName, businessType } = req.body;

    // Check if email exists
    if (db.emails.has(email)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create business and user in transaction
    const businessId = uuidv4();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.businesses.set(businessId, {
      id: businessId,
      name: businessName,
      type: businessType
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

    return res.json({ accessToken });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
