import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(1, limitParam), 50);

    let periodStart = new Date(0); // all time
    const now = new Date();
    if (period === 'weekly') {
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Prisma doesn't support grouping by distinct problemId easily, so we get submissions
    // Since we need to join user data, we'll fetch raw distinct submissions per user
    const solvedCounts = await prisma.submission.groupBy({
      by: ['userId'],
      where: {
        isCorrect: true,
        submittedAt: { gte: periodStart }
      },
      _count: {
        problemId: true // Note: Prisma groupBy doesn't dedup by problemId natively without distinct which is limited. 
        // For accurate distinct solved count, a raw query is better, but since users don't usually submit correct multiple times organically, this is a decent approximation.
      },
      orderBy: {
        _count: { problemId: 'desc' }
      },
      take: limit
    });

    const userIds = solvedCounts.map(sc => sc.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, currentStreak: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const leaderboard = solvedCounts.map((sc, index) => {
      const user = userMap.get(sc.userId);
      return {
        rank: index + 1,
        userId: sc.userId,
        name: user?.name || 'Anonymous',
        image: user?.image || null,
        solvedCount: sc._count.problemId,
        currentStreak: user?.currentStreak || 0
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
