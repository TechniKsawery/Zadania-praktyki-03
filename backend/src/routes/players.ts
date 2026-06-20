import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, AuthenticatedRequest, requireRole } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: Notify users of changes
async function createNotificationForWatchers(playerId: number, message: string) {
  try {
    const watchers = await prisma.watchlist.findMany({
      where: { playerId }
    });
    const notifications = watchers.map(w => ({
      userId: w.userId,
      message
    }));
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }
  } catch (err) {
    console.error('Error creating notifications:', err);
  }
}

// Get all players with advanced filtering
router.get('/', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { position, country, club, minAge, maxAge, minPotential, search } = req.query;

    const whereClause: any = {};

    if (position) {
      whereClause.position = String(position);
    }
    if (country) {
      whereClause.nationality = String(country);
    }
    if (club) {
      whereClause.club = { contains: String(club) };
    }

    // Age filtering
    if (minAge || maxAge) {
      whereClause.age = {};
      if (minAge) whereClause.age.gte = parseInt(String(minAge));
      if (maxAge) whereClause.age.lte = parseInt(String(maxAge));
    }

    // Potential filtering (filtering based on associated scouting reports)
    if (minPotential) {
      whereClause.reports = {
        some: {
          potential: {
            in: String(minPotential).split(',') // e.g. "Elite,First Team"
          }
        }
      };
    }

    // Search query (first name, last name, club, nationality)
    if (search) {
      const searchStr = String(search);
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
          select: {
            potential: true,
            recommendation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(players);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single player
router.get('/:id', authenticateJWT as any, async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reports: {
          include: {
            author: {
              select: { name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        videos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.json(player);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create player (Admin & Head Scout & Scout can add players)
router.post('/', authenticateJWT as any, upload.single('photo'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

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

    let photoUrl = req.body.photoUrl || null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

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
        technique: parseInt(technique),
        speed: parseInt(speed),
        physicality: parseInt(physicality),
        creativity: parseInt(creativity),
        mentality: parseInt(mentality),
        creatorId: req.user.id
      }
    });

    return res.status(201).json(player);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Edit player (Admin & Head Scout & Scout who created it, or Admin/Head Scout can edit any)
router.put('/:id', authenticateJWT as any, upload.single('photo'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const playerId = parseInt(req.params.id);

    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Role check: Admin and Head Scout can edit any, Scout can only edit players they created
    if (req.user.role === 'SCOUT' && existingPlayer.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit players you added' });
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
      photoUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.photoUrl) {
      photoUrl = req.body.photoUrl;
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        firstName,
        lastName,
        position,
        age: age ? parseInt(age) : undefined,
        club,
        nationality,
        height: height ? parseInt(height) : undefined,
        preferredFoot,
        photoUrl,
        technique: technique ? parseInt(technique) : undefined,
        speed: speed ? parseInt(speed) : undefined,
        physicality: physicality ? parseInt(physicality) : undefined,
        creativity: creativity ? parseInt(creativity) : undefined,
        mentality: mentality ? parseInt(mentality) : undefined
      }
    });

    // Notify users watching this player
    await createNotificationForWatchers(playerId, `Profile of ${updatedPlayer.firstName} ${updatedPlayer.lastName} has been updated.`);

    return res.json(updatedPlayer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete player (Admin and Head Scout only)
router.delete('/:id', authenticateJWT as any, requireRole(['ADMIN', 'HEAD_SCOUT']) as any, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!existingPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Notify watchers before delete
    await createNotificationForWatchers(playerId, `Player ${existingPlayer.firstName} ${existingPlayer.lastName} has been deleted from the database.`);

    await prisma.player.delete({
      where: { id: playerId }
    });

    return res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
