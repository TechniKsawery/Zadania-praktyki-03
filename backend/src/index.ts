import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import playerRoutes from './routes/players';
import reportRoutes from './routes/reports';
import watchlistRoutes from './routes/watchlist';
import videoRoutes from './routes/videos';
import aiRoutes from './routes/ai';
import notificationRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded images and videos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Scout Pro Backend listening on port ${PORT}`);
});
