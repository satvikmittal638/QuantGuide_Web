import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { answer } = body;
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'You must be logged in to submit answers.' }, { status: 401 });
    }

    const problem = await prisma.problem.findUnique({ where: { id: params.id } });
    if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    
    const parseMath = (str: string) => {
      try {
        if (!str) return NaN;
        // Simple fraction support
        if (str.includes('/')) {
          const [num, den] = str.split('/');
          return parseFloat(num) / parseFloat(den);
        }
        return parseFloat(str);
      } catch {
        return NaN;
      }
    };

    const submittedNum = parseMath(answer);
    const correctNum = parseMath(problem.solution);
    
    // Increase tolerance to 1e-3 for rounding differences (e.g. 0.5039 vs 0.503937)
    const isCorrect = !isNaN(submittedNum) && !isNaN(correctNum) && Math.abs(submittedNum - correctNum) < 1e-3;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found in database.' }, { status: 404 });
    }
    
    if (isCorrect) {
      const now = new Date();
      const lastActive = user.lastActive;
      
      let newStreak = user.currentStreak;
      if (!lastActive) {
         newStreak = 1;
      } else {
         const today = new Date(now.toDateString());
         const lastDay = new Date(lastActive.toDateString());
         const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)); 
         if (diffDays === 1) {
           newStreak += 1;
         } else if (diffDays > 1) {
           newStreak = 1;
         }
         // if diffDays === 0, streak remains the same
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentStreak: newStreak,
          highestStreak: Math.max(newStreak, user.highestStreak),
          lastActive: now,
        }
      });
    }
    
    const existingSubmission = await prisma.submission.findFirst({
      where: { userId: user.id, problemId: problem.id }
    });

    if (existingSubmission) {
      if (!existingSubmission.isCorrect && isCorrect) {
        // Upgrade to correct
        await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: { isCorrect: true, submittedAt: new Date() }
        });
      } else if (!existingSubmission.isCorrect && !isCorrect) {
        // Update wrong answer timestamp
        await prisma.submission.update({
          where: { id: existingSubmission.id },
          data: { submittedAt: new Date() }
        });
      }
      // If already correct, do NOT create a new submission or overwrite the timestamp.
    } else {
      // First attempt ever
      await prisma.submission.create({
        data: {
          userId: user.id,
          problemId: problem.id,
          isCorrect: isCorrect
        }
      });
    }
    
    return NextResponse.json({ correct: isCorrect });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
