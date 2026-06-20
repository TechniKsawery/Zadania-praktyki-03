import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET / - List observed players
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        player: {
          include: {
            reports: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                potential: true,
                recommendation: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const players = watchlist.map((item) => item.player);
    res.json(players);
  } catch (error) {
    console.error('Błąd pobierania listy obserwowanych:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania listy obserwowanych' });
  }
});

// POST / - Add to watchlist
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: 'Brak playerId w żądaniu' });
    }

    const pId = parseInt(playerId);
    if (isNaN(pId)) {
      return res.status(400).json({ error: 'Nieprawidłowy identyfikator gracza' });
    }

    const player = await prisma.player.findUnique({
      where: { id: pId }
    });

    if (!player) {
      return res.status(404).json({ error: 'Zawodnik nie istnieje' });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_playerId: { userId, playerId: pId }
      }
    });

    if (!existing) {
      await prisma.watchlist.create({
        data: { userId, playerId: pId }
      });
    }

    res.status(201).json({ message: 'Zawodnik dodany do listy obserwowanych.' });
  } catch (error) {
    console.error('Błąd dodawania do listy obserwowanych:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
});

// DELETE /:playerId - Remove from watchlist
router.delete('/:playerId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const playerId = parseInt(req.params.playerId);

    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'Nieprawidłowy identyfikator' });
    }

    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_playerId: { userId, playerId }
      }
    });

    if (existing) {
      await prisma.watchlist.delete({
        where: {
          userId_playerId: { userId, playerId }
        }
      });
    }

    res.json({ message: 'Zawodnik usunięty z listy obserwowanych.' });
  } catch (error) {
    console.error('Błąd usuwania z listy obserwowanych:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
});

export default router;
