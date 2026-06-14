import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    
    // Check if there is an existing correct submission
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: session.user.id,
        problemId: resolvedParams.id,
        isCorrect: true
      }
    });

    if (existingSubmission) {
      // Toggle off: Delete all correct submissions for this problem that were manually marked
      await prisma.submission.deleteMany({
        where: {
          userId: session.user.id,
          problemId: resolvedParams.id,
          isCorrect: true,
          manuallyMarked: true
        }
      });
      return NextResponse.json({ isSolved: false });
    } else {
      // Toggle on: Create a correct submission
      await prisma.submission.create({
        data: {
          userId: session.user.id,
          problemId: resolvedParams.id,
          isCorrect: true,
          manuallyMarked: true
        }
      });
      return NextResponse.json({ isSolved: true });
    }
  } catch (error) {
    console.error('Toggle solved error:', error);
    return NextResponse.json({ error: 'Failed to toggle solved status' }, { status: 500 });
  }
}
