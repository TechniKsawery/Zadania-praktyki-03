import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi|mkv|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only video files (mp4, mov, avi, mkv, webm) are allowed!'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});

// Upload a video for a player
router.post('/upload', authenticateJWT as any, upload.single('video'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { playerId, title } = req.body;

    if (!playerId || !title) {
      return res.status(400).json({ error: 'Player ID and Video Title are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const videoUrl = `/uploads/${req.file.filename}`;

    const video = await prisma.video.create({
      data: {
        playerId: parseInt(playerId),
        title,
        videoUrl,
        uploadedById: req.user.id
      }
    });

    // Notify watchers
    try {
      const watchers = await prisma.watchlist.findMany({
        where: { playerId: parseInt(playerId) }
      });
      const notifications = watchers.map(w => ({
        userId: w.userId,
        message: `New video highlight "${title}" has been uploaded for ${player.firstName} ${player.lastName}.`
      }));
      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
    } catch (e) {
      console.error(e);
    }

    return res.status(201).json(video);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get videos for a player
router.get('/player/:playerId', authenticateJWT as any, async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      where: { playerId: parseInt(req.params.playerId) },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(videos);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
