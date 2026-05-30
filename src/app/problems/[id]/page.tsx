import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProblemClient from './ProblemClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ProblemPage(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const problem = await prisma.problem.findUnique({ where: { id: params.id } });
  
  if (!problem) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  let isSaved = false;

  if (session?.user?.id) {
    const saved = await prisma.savedProblem.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId: problem.id
        }
      }
    });
    if (saved) isSaved = true;
  }

  return <ProblemClient problem={problem} initialIsSaved={isSaved} />;
}
