"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BrainCircuit, Loader2, CheckCircle2, ChevronRight, Play } from 'lucide-react';

export default function ReviewPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<any>(null);
  const [quality, setQuality] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    fetch('/api/review')
      .then(res => res.json())
      .then(data => {
        if (data.reviews) {
          setReviews(data.reviews);
          if (data.reviews.length > 0) setActiveReview(data.reviews[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const submitReview = async () => {
    if (!activeReview) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: activeReview.problemId, quality })
      });
      if (res.ok) {
        setQuality(3);
        fetchReviews(); // Re-fetch to get next batch and update UI
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex flex-col items-center justify-center text-center">
        <BrainCircuit className="w-16 h-16 text-blue-500 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Spaced Repetition Review</h1>
        <p className="text-gray-400 mb-8 max-w-md">Sign in to track your knowledge decay and review problems right when you're about to forget them.</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">You're all caught up!</h1>
        <p className="text-gray-400 mb-8">No problems scheduled for review today. Check back tomorrow.</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-white font-medium transition-colors">
          Practice New Problems
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-4">
              <BrainCircuit className="w-10 h-10 text-purple-400" />
              Daily Review
            </h1>
            <p className="text-gray-400 mt-2 text-lg">You have {reviews.length} problems due for review.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Review Area */}
          <div className="lg:col-span-2 space-y-6">
            {activeReview && (
              <div className="bg-[#0B0F19] rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <div className="flex gap-3 mb-6">
                  <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded-md uppercase tracking-wider">
                    {activeReview.problem.topic}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                    activeReview.problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' : 
                    activeReview.problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {activeReview.problem.difficulty}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold mb-8">{activeReview.problem.title}</h2>
                
                <div className="flex gap-4">
                  <Link 
                    href={`/problems/${activeReview.problemId}`}
                    target="_blank"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-center py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    Open Problem <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800">
                  <h3 className="text-lg font-medium text-gray-300 mb-6 text-center">How well did you remember this?</h3>
                  
                  <div className="grid grid-cols-6 gap-2 mb-8">
                    {[0, 1, 2, 3, 4, 5].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`py-4 rounded-xl font-bold text-lg transition-all ${
                          quality === q 
                            ? (q < 3 ? 'bg-red-500 text-white' : q === 3 ? 'bg-yellow-500 text-white' : 'bg-emerald-500 text-white')
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 font-medium px-2 mb-8">
                    <span>0: Complete Blackout</span>
                    <span>3: Hard</span>
                    <span>5: Perfect</span>
                  </div>

                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Review'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Queue */}
          <div className="bg-gray-900/50 rounded-3xl p-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">Up Next</h3>
            <div className="space-y-2">
              {reviews.map((rev, idx) => (
                <button
                  key={rev.id}
                  onClick={() => { setActiveReview(rev); setQuality(3); }}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-colors flex items-center gap-3 ${
                    activeReview?.id === rev.id 
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' 
                      : 'bg-gray-800/50 hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${activeReview?.id === rev.id ? 'bg-purple-500/30 text-purple-200' : 'bg-gray-700 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <span className="truncate flex-1">{rev.problem.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
