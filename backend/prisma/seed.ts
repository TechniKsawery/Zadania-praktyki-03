import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean database
  await prisma.notification.deleteMany();
  await prisma.video.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.scoutingReport.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
  const headPasswordHash = await bcrypt.hash('headpassword', salt);
  const scoutPasswordHash = await bcrypt.hash('scoutpassword', salt);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@scoutpro.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'System Admin'
    } as any
  });

  const headScout = await prisma.user.create({
    data: {
      username: 'headscout',
      email: 'headscout@scoutpro.com',
      passwordHash: headPasswordHash,
      role: 'HEAD_SCOUT',
      name: 'Sarah Chief'
    } as any
  });

  const scout = await prisma.user.create({
    data: {
      username: 'scout',
      email: 'scout@scoutpro.com',
      passwordHash: scoutPasswordHash,
      role: 'SCOUT',
      name: 'John Talent'
    } as any
  });

  console.log('Users created:', { admin: admin.email, headScout: headScout.email, scout: scout.email });

  // Create Players
  const player1 = await prisma.player.create({
    data: {
      firstName: 'Robert',
      lastName: 'Lewandowski',
      position: 'ST',
      age: 37,
      club: 'FC Barcelona',
      nationality: 'Poland',
      height: 185,
      preferredFoot: 'RIGHT',
      photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60',
      technique: 18,
      speed: 14,
      physicality: 17,
      creativity: 15,
      mentality: 19,
      creatorId: admin.id
    }
  });

  const player2 = await prisma.player.create({
    data: {
      firstName: 'Bukayo',
      lastName: 'Saka',
      position: 'RW',
      age: 24,
      club: 'Arsenal',
      nationality: 'England',
      height: 178,
      preferredFoot: 'LEFT',
      photoUrl: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60',
      technique: 17,
      speed: 18,
      physicality: 15,
      creativity: 18,
      mentality: 17,
      creatorId: headScout.id
    }
  });

  const player3 = await prisma.player.create({
    data: {
      firstName: 'Jude',
      lastName: 'Bellingham',
      position: 'CM',
      age: 22,
      club: 'Real Madrid',
      nationality: 'England',
      height: 186,
      preferredFoot: 'RIGHT',
      photoUrl: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=60',
      technique: 18,
      speed: 16,
      physicality: 18,
      creativity: 17,
      mentality: 19,
      creatorId: scout.id
    }
  });

  console.log('Players seeded!');

  // Create Reports
  await prisma.scoutingReport.create({
    data: {
      playerId: player1.id,
      authorId: headScout.id,
      strengths: 'World-class positioning, lethal finishing inside the box, elite penalty taker, highly professional mentality and physical longevity.',
      weaknesses: 'Pace is declining due to age, less active in high pressing phases than in his prime.',
      potential: 'Squad Player',
      recommendation: 'MONITOR',
      aiDescription: 'Robert Lewandowski is a veteran striker with elite finishing capabilities and outstanding positioning.',
      aiDevelopmentSuggestion: 'Maintain physical condition with tailored load management and focus on efficiency inside the box.',
      aiComparison: 'Zlatan Ibrahimović, Karim Benzema'
    }
  });

  await prisma.scoutingReport.create({
    data: {
      playerId: player3.id,
      authorId: scout.id,
      strengths: 'Exceptional ball carries, physical dominance in midfields, high work rate, mature intelligence, clutch goalscoring capability.',
      weaknesses: 'Occasionally takes too many touches or gets drawn into physical duels, risk of accumulation of yellow cards.',
      potential: 'Elite',
      recommendation: 'SIGN',
      aiDescription: 'Jude Bellingham is a generational box-to-box midfielder with mature decision-making and elite physical prowess.',
      aiDevelopmentSuggestion: 'Optimize positional discipline to conserve energy and reduce unnecessary fouls in deep areas.',
      aiComparison: 'Zinedine Zidane, Steven Gerrard'
    }
  });

  console.log('Reports seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
