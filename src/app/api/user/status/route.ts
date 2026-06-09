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

  return NextResponse.json({ 
    solvedIds,
    savedIds,
    currentStreak: user.currentStreak,
    highestStreak: user.highestStreak
  });
}
