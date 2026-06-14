import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    const [aggregate, userRating] = await Promise.all([
      prisma.problemRating.aggregate({
        where: { problemId: resolvedParams.id },
        _avg: { rating: true },
        _count: true
      }),
      session?.user?.id ? prisma.problemRating.findUnique({
        where: {
          userId_problemId: {
            userId: session.user.id,
            problemId: resolvedParams.id
          }
        }
      }) : Promise.resolve(null)
    ]);

    return NextResponse.json({
      averageRating: aggregate._avg.rating || 0,
      totalRatings: aggregate._count || 0,
      userRating: userRating?.rating || null
    });
  } catch (error) {
    console.error('Problem rating fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { rating } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    const problemRating = await prisma.problemRating.upsert({
      where: {
        userId_problemId: {
          userId: session.user.id,
          problemId: resolvedParams.id
        }
      },
      update: { rating },
      create: {
        userId: session.user.id,
        problemId: resolvedParams.id,
        rating
      }
    });

    return NextResponse.json({ success: true, rating: problemRating.rating });
  } catch (error) {
    console.error('Problem rating submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
