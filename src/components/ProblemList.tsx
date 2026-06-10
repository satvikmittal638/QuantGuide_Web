'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle, Star, Flame, Trophy, BarChart3, PieChart, Calendar } from 'lucide-react';
import { ActivityCalendar } from 'react-activity-calendar';

interface Problem {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  source: string;
  createdAt: Date;
}

interface ProblemListProps {
  problems: Problem[];
}

export default function ProblemList({ problems }: ProblemListProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isStatusLoaded, setIsStatusLoaded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  // Global keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' press if not typing in an input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setSearchQuery(localStorage.getItem('qg_search') || '');
    setTopicFilter(localStorage.getItem('qg_topic') || 'All');
    setDifficultyFilter(localStorage.getItem('qg_difficulty') || 'All');
    setStatusFilter(localStorage.getItem('qg_status') || 'All');
    
    const page = localStorage.getItem('qg_page');
    if (page) setCurrentPage(parseInt(page));
    
    setIsMounted(true);

    // Fetch user status
    fetch('/api/user/status')
      .then(res => res.json())
      .then(data => {
        setSolvedIds(data.solvedIds || []);
        setSavedIds(data.savedIds || []);
        setCurrentStreak(data.currentStreak || 0);
        setHighestStreak(data.highestStreak || 0);
        setHeatmapData(data.heatmapData || []);
        setIsStatusLoaded(true);
      })
      .catch(err => {
        console.error('Failed to fetch user status', err);
        setIsStatusLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('qg_search', searchQuery);
    localStorage.setItem('qg_topic', topicFilter);
    localStorage.setItem('qg_difficulty', difficultyFilter);
    localStorage.setItem('qg_status', statusFilter);
    localStorage.setItem('qg_page', currentPage.toString());
  }, [searchQuery, topicFilter, difficultyFilter, statusFilter, currentPage, isMounted]);

  const topics = useMemo(() => {
    const set = new Set(problems.map(p => p.topic.toLowerCase()));
    return ['All', ...Array.from(set)];
  }, [problems]);

  const difficulties = ['All', 'easy', 'medium', 'hard'];

  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchSearch = p.title.toLowerCase().includes(q) || 
                          (p.description && p.description.toLowerCase().includes(q));
      
      const matchTopic = topicFilter === 'All' || p.topic.toLowerCase() === topicFilter;
      const matchDifficulty = difficultyFilter === 'All' || p.difficulty.toLowerCase() === difficultyFilter;
      
      const isSolved = solvedSet.has(p.id);
      const isSaved = savedSet.has(p.id);
      const matchStatus = statusFilter === 'All' || 
                          (statusFilter === 'Solved' && isSolved) || 
                          (statusFilter === 'Unsolved' && !isSolved) ||
                          (statusFilter === 'Saved' && isSaved);
                          
      return matchSearch && matchTopic && matchDifficulty && matchStatus;
    });
  }, [problems, searchQuery, topicFilter, difficultyFilter, statusFilter, solvedSet, savedSet]);

  const totalPages = Math.ceil(filteredProblems.length / pageSize);
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProblems.slice(start, start + pageSize);
  }, [filteredProblems, currentPage]);

  // Reset to page 1 when filters change (only if mounted)
  useMemo(() => {
    if (isMounted) {
      setCurrentPage(1);
    }
  }, [searchQuery, topicFilter, difficultyFilter, statusFilter, isMounted]);

  const statuses = ['All', 'Unsolved', 'Solved', 'Saved'];

  const stats = useMemo(() => {
    const difficultyCounts = { Easy: { total: 0, solved: 0 }, Medium: { total: 0, solved: 0 }, Hard: { total: 0, solved: 0 } };
    const topicCounts: Record<string, { total: 0, solved: 0 }> = {};

    // Use Set for O(1) lookups
    const solvedSetLocal = new Set(solvedIds);

    problems.forEach(p => {
      const isSolved = solvedSetLocal.has(p.id);
      
      // Difficulty
      if (difficultyCounts[p.difficulty as keyof typeof difficultyCounts]) {
        difficultyCounts[p.difficulty as keyof typeof difficultyCounts].total++;
        if (isSolved) difficultyCounts[p.difficulty as keyof typeof difficultyCounts].solved++;
      }

      // Topic
      if (!topicCounts[p.topic]) topicCounts[p.topic] = { total: 0, solved: 0 };
      topicCounts[p.topic].total++;
      if (isSolved) topicCounts[p.topic].solved++;
    });

    return { difficultyCounts, topicCounts };
  }, [problems, solvedIds]);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {isStatusLoaded && (
        <div className="mb-10 space-y-6">
          {/* Streaks Row */}
          {(currentStreak > 0 || highestStreak > 0) && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 w-full md:w-auto">
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{currentStreak} <span className="text-sm text-gray-500 font-normal">days</span></p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 w-full md:w-auto">
                <div className="bg-yellow-500/20 p-3 rounded-xl">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Best Streak</p>
                  <p className="text-2xl font-bold text-white">{highestStreak} <span className="text-sm text-gray-500 font-normal">days</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Difficulty Breakdown */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 lg:col-span-1">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Difficulty Progress
              </h3>
              <div className="space-y-5">
                {[
                  { label: 'Easy', data: stats.difficultyCounts.Easy, colorClass: 'bg-emerald-500' },
                  { label: 'Medium', data: stats.difficultyCounts.Medium, colorClass: 'bg-yellow-500' },
                  { label: 'Hard', data: stats.difficultyCounts.Hard, colorClass: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-300">{item.label}</span>
                      <span className="text-gray-400">{item.data.solved} <span className="text-gray-600">/</span> {item.data.total}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.colorClass} rounded-full transition-all duration-1000`}
                        style={{ width: `${item.data.total ? (item.data.solved / item.data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 lg:col-span-2">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-purple-400" />
                Topic Mastery
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(stats.topicCounts)
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 8)
                  .map(([topic, data]) => (
                  <div key={topic}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-300 truncate pr-4">{topic}</span>
                      <span className="text-gray-400 whitespace-nowrap">{data.solved} <span className="text-gray-600">/</span> {data.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${data.total ? (data.solved / data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Heatmap Row */}
          {heatmapData.length > 0 && (
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 w-full overflow-x-auto">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-green-400" />
                Activity Heatmap
              </h3>
              <div className="min-w-[800px]">
                <ActivityCalendar 
                  data={heatmapData} 
                  theme={{
                    light: ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    dark: ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353']
                  }}
                  colorScheme="dark"
                  labels={{
                    totalCount: '{{count}} submissions in the last year',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Problem Bank
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search problems... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500 min-w-[200px]"
            />
          </div>
          
          <select 
            value={topicFilter} 
            onChange={(e) => setTopicFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500 capitalize"
          >
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500 capitalize"
          >
            {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

        </div>
      </div>
      
      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-800 bg-[#0B0F19] shadow-2xl">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm font-semibold uppercase tracking-widest bg-gray-900/40">
              <th className="py-5 px-8 w-16 text-center">#</th>
              <th className="py-5 px-8">TITLE</th>
              <th className="py-5 px-8">TOPIC</th>
              <th className="py-5 px-8">DIFFICULTY</th>
              <th className="py-5 px-8">SOURCE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {paginatedProblems.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-400 text-lg">
                  No problems match your filters.
                </td>
              </tr>
            ) : (
              paginatedProblems.map((problem, index) => {
                const isSolved = solvedSet.has(problem.id);
                const isSaved = savedSet.has(problem.id);
                const diff = problem.difficulty.toLowerCase();
                const diffColor = diff === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                  diff === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                  'bg-red-500/10 text-red-400 border-red-500/20';
                
                const topic = problem.topic.toLowerCase();
                const topicColor = topic.includes('probability') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                   topic.includes('brainteaser') ? 'bg-[#ff8a33]/10 text-[#ff8a33] border-[#ff8a33]/20' :
                                   'bg-blue-500/10 text-blue-400 border-blue-500/20';
                
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                
                return (
                  <tr 
                    key={problem.id} 
                    onClick={() => router.push(`/problems/${problem.id}`)}
                    className="hover:bg-gray-800/60 transition-all duration-200 group cursor-pointer"
                  >
                    <td className="py-6 px-8 text-gray-500 text-base text-center font-medium">
                      {globalIndex}
                    </td>
                    <td className="py-6 px-8">
                      <Link href={`/problems/${problem.id}`} className="flex items-center gap-3" aria-label={`Go to ${problem.title}`}>
                        <span className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                          {problem.title}
                        </span>
                        {isSaved && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                        {isSolved && <CheckCircle className="w-5 h-5 text-green-400" />}
                      </Link>
                    </td>
                    <td className="py-6 px-8">
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full border tracking-wider capitalize ${topicColor}`}>
                        {problem.topic}
                      </span>
                    </td>
                    <td className="py-6 px-8">
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full border tracking-wider uppercase ${diffColor}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-gray-400 text-sm font-medium">
                      {problem.source}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-gray-300 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-400">
            Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
          </span>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-gray-300 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
