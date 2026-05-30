import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProblemClient from './ProblemClient';

export default async function ProblemPage(context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const problem = await prisma.problem.findUnique({ where: { id: params.id } });
  
  if (!problem) {
    notFound();
  }

  return <ProblemClient problem={problem} />;
}
