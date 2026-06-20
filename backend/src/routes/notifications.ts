import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get user notifications
router.get('/', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notification = await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { read: true }
    });

    return res.json(notification);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete read notifications
router.delete('/clear', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
        read: true
      }
    });

    return res.json({ message: 'Notifications cleared' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
