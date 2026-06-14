import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ solvedIds: [], savedIds: [] });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, highestStreak: true }
    });

    if (!user) {
      return NextResponse.json({ solvedIds: [], savedIds: [] });
    }

    const [solvedSubs, heatmapSubs, savedProbs] = await Promise.all([
      prisma.submission.findMany({ 
        where: { userId, isCorrect: true }, 
        select: { problemId: true }, 
        distinct: ['problemId'] 
      }),
      prisma.submission.findMany({ 
        where: { 
          userId, 
          isCorrect: true,
          submittedAt: { gte: new Date(Date.now() - 365*24*60*60*1000) }
        }, 
        select: { submittedAt: true } 
      }),
      prisma.savedProblem.findMany({ 
        where: { userId }, 
        select: { problemId: true } 
      })
    ]);

    const solvedIds = [...new Set(solvedSubs.map(s => s.problemId))];
    const savedIds = savedProbs.map(s => s.problemId);

    // Calculate heatmap data (YYYY-MM-DD format)
    const heatmapDataMap: Record<string, number> = {};
    heatmapSubs.forEach(sub => {
      const dateStr = sub.submittedAt.toISOString().split('T')[0];
      heatmapDataMap[dateStr] = (heatmapDataMap[dateStr] || 0) + 1;
    });

    const heatmapData = Object.keys(heatmapDataMap).map(date => ({
      date,
      count: heatmapDataMap[date],
      level: Math.min(4, Math.ceil(heatmapDataMap[date] / 2)) // simple level calculation (max level 4)
    }));

    return NextResponse.json({ 
      solvedIds,
      savedIds,
      currentStreak: user.currentStreak,
      highestStreak: user.highestStreak,
      heatmapData
    });
  } catch (error) {
    console.error('User status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
