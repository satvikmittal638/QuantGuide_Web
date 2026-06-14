import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        currentStreak: true,
        highestStreak: true,
        lastActive: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [submissions, userBadges, recentActivity] = await Promise.all([
      prisma.submission.findMany({
        where: { userId, isCorrect: true },
        select: {
          problemId: true,
          problem: {
            select: { topic: true, difficulty: true }
          }
        },
        distinct: ['problemId']
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' }
      }),
      prisma.submission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        distinct: ['problemId'],
        take: 10,
        include: {
          problem: {
            select: { title: true, difficulty: true, topic: true }
          }
        }
      })
    ]);

    const totalSolved = submissions.length;
    
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    const topicCounts: Record<string, number> = {};

    submissions.forEach(sub => {
      const diff = sub.problem.difficulty as keyof typeof difficultyCounts;
      if (difficultyCounts[diff] !== undefined) difficultyCounts[diff]++;
      
      const topic = sub.problem.topic;
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    return NextResponse.json({
      user,
      stats: {
        totalSolved,
        difficultyCounts,
        topicCounts
      },
      badges: userBadges.map(ub => ({ ...ub.badge, earnedAt: ub.earnedAt })),
      recentActivity
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
