import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ solvedIds: [], savedIds: [] });
  }

  const user = await prisma.user.findUnique({ 
    where: { id: session.user.id },
    include: { 
      submissions: true,
      savedProblems: true
    }
  });

  if (!user) {
    return NextResponse.json({ solvedIds: [], savedIds: [] });
  }

  const solvedIds = user.submissions.filter(s => s.isCorrect).map(s => s.problemId);
  const savedIds = user.savedProblems.map(s => s.problemId);

  // Calculate heatmap data (YYYY-MM-DD format)
  const heatmapDataMap: Record<string, number> = {};
  user.submissions.forEach(sub => {
    if (sub.isCorrect) {
      // Get date string in YYYY-MM-DD format
      const dateStr = sub.submittedAt.toISOString().split('T')[0];
      heatmapDataMap[dateStr] = (heatmapDataMap[dateStr] || 0) + 1;
    }
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
}
