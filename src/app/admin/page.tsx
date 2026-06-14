"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Users, CheckSquare, Target, Loader2, PieChart, BarChart } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic client-side check, proper check happens in API
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/admin/stats')
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then(data => {
          if (data.error) throw new Error(data.error);
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          router.push('/'); // Redirect non-admins
        });
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const { metrics, difficultyDistribution, topicDistribution, topUsers } = stats;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-900/50 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-4 text-red-400">
              <ShieldAlert className="w-10 h-10" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2 text-lg">System-wide analytics and performance metrics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalUsers}</div>
              <div className="text-gray-400 text-sm font-medium">Total Users</div>
            </div>
          </div>
          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalProblems}</div>
              <div className="text-gray-400 text-sm font-medium">Total Problems</div>
            </div>
          </div>
          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckSquare className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalSubmissions}</div>
              <div className="text-gray-400 text-sm font-medium">Total Submissions</div>
            </div>
          </div>
          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <PieChart className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-3xl font-bold">{((metrics.correctSubmissions / Math.max(metrics.totalSubmissions, 1)) * 100).toFixed(1)}%</div>
              <div className="text-gray-400 text-sm font-medium">Global Accuracy</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-purple-400" />
              Difficulty Distribution
            </h2>
            <div className="space-y-4">
              {difficultyDistribution.map((d: any) => (
                <div key={d.difficulty}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 font-medium">{d.difficulty}</span>
                    <span className="font-bold text-white">{d._count._all} problems</span>
                  </div>
                  <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${d.difficulty === 'Easy' ? 'bg-emerald-500' : d.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`} 
                      style={{ width: `${(d._count._all / metrics.totalProblems) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Most Active Users
            </h2>
            <div className="space-y-4">
              {topUsers.map((user: any, idx: number) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{user.user.name || 'Anonymous User'}</span>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-md text-sm font-bold">
                    {user._count._all} submissions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
