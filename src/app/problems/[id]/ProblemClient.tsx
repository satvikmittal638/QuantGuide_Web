"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, CheckCircle2, XCircle, Loader2, Copy, Check, Star } from 'lucide-react';

export default function ProblemClient({ problem, initialIsSaved = false }: { problem: any, initialIsSaved?: boolean }) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [saving, setSaving] = useState(false);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const copyForAI = async () => {
    try {
      const qSrc = `/images/problems/${problem.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '')}.png`;
      const sSrc = `/images/solutions/${problem.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '')}.png`;

      const [qImg, sImg] = await Promise.all([
        loadImage(qSrc),
        loadImage(sSrc)
      ]);

      if (!qImg) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sWidth = sImg ? sImg.width : 0;
      const sHeight = sImg ? sImg.height : 0;
      const padding = sImg ? 40 : 0;

      canvas.width = Math.max(qImg.width, sWidth);
      canvas.height = qImg.height + sHeight + padding;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(qImg, 0, 0);

      if (sImg) {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, qImg.height + padding / 2, canvas.width, 2);
        ctx.drawImage(sImg, 0, qImg.height + padding);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Clipboard write failed:", err);
          alert("Failed to copy image. Your browser might not support direct image copying.");
        }
      }, 'image/png');
    } catch (err) {
      console.error("Failed to generate image:", err);
    }
  };

  const checkAnswer = async () => {
    if (!answer) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setResult({ correct: data.correct });
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  const toggleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}/save`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setIsSaved(data.saved);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
              {problem.topic}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : problem.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {problem.difficulty}
            </span>
            {problem.source && (
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full border border-purple-500/20">
                {problem.source}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{problem.title}</h1>
            <div className="flex gap-3">
              <button
                onClick={toggleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors border ${isSaved ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
                title="Mark for Review"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={`w-4 h-4 ${isSaved ? 'fill-yellow-500' : ''}`} />}
                <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={copyForAI}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-gray-700 hover:border-gray-600"
                title="Copy Question & Solution Text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy for AI'}</span>
              </button>
            </div>
          </div>
          <div className="mb-12 flex justify-start">
            <img 
              src={`/images/problems/${problem.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '')}.png`}
              alt={problem.title}
              className="max-w-full h-auto invert hue-rotate-180 mix-blend-screen opacity-90"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <h3 className="text-lg font-medium text-gray-200 mb-4">Your Answer (Numeric Only)</h3>
            <div className="flex gap-4">
              <input
                type="number"
                step="any"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="e.g. 42"
                className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
              />
              <button
                onClick={checkAnswer}
                disabled={checking || !answer}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg"
              >
                {checking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Submit'}
              </button>
            </div>
            
            {result && (
              <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${result.correct ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {result.correct ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <span className="font-medium">
                  {result.correct ? 'Correct! Your streak has been updated.' : 'Incorrect. Try again!'}
                </span>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8">
            <button
              onClick={() => setHint(hint === 'show_solution' ? null : 'show_solution')}
              className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <Lightbulb className="w-5 h-5" />
              <span>{hint === 'show_solution' ? 'Hide Full Solution' : 'View Full Solution'}</span>
            </button>
            
            {hint === 'show_solution' && (
              <div className="mt-6 flex justify-start">
                <img 
                  src={`/images/solutions/${problem.title.replace(/ /g, '_').replace(/\//g, '').replace(/:/g, '')}.png`}
                  alt="Solution"
                  className="max-w-full h-auto invert hue-rotate-180 mix-blend-screen opacity-90"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
