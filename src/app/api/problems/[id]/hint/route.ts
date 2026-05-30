import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const problem = await prisma.problem.findUnique({ where: { id: params.id } });
    if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert quantitative tutor. A student is trying to solve the following problem:\n\nTitle: ${problem.title}\nDescription: ${problem.description}\nTopic: ${problem.topic}\n\nThe actual numeric answer is ${problem.solution}.\n\nPlease provide a small, helpful hint that guides them towards the solution, but DO NOT reveal the final answer. Keep it concise.`,
    });
    
    return NextResponse.json({ hint: response.text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
