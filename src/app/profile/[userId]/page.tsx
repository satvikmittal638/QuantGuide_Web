"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Flame, Trophy, Target, PieChart, Clock, Award, CheckCircle } from 'lucide-react';
import { ActivityCalendar } from 'react-activity-calendar';

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/profile/${resolvedParams.userId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setProfileData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex justify-center items-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
          <p className="text-gray-400">This profile doesn't exist or is private.</p>
          <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">Return Home</Link>
        </div>
      </div>
    );
  }

  const { user, stats, badges, recentActivity } = profileData;
  const isOwnProfile = session?.user?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Header Card */}
        <div className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-emerald-900/40"></div>
          
          <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 mt-12">
            <div className="relative">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-32 h-32 rounded-2xl border-4 border-gray-900 shadow-xl object-cover bg-gray-800" />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-gray-900 shadow-xl bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-xs font-bold px-2 py-1 rounded-lg border-2 border-gray-900">
                  YOU
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-extrabold text-white">{user.name}</h1>
              <p className="text-gray-400 font-medium">Joined {new Date(user.lastActive).toLocaleDateString()}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50 text-center">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Current Streak</div>
                <div className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                  {user.currentStreak} <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl px-4 py-2 border border-gray-700/50 text-center">
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Best Streak</div>
                <div className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  {user.highestStreak} <Trophy className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats */}
          <div className="space-y-8 lg:col-span-1">
            
            <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Problem Stats
              </h2>
              
              <div className="mb-8 text-center">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                  {stats.totalSolved}
                </div>
                <div className="text-gray-400 text-sm font-medium mt-2">Total Problems Solved</div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Easy', count: stats.difficultyCounts.Easy || 0, color: 'bg-emerald-500' },
                  { label: 'Medium', count: stats.difficultyCounts.Medium || 0, color: 'bg-yellow-500' },
                  { label: 'Hard', count: stats.difficultyCounts.Hard || 0, color: 'bg-red-500' }
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400 font-medium">{d.label}</span>
                      <span className="font-bold text-white">{d.count}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${d.color}`} 
                        style={{ width: stats.totalSolved ? `${(d.count / stats.totalSolved) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Top Topics
              </h2>
              <div className="space-y-3">
                {Object.entries(stats.topicCounts)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([topic, count]: any) => (
                    <div key={topic} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-xl border border-gray-800/50">
                      <span className="text-sm text-gray-300 font-medium truncate pr-4">{topic}</span>
                      <span className="bg-gray-800 text-purple-400 px-2 py-1 rounded-md text-xs font-bold">{count}</span>
                    </div>
                  ))}
                {Object.keys(stats.topicCounts).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No topics solved yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Activity & Badges */}
          <div className="space-y-8 lg:col-span-2">
            
            {badges.length > 0 && (
              <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Earned Badges
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {badges.map((b: any) => (
                    <div key={b.id} className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-2xl text-center flex flex-col items-center justify-center group hover:border-yellow-500/50 transition-colors">
                      <img src={b.imageUrl} alt={b.name} className="w-12 h-12 mb-3 drop-shadow-lg group-hover:scale-110 transition-transform" />
                      <div className="font-bold text-sm text-white">{b.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(b.earnedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#0B0F19] rounded-3xl p-6 border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Recent Activity
              </h2>
              
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No recent activity.</div>
                ) : (
                  recentActivity.map((act: any) => (
                    <Link 
                      href={`/problems/${act.problemId}`}
                      key={act.id} 
                      className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${act.isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {act.isCorrect ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 flex items-center justify-center font-bold text-lg leading-none">×</div>}
                        </div>
                        <div>
                          <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{act.problem.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{new Date(act.submittedAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded-md border capitalize font-bold ${
                          act.problem.difficulty === 'Easy' ? 'border-green-500/20 text-green-400' :
                          act.problem.difficulty === 'Medium' ? 'border-yellow-500/20 text-yellow-500' :
                          'border-red-500/20 text-red-400'
                        }`}>
                          {act.problem.difficulty}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
