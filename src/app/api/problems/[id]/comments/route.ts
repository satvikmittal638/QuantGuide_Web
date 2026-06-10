import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
    const comments = await prisma.comment.findMany({
      where: { problemId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, image: true, email: true }
        }
      }
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await req.json();
    
    if (!body.text || body.text.trim() === '') {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    let cleanText = body.text.trim();
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'nigger', 'faggot', 'slut', 'whore', 'kys'];
    const lowerText = cleanText.toLowerCase();
    
    const containsProfanity = badWords.some(word => {
      // Create a regex to match the word with boundaries
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });

    if (containsProfanity) {
      return NextResponse.json({ error: 'Comment contains inappropriate language. Please follow the community guidelines.' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        text: cleanText,
        userId: session.user.id,
        problemId: params.id
      },
      include: {
        user: {
          select: { name: true, image: true, email: true }
        }
      }
    });

    return NextResponse.json({ comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
