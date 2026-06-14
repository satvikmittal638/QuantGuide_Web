import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const source = searchParams.get('source');
    const excludeSolved = searchParams.get('excludeSolved') === 'true';

    let solvedIds: string[] = [];
    if (excludeSolved) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const solved = await prisma.submission.findMany({
          where: { userId: session.user.id, isCorrect: true },
          select: { problemId: true },
          distinct: ['problemId']
        });
        solvedIds = solved.map(s => s.problemId);
      }
    }

    const whereClause: any = {};
    if (topic && topic !== 'All') whereClause.topic = topic;
    if (difficulty && difficulty !== 'All') whereClause.difficulty = difficulty;
    if (source && source !== 'All') whereClause.source = source;
    if (excludeSolved && solvedIds.length > 0) {
      whereClause.id = { notIn: solvedIds };
    }

    const count = await prisma.problem.count({ where: whereClause });
    
    if (count === 0) {
      return NextResponse.json({ error: 'No problems match criteria' }, { status: 404 });
    }

    const randomIndex = Math.floor(Math.random() * count);
    const problems = await prisma.problem.findMany({
      where: whereClause,
      skip: randomIndex,
      take: 1,
      select: {
        id: true,
        title: true,
        topic: true,
        difficulty: true
      }
    });

    return NextResponse.json({ problem: problems[0] });
  } catch (error) {
    console.error('Random problem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
