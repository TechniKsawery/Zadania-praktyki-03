import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Get current user's watchlist
router.get('/', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: req.user.id },
      include: {
        player: {
          include: {
            reports: {
              select: {
                potential: true,
                recommendation: true
              }
            }
          }
        }
      }
    });

    // Flatten to return players list directly with watchlist flag
    const players = watchlist.map(w => ({
      ...w.player,
      isOnWatchlist: true
    }));

    return res.json(players);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Add player to watchlist
router.post('/', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_playerId: {
          userId: req.user.id,
          playerId: parseInt(playerId)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Player already in watchlist' });
    }

    const watch = await prisma.watchlist.create({
      data: {
        userId: req.user.id,
        playerId: parseInt(playerId)
      }
    });

    return res.status(201).json(watch);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Remove player from watchlist
router.delete('/:playerId', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const playerId = parseInt(req.params.playerId);

    await prisma.watchlist.delete({
      where: {
        userId_playerId: {
          userId: req.user.id,
          playerId
        }
      }
    });

    return res.json({ message: 'Removed from watchlist successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
