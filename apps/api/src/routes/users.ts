import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile.
 */
router.get('/me', (req: AuthRequest, res: Response) => {
  const user = db.users.get(req.user!.userId);
  if (!user) {
    return res.sendStatus(404);
  }
  // Never expose the password hash
  const { passwordHash: _, ...safeUser } = user;
  return res.json(safeUser);
});

/**
 * PUT /api/v1/users/me
 * Update the authenticated user's name or email.
 */
router.put('/me', (req: AuthRequest, res: Response) => {
  const user = db.users.get(req.user!.userId);
  if (!user) {
    return res.sendStatus(404);
  }

  const { fullName, email } = req.body;

  // If changing email, ensure it is not already taken
  if (email && email !== user.email) {
    if (db.emails.has(email)) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    db.emails.delete(user.email);
    db.emails.set(email, user.id);
    user.email = email;
  }

  if (fullName) user.fullName = fullName;

  const { passwordHash: _, ...safeUser } = user;
  return res.json(safeUser);
});

/**
 * GET /api/v1/users/waiters
 * Returns all waiter accounts for the authenticated business.
 */
router.get('/waiters', (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'owner') {
    return res.sendStatus(403);
  }

  const waiters = Array.from(db.users.values())
    .filter(u => u.businessId === req.user!.businessId && u.role === 'waiter')
    .map(({ passwordHash: _, ...safe }) => safe);

  return res.json(waiters);
});

/**
 * POST /api/v1/users/waiter
 * Create a new waiter account for the business (owner only).
 */
router.post('/waiter', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'owner') {
    return res.sendStatus(403);
  }

  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'fullName, email and password are required' });
  }

  if (db.emails.has(email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const waiter = {
    id,
    businessId: req.user!.businessId,
    fullName,
    email,
    passwordHash,
    role: 'waiter' as const,
  };

  db.users.set(id, waiter);
  db.emails.set(email, id);

  const { passwordHash: _, ...safeWaiter } = waiter;
  return res.status(201).json(safeWaiter);
});

/**
 * DELETE /api/v1/users/:id
 * Remove a waiter from the business (owner only).
 */
router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'owner') {
    return res.sendStatus(403);
  }

  const user = db.users.get(req.params.id);
  if (!user || user.businessId !== req.user!.businessId) {
    return res.sendStatus(404);
  }

  if (user.role === 'owner') {
    return res.status(400).json({ message: 'Cannot delete the owner account' });
  }

  db.users.delete(req.params.id);
  db.emails.delete(user.email);
  return res.sendStatus(204);
});

export default router;
