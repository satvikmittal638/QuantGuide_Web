import { prisma } from '@/lib/prisma';
import { Flame, Trophy } from 'lucide-react';
import ProblemList from '@/components/ProblemList';
import LoginButton from '@/components/LoginButton';
import { unstable_cache } from 'next/cache';

const getCachedProblems = unstable_cache(
  async () => {
    return prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        topic: true,
        difficulty: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });
  },
  ['dashboard-problems'],
  { revalidate: 3600 } // Cache for 1 hour
);

export default async function Home() {
  // Fetch cached problems from Edge Network
  const problems = await getCachedProblems();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header / Dashboard */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              QuantGuide
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Master quantitative finance interviews.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
            <LoginButton />
          </div>
        </div>

        {/* Problem List */}
        <ProblemList problems={problems as any} />
      </div>
    </main>
  );
}
