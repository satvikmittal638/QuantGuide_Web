import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: problemId } = await context.params;
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'You must be logged in to save problems.' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if it's already saved
    const existing = await prisma.savedProblem.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId
        }
      }
    });

    if (existing) {
      // Unsave
      await prisma.savedProblem.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ saved: false });
    } else {
      // Save
      await prisma.savedProblem.create({
        data: {
          userId,
          problemId
        }
      });
      return NextResponse.json({ saved: true });
    }

  } catch (error) {
    console.error('Error in save problem endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
