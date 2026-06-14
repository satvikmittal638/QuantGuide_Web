"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Trash2, Loader2, Play } from 'lucide-react';

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [set, setSet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/sets/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSet(data.set);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  const deleteSet = async () => {
    if (!confirm('Are you sure you want to delete this set?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sets/${resolvedParams.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/sets');
      }
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Set Not Found</h1>
        <Link href="/sets" className="text-blue-400 hover:text-blue-300">Back to Sets</Link>
      </div>
    );
  }

  const isCreator = session?.user?.id === set.creatorId;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button onClick={() => router.push('/sets')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sets
        </button>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{set.title}</h1>
              <p className="text-gray-400">Created by {set.creator?.name}</p>
            </div>
            {isCreator && (
              <button 
                onClick={deleteSet}
                disabled={deleting}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete Set"
              >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            )}
          </div>
          <p className="text-gray-300 text-lg mb-8">{set.description}</p>
          
          <div className="flex gap-4 border-b border-gray-800 pb-8">
            <div className="bg-gray-800 px-4 py-2 rounded-xl text-sm font-medium text-gray-300">
              {set.items?.length || 0} Problems
            </div>
            {set.items?.length > 0 && (
              <Link 
                href={`/problems/${set.items[0].problemId}`}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4" /> Start Practicing
              </Link>
            )}
          </div>
        </div>

        <div className="bg-[#0B0F19] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 bg-gray-900/40">
            <h2 className="text-xl font-bold">Problems in Set</h2>
          </div>
          <div className="divide-y divide-gray-800/60">
            {!set.items || set.items.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                This set has no problems yet.
              </div>
            ) : (
              set.items.map((item: any, idx: number) => (
                <Link 
                  href={`/problems/${item.problemId}`}
                  key={item.id}
                  className="flex items-center gap-6 p-6 hover:bg-gray-800/60 transition-colors group"
                >
                  <div className="w-8 text-center text-gray-500 font-bold font-mono">{idx + 1}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-200 group-hover:text-blue-400 transition-colors">
                      {item.problem.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-gray-400 font-medium">{item.problem.topic}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                      <span className={`${
                        item.problem.difficulty === 'Easy' ? 'text-emerald-400' :
                        item.problem.difficulty === 'Medium' ? 'text-yellow-400' :
                        'text-red-400'
                      } font-medium uppercase tracking-wider`}>
                        {item.problem.difficulty}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
