"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger inside inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const now = Date.now();
      const isSequence = now - lastKeyTime < 1000;

      if (e.key === '?') {
        setShowHelp(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowHelp(false);
      } else if (isSequence && lastKey === 'g') {
        if (e.key === 'h') router.push('/');
        else if (e.key === 'l') router.push('/leaderboard');
        else if (e.key === 'r') router.push('/review');
        else if (e.key === 's') router.push('/sets');
        else if (e.key === 'p') router.push('/profile');
        lastKey = ''; // Reset sequence
      } else {
        lastKey = e.key;
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-400">Navigation</div>
            <div className="text-gray-400">Global</div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">g</kbd>
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">h</kbd>
                <span className="text-gray-300 ml-2">Home</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">g</kbd>
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">l</kbd>
                <span className="text-gray-300 ml-2">Leaderboard</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">g</kbd>
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">r</kbd>
                <span className="text-gray-300 ml-2">Review</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">g</kbd>
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">p</kbd>
                <span className="text-gray-300 ml-2">Profile</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">/</kbd>
                <span className="text-gray-300 ml-2">Search</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">?</kbd>
                <span className="text-gray-300 ml-2">Show Help</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
