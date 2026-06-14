import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { commentId, value } = body;

    if (!commentId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ error: 'Invalid vote data' }, { status: 400 });
    }

    await prisma.commentVote.upsert({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId
        }
      },
      update: { value },
      create: {
        userId: session.user.id,
        commentId,
        value
      }
    });

    const aggregate = await prisma.commentVote.aggregate({
      where: { commentId },
      _sum: { value: true }
    });

    return NextResponse.json({ success: true, score: aggregate._sum.value || 0 });
  } catch (error) {
    console.error('Comment vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
