import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const sets = await prisma.problemSet.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        creator: { select: { name: true } },
        _count: { select: { items: true } }
      }
    });

    return NextResponse.json({ sets });
  } catch (error) {
    console.error('Problem sets fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, problemIds } = body;

    if (!title || !Array.isArray(problemIds) || problemIds.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const newSet = await prisma.problemSet.create({
      data: {
        title,
        description,
        creatorId: session.user.id,
        items: {
          create: problemIds.map((id, index) => ({
            problemId: id,
            order: index
          }))
        }
      }
    });

    return NextResponse.json({ success: true, set: newSet });
  } catch (error) {
    console.error('Create problem set error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
