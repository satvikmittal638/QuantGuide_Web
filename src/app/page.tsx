import { prisma } from '@/lib/prisma';
import { Flame, Trophy } from 'lucide-react';
import ProblemList from '@/components/ProblemList';
import LoginButton from '@/components/LoginButton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
      orderBy: { createdAt: 'desc' }
    });
  },
  ['dashboard-problems'],
  { revalidate: 3600 } // Cache for 1 hour
);

export default async function Home() {
  // OPTIMIZATION: Fetch cached problems from Edge Network
  const problems = await getCachedProblems();
  
  const session = await getServerSession(authOptions);
  let user = null;
  let solvedIds: string[] = [];
  let savedIds: string[] = [];
  
  if (session?.user?.id) {
    user = await prisma.user.findUnique({ 
      where: { id: session.user.id },
      include: { 
        submissions: true,
        savedProblems: true
      }
    });
    
    if (user) {
      solvedIds = user.submissions.filter(s => s.isCorrect).map(s => s.problemId);
      savedIds = user.savedProblems.map(s => s.problemId);
    }
  }

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
            {session && (
              <div className="flex gap-4">
                 <div className="flex items-center gap-3 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                   <div className="bg-orange-500/20 p-3 rounded-xl">
                     <Flame className="w-6 h-6 text-orange-400" />
                   </div>
                   <div>
                     <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current Streak</p>
                     <p className="text-2xl font-bold text-white">{user?.currentStreak || 0} <span className="text-sm text-gray-500 font-normal">days</span></p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                   <div className="bg-yellow-500/20 p-3 rounded-xl">
                     <Trophy className="w-6 h-6 text-yellow-400" />
                   </div>
                   <div>
                     <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Best Streak</p>
                     <p className="text-2xl font-bold text-white">{user?.highestStreak || 0} <span className="text-sm text-gray-500 font-normal">days</span></p>
                   </div>
                 </div>
              </div>
            )}
            
            <LoginButton />
          </div>
        </div>

        {/* Problem List */}
        <ProblemList problems={problems} solvedIds={solvedIds} savedIds={savedIds} />
      </div>
    </main>
  );
}
