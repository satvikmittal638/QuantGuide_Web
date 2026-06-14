import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.reviewItem.findMany({
      where: {
        userId: session.user.id,
        nextReview: { lte: new Date() }
      },
      orderBy: { nextReview: 'asc' },
      take: 20,
      include: {
        problem: {
          select: { id: true, title: true, topic: true, difficulty: true }
        }
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Review fetch error:', error);
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
    const { problemId, quality } = body;

    if (!problemId || typeof quality !== 'number' || quality < 0 || quality > 5) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const existingReview = await prisma.reviewItem.findUnique({
      where: { userId_problemId: { userId: session.user.id, problemId } }
    });

    let interval = 1;
    let repetitions = 0;
    let easeFactor = 2.5;

    if (existingReview) {
      if (quality < 3) {
        repetitions = 0;
        interval = 1;
        easeFactor = existingReview.easeFactor;
      } else {
        repetitions = existingReview.repetitions + 1;
        easeFactor = existingReview.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;

        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.round(existingReview.interval * easeFactor);
        }
      }
    } else {
      // First time reviewing this problem
      if (quality < 3) {
        repetitions = 0;
        interval = 1;
      } else {
        repetitions = 1;
        interval = 1;
      }
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const review = await prisma.reviewItem.upsert({
      where: { userId_problemId: { userId: session.user.id, problemId } },
      update: { interval, repetitions, easeFactor, nextReview },
      create: {
        userId: session.user.id,
        problemId,
        interval,
        repetitions,
        easeFactor,
        nextReview
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
