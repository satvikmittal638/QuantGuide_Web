import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ isSaved: false, isSolved: false });
  }

  const saved = await prisma.savedProblem.findUnique({
    where: {
      userId_problemId: {
        userId: session.user.id,
        problemId: resolvedParams.id
      }
    }
  });

  const solved = await prisma.submission.findFirst({
    where: {
      userId: session.user.id,
      problemId: resolvedParams.id,
      isCorrect: true
    }
  });

  return NextResponse.json({ 
    isSaved: !!saved,
    isSolved: !!solved
  });
}
