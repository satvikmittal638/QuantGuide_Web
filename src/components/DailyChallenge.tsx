"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

export default function DailyChallenge() {
  const [dailyProblem, setDailyProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily')
      .then(res => res.json())
      .then(data => {
        if (data.problem) {
          setDailyProblem(data.problem);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !dailyProblem) return null;

  return (
    <div className="relative group rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-blue-500/50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-blue-400 tracking-wider uppercase mb-1">Daily Challenge</h2>
            <h3 className="text-xl font-bold text-white">{dailyProblem.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-gray-400">{dailyProblem.topic}</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className={`${
                dailyProblem.difficulty === 'Easy' ? 'text-emerald-400' :
                dailyProblem.difficulty === 'Medium' ? 'text-yellow-400' :
                'text-red-400'
              } font-medium`}>{dailyProblem.difficulty}</span>
            </div>
          </div>
        </div>
        <Link 
          href={`/problems/${dailyProblem.id}`}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors w-full sm:w-auto"
        >
          Solve Challenge <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
