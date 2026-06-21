import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/';
    if (file.fieldname === 'photo') {
      dest = 'uploads/photos/';
    } else if (file.fieldname === 'video') {
      dest = 'uploads/videos/';
    }
    // Ensure directory exists
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'photo') {
      const allowedTypes = /jpeg|jpg|png|webp/i;
      const ext = allowedTypes.test(path.extname(file.originalname));
      const mime = allowedTypes.test(file.mimetype);
      if (ext && mime) {
        return cb(null, true);
      }
      cb(new Error('Tylko zdjęcia są dozwolone (jpeg, jpg, png, webp).'));
    } else if (file.fieldname === 'video') {
      const allowedTypes = /mp4|mov|avi|mkv/i;
      const ext = allowedTypes.test(path.extname(file.originalname));
      const mime = allowedTypes.test(file.mimetype);
      if (ext && mime) {
        return cb(null, true);
      }
      cb(new Error('Tylko nagrania wideo są dozwolone (mp4, mov, avi, mkv).'));
    } else {
      cb(null, true);
    }
  }
});

// GET / - List players with filtering (matching Dashboard.tsx search & filter options)
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { minAge, maxAge, position, country, club, minPotential, search } = req.query;

    const whereClause: any = {};

    if (position) {
      whereClause.position = position as string;
    }
    if (country) {
      whereClause.nationality = { contains: country as string };
    }
    if (club) {
      whereClause.club = { contains: club as string };
    }
    if (minAge) {
      whereClause.age = { ...whereClause.age, gte: parseInt(minAge as string) };
    }
    if (maxAge) {
      whereClause.age = { ...whereClause.age, lte: parseInt(maxAge as string) };
    }
    if (minPotential) {
      whereClause.reports = {
        some: {
          potential: minPotential as string
        }
      };
    }
    if (search) {
      const searchStr = search as string;
      whereClause.OR = [
        { firstName: { contains: searchStr } },
        { lastName: { contains: searchStr } },
        { club: { contains: searchStr } },
        { nationality: { contains: searchStr } }
      ];
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only get the latest report
          select: {
            potential: true,
            recommendation: true
          }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    res.json(players);
  } catch (error) {
    console.error('Błąd pobierania zawodników:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania zawodników' });
  }
});

// GET /:id - Single Player details
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'Nieprawidłowy identyfikator zawodnika' });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { username: true, role: true, name: true }
            }
          }
        },
        videos: {
          orderBy: { createdAt: 'desc' }
        },
        watchlist: {
          where: { userId: req.user?.id }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ error: 'Zawodnik nie został znaleziony' });
    }

    res.json(player);
  } catch (error) {
    console.error('Błąd pobierania zawodnika:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera' });
  }
});

// POST / - Create player
router.post('/', authenticateJWT, upload.single('photo'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      position,
      age,
      club,
      nationality,
      height,
      preferredFoot,
      technique,
      speed,
      physicality,
      creativity,
      mentality
    } = req.body;

    if (!firstName || !lastName || !position || !age || !club || !nationality || !height || !preferredFoot) {
      return res.status(400).json({ error: 'Wszystkie podstawowe pola profilu są wymagane.' });
    }

    const photoUrl = req.file ? `/uploads/photos/${req.file.filename}` : null;

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        position,
        age: parseInt(age),
        club,
        nationality,
        height: parseInt(height),
        preferredFoot,
        photoUrl,
        technique: technique ? Math.min(20, Math.max(1, parseInt(technique))) : 10,
        speed: speed ? Math.min(20, Math.max(1, parseInt(speed))) : 10,
        physicality: physicality ? Math.min(20, Math.max(1, parseInt(physicality))) : 10,
        creativity: creativity ? Math.min(20, Math.max(1, parseInt(creativity))) : 10,
        mentality: mentality ? Math.min(20, Math.max(1, parseInt(mentality))) : 10,
        creatorId: req.user!.id
      }
    });

    // Notify all Head Scouts and Admins about a new player
    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'HEAD_SCOUT'] } }
    });

    for (const u of users) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          playerId: player.id,
          message: `Dodano nowego zawodnika: ${player.firstName} ${player.lastName} (${player.position}) przez ${req.user!.username}`
        }
      });
    }

    res.status(201).json(player);
  } catch (error) {
    console.error('Błąd tworzenia zawodnika:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas dodawania zawodnika' });
  }
});

// PUT /:id - Edit player
router.put('/:id', authenticateJWT, upload.single('photo'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'Nieprawidłowy identyfikator' });
    }

    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Zawodnik nie istnieje' });
    }

    const {
      firstName,
      lastName,
      position,
      age,
      club,
      nationality,
      height,
      preferredFoot,
      technique,
      speed,
      physicality,
      creativity,
      mentality
    } = req.body;

    let photoUrl = existingPlayer.photoUrl;
    if (req.file) {
      if (existingPlayer.photoUrl) {
        const oldPath = path.join(process.cwd(), existingPlayer.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      photoUrl = `/uploads/photos/${req.file.filename}`;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        firstName: firstName || existingPlayer.firstName,
        lastName: lastName || existingPlayer.lastName,
        position: position || existingPlayer.position,
        age: age ? parseInt(age) : existingPlayer.age,
        club: club || existingPlayer.club,
        nationality: nationality || existingPlayer.nationality,
        height: height ? parseInt(height) : existingPlayer.height,
        preferredFoot: preferredFoot || existingPlayer.preferredFoot,
        photoUrl,
        technique: technique ? Math.min(20, Math.max(1, parseInt(technique))) : existingPlayer.technique,
        speed: speed ? Math.min(20, Math.max(1, parseInt(speed))) : existingPlayer.speed,
        physicality: physicality ? Math.min(20, Math.max(1, parseInt(physicality))) : existingPlayer.physicality,
        creativity: creativity ? Math.min(20, Math.max(1, parseInt(creativity))) : existingPlayer.creativity,
        mentality: mentality ? Math.min(20, Math.max(1, parseInt(mentality))) : existingPlayer.mentality
      }
    });

    // Notify observers
    const watchers = await prisma.watchlist.findMany({
      where: { playerId: updatedPlayer.id }
    });

    for (const w of watchers) {
      await prisma.notification.create({
        data: {
          userId: w.userId,
          playerId: updatedPlayer.id,
          message: `Profil zawodnika ${updatedPlayer.firstName} ${updatedPlayer.lastName} na twojej liście obserwowanych został zaktualizowany.`
        }
      });
    }

    res.json(updatedPlayer);
  } catch (error) {
    console.error('Błąd aktualizacji zawodnika:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji zawodnika' });
  }
});

// DELETE /:id - Delete player
router.delete('/:id', authenticateJWT, authorizeRoles(['ADMIN', 'HEAD_SCOUT']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'Nieprawidłowy identyfikator' });
    }

    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Zawodnik nie istnieje' });
    }

    // Delete static files
    if (existingPlayer.photoUrl) {
      const photoPath = path.join(process.cwd(), existingPlayer.photoUrl);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    const videos = await prisma.video.findMany({ where: { playerId } });
    for (const video of videos) {
      const videoPath = path.join(process.cwd(), video.videoUrl);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }

    await prisma.player.delete({
      where: { id: playerId }
    });

    res.json({ message: 'Zawodnik usunięty.' });
  } catch (error) {
    console.error('Błąd usuwania zawodnika:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas usuwania zawodnika' });
  }
});

export default router;
