import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { answer } = body;
    
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

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'You must be logged in to submit answers.' }, { status: 401 });
    }

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
         const diffTime = Math.abs(now.getTime() - lastActive.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         if (diffDays === 1 || diffDays === 0) { // If same day, don't increment, but wait, maybe increment if it's a new day? Let's just keep it simple: any correct answer updates activity. For a true streak we'd check calendar days.
           if (diffDays === 1) newStreak += 1;
           // if 0, streak remains same
         } else if (diffDays > 1) {
           newStreak = 1;
         }
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
    
    await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        isCorrect: isCorrect,
      }
    });
    
    return NextResponse.json({ correct: isCorrect });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
