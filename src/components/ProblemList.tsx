'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Target, CheckCircle, Star } from 'lucide-react';
import { Problem } from '@prisma/client';

// Omit full texts from Problem type since we optimized the payload
type ProblemSummary = Pick<Problem, 'id' | 'title' | 'description' | 'topic' | 'difficulty' | 'source'>;

interface ProblemListProps {
  problems: ProblemSummary[];
  solvedIds: string[];
  savedIds?: string[];
}

const statuses = ['All', 'Unsolved', 'Solved', 'Saved'];

export default function ProblemList({ problems, solvedIds, savedIds = [] }: ProblemListProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    setSearchQuery(localStorage.getItem('qg_search') || '');
    setTopicFilter(localStorage.getItem('qg_topic') || 'All');
    setDifficultyFilter(localStorage.getItem('qg_difficulty') || 'All');
    setStatusFilter(localStorage.getItem('qg_status') || 'All');
    setCurrentPage(parseInt(localStorage.getItem('qg_page') || '1', 10));
    setIsMounted(true);
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

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Problem Bank
        </h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="text" 
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-sm rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500 min-w-[200px]"
          />
          
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
                    className="hover:bg-gray-800/60 cursor-pointer transition-all duration-200 group"
                  >
                    <td className="py-6 px-8 text-gray-500 text-base text-center font-medium">
                      {globalIndex}
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                          {problem.title}
                        </span>
                        {isSaved && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                        {isSolved && <CheckCircle className="w-5 h-5 text-green-400" />}
                      </div>
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
