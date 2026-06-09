import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProblemClient from './ProblemClient';
import { unstable_cache } from 'next/cache';

const getCachedProblemData = unstable_cache(
  async (id: string) => {
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) return null;
    
    // In our dashboard, problems are sorted by createdAt 'desc'
    // So "Next" on the dashboard is older (createdAt < problem.createdAt)
    const nextProblem = await prisma.problem.findFirst({
      where: { createdAt: { lt: problem.createdAt } },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    
    // "Previous" on the dashboard is newer (createdAt > problem.createdAt)
    const prevProblem = await prisma.problem.findFirst({
      where: { createdAt: { gt: problem.createdAt } },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    return { 
      problem, 
      nextId: nextProblem?.id || null, 
      prevId: prevProblem?.id || null 
    };
  },
  ['problem-data'],
  { revalidate: 3600 }
);

export default async function ProblemPage(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const data = await getCachedProblemData(params.id);
  
  if (!data || !data.problem) {
    notFound();
  }

  return <ProblemClient problem={data.problem} nextId={data.nextId} prevId={data.prevId} />;
}
