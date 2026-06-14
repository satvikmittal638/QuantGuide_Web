"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import Link from 'next/link';

type Period = 'weekly' | 'monthly' | 'all';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  solvedCount: number;
  currentStreak: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" />;
    return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-4">
              <Trophy className="w-10 h-10 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Top quantitative problem solvers.</p>
          </div>

          <div className="flex bg-gray-800 p-1 rounded-xl">
            {(['weekly', 'monthly', 'all'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === p 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              No activity in this period yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm font-semibold uppercase tracking-widest bg-gray-900/40">
                    <th className="py-5 px-8 w-16 text-center">Rank</th>
                    <th className="py-5 px-8">User</th>
                    <th className="py-5 px-8 text-right">Problems Solved</th>
                    <th className="py-5 px-8 text-right">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {leaderboard.map((user) => {
                    const isCurrentUser = session?.user?.id === user.userId;
                    
                    return (
                      <tr 
                        key={user.userId} 
                        className={`transition-colors ${
                          isCurrentUser 
                            ? 'bg-blue-900/20 hover:bg-blue-900/30' 
                            : 'hover:bg-gray-800/60'
                        }`}
                      >
                        <td className="py-4 px-8 text-center">
                          <div className="flex justify-center">
                            {getRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="py-4 px-8">
                          <Link href={`/profile/${user.userId}`} className="flex items-center gap-4 group">
                            {user.image ? (
                              <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full border border-gray-700 group-hover:border-blue-500 transition-colors" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-blue-500 transition-colors">
                                <span className="text-gray-400 font-bold">{user.name.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className={`font-bold ${isCurrentUser ? 'text-blue-400' : 'text-gray-200'} group-hover:text-blue-400 transition-colors`}>
                              {user.name}
                              {isCurrentUser && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">You</span>}
                            </span>
                          </Link>
                        </td>
                        <td className="py-4 px-8 text-right font-bold text-emerald-400 text-lg">
                          {user.solvedCount}
                        </td>
                        <td className="py-4 px-8 text-right">
                          {user.currentStreak > 0 ? (
                            <div className="flex items-center justify-end gap-1.5 text-orange-400 font-bold">
                              {user.currentStreak}
                              <Flame className="w-4 h-4" />
                            </div>
                          ) : (
                            <span className="text-gray-600 font-medium">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
