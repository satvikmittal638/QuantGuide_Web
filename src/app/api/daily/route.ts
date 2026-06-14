import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getDailyProblem = unstable_cache(
  async () => {
    const count = await prisma.problem.count();
    if (count === 0) return null;

    const seed = new Date().toISOString().split('T')[0]; 
    const hash = [...seed].reduce((a,c) => a + c.charCodeAt(0), 0);
    const skip = hash % count;

    const problems = await prisma.problem.findMany({
      skip,
      take: 1,
      select: {
        id: true,
        title: true,
        topic: true,
        difficulty: true,
        source: true
      }
    });

    return problems[0] || null;
  },
  ['daily-problem'],
  { revalidate: 3600 } // cache for 1 hour
);

export async function GET() {
  try {
    const problem = await getDailyProblem();
    if (!problem) {
      return NextResponse.json({ error: 'No problems found' }, { status: 404 });
    }
    return NextResponse.json({ problem });
  } catch (error) {
    console.error('Daily problem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
