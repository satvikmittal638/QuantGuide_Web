"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Plus, Search, Layers, Loader2 } from 'lucide-react';

export default function SetsPage() {
  const { data: session } = useSession();
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = () => {
    setLoading(true);
    fetch('/api/sets')
      .then(res => res.json())
      .then(data => {
        if (data.sets) setSets(data.sets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const createSet = async () => {
    if (!newTitle) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc, problemIds: [] })
      });
      if (res.ok) {
        setShowModal(false);
        setNewTitle('');
        setNewDesc('');
        fetchSets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const filteredSets = sets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-4">
              <LayoutDashboard className="w-10 h-10 text-blue-400" />
              Problem Sets
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Curated lists of problems to focus your practice.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search sets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            </div>
            {session && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Create Set
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map(set => (
              <Link href={`/sets/${set.id}`} key={set.id} className="bg-[#0B0F19] border border-gray-800 hover:border-blue-500/50 hover:shadow-2xl transition-all rounded-3xl p-6 group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">{set.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-2 mb-6 h-10">
                  {set.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 border-t border-gray-800/50 pt-4 mt-auto">
                  <span>By {set.creator?.name || 'Unknown'}</span>
                  <span className="bg-gray-800 px-2 py-1 rounded-md">{set._count?.items || 0} items</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Set</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Probability Basics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description (Optional)</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none"
                  placeholder="What's this set about?"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={createSet}
                  disabled={!newTitle || creating}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-2 rounded-xl text-white font-medium flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
