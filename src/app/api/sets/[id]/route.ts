import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const set = await prisma.problemSet.findUnique({
      where: { id: resolvedParams.id },
      include: {
        creator: { select: { name: true } },
        items: {
          orderBy: { order: 'asc' },
          include: {
            problem: {
              select: { id: true, title: true, topic: true, difficulty: true, source: true }
            }
          }
        }
      }
    });

    if (!set) {
      return NextResponse.json({ error: 'Problem set not found' }, { status: 404 });
    }

    return NextResponse.json({ set });
  } catch (error) {
    console.error('Problem set fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    
    const set = await prisma.problemSet.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!set) {
      return NextResponse.json({ error: 'Problem set not found' }, { status: 404 });
    }

    if (set.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.problemSet.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete problem set error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
