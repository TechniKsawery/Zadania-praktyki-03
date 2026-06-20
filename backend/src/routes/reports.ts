import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

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

// Create scouting report
router.post('/', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      playerId,
      strengths,
      weaknesses,
      potential,
      recommendation,
      aiDescription,
      aiDevelopmentSuggestion,
      aiComparison
    } = req.body;

    if (!playerId || !strengths || !weaknesses || !potential || !recommendation) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const player = await prisma.player.findUnique({
      where: { id: parseInt(playerId) }
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const report = await prisma.scoutingReport.create({
      data: {
        playerId: parseInt(playerId),
        authorId: req.user.id,
        strengths,
        weaknesses,
        potential,
        recommendation,
        aiDescription,
        aiDevelopmentSuggestion,
        aiComparison
      }
    });

    // Notify watchers
    await createNotificationForWatchers(
      parseInt(playerId),
      `A new scouting report has been added for ${player.firstName} ${player.lastName} by ${req.user.username}.`
    );

    return res.status(201).json(report);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Edit scouting report
router.put('/:id', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const reportId = parseInt(req.params.id);

    const existingReport = await prisma.scoutingReport.findUnique({
      where: { id: reportId },
      include: { player: true }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Role check: Admin and Head Scout can edit any, Scout can only edit their own
    if (req.user.role === 'SCOUT' && existingReport.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own reports' });
    }

    const {
      strengths,
      weaknesses,
      potential,
      recommendation,
      aiDescription,
      aiDevelopmentSuggestion,
      aiComparison
    } = req.body;

    const updatedReport = await prisma.scoutingReport.update({
      where: { id: reportId },
      data: {
        strengths,
        weaknesses,
        potential,
        recommendation,
        aiDescription,
        aiDevelopmentSuggestion,
        aiComparison
      }
    });

    // Notify watchers
    await createNotificationForWatchers(
      existingReport.playerId,
      `Scouting report for ${existingReport.player.firstName} ${existingReport.player.lastName} has been updated.`
    );

    return res.json(updatedReport);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete scouting report
router.delete('/:id', authenticateJWT as any, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const reportId = parseInt(req.params.id);

    const existingReport = await prisma.scoutingReport.findUnique({
      where: { id: reportId }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Role check: Admin and Head Scout can delete any, Scout can only delete their own
    if (req.user.role === 'SCOUT' && existingReport.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own reports' });
    }

    await prisma.scoutingReport.delete({
      where: { id: reportId }
    });

    return res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Export scouting report to PDF
router.get('/:id/pdf', authenticateJWT as any, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = await prisma.scoutingReport.findUnique({
      where: { id: reportId },
      include: {
        player: true,
        author: {
          select: { name: true, role: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const { player, author } = report;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `ScoutReport_${player.lastName}_${Date.now()}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header styling
    doc.fillColor('#022c22').fontSize(24).text('SCOUT PRO', { align: 'center' });
    doc.fillColor('#0f766e').fontSize(12).text('FOOTBALL SCOUTING PLATFORM', { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Player Bio
    doc.fillColor('#1e293b').fontSize(16).text('Player Information', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#334155');
    doc.text(`Full Name: ${player.firstName} ${player.lastName}`);
    doc.text(`Position: ${player.position}`);
    doc.text(`Age: ${player.age} years old`);
    doc.text(`Current Club: ${player.club}`);
    doc.text(`Nationality: ${player.nationality}`);
    doc.text(`Height: ${player.height} cm`);
    doc.text(`Preferred Foot: ${player.preferredFoot}`);
    doc.moveDown(1.5);

    // Scout Ratings
    doc.fillColor('#1e293b').fontSize(16).text('Scouting Ratings (Scale 1-20)', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#334155');
    doc.text(`Technique: ${player.technique} / 20`);
    doc.text(`Speed: ${player.speed} / 20`);
    doc.text(`Physicality: ${player.physicality} / 20`);
    doc.text(`Creativity: ${player.creativity} / 20`);
    doc.text(`Mentality: ${player.mentality} / 20`);
    doc.moveDown(1.5);

    // Report Details
    doc.fillColor('#1e293b').fontSize(16).text('Scouting Report Details', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#334155');
    doc.fillColor('#0f766e').font('Helvetica-Bold').text('Strengths:').font('Helvetica');
    doc.fillColor('#334155').text(report.strengths);
    doc.moveDown(0.5);

    doc.fillColor('#b91c1c').font('Helvetica-Bold').text('Weaknesses:').font('Helvetica');
    doc.fillColor('#334155').text(report.weaknesses);
    doc.moveDown(0.5);

    doc.fillColor('#1e293b').text(`Overall Potential Class: ${report.potential}`);
    doc.text(`Recommendation: ${report.recommendation}`);
    doc.moveDown(1.5);

    // AI Section (if exists)
    if (report.aiDescription || report.aiDevelopmentSuggestion || report.aiComparison) {
      doc.fillColor('#1e293b').fontSize(16).text('AI Generated Insights', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor('#334155');
      if (report.aiDescription) {
        doc.fillColor('#0f766e').text('AI Player Description:');
        doc.fillColor('#334155').text(report.aiDescription);
        doc.moveDown(0.5);
      }
      if (report.aiComparison) {
        doc.fillColor('#0f766e').text('AI Similar Famous Players:');
        doc.fillColor('#334155').text(report.aiComparison);
        doc.moveDown(0.5);
      }
      if (report.aiDevelopmentSuggestion) {
        doc.fillColor('#0f766e').text('AI Development Road Map:');
        doc.fillColor('#334155').text(report.aiDevelopmentSuggestion);
        doc.moveDown(0.5);
      }
      doc.moveDown(1.5);
    }

    // Footer
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#64748b');
    doc.text(`Report created by Scout: ${author?.name || 'Unknown'} (${author?.role || 'SCOUT'})`, { align: 'left' });
    doc.text(`Date generated: ${new Date(report.createdAt).toLocaleDateString()}`, { align: 'left' });

    doc.end();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
