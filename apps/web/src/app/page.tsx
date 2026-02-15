"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { Code2, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await axios.get(`${API_BASE}/problems`);
        setProblems(res.data);
      } catch (err) {
        console.error('Failed to fetch problems', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'HARD': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black tracking-tight flex items-center gap-4">
          Challenges <Trophy className="w-10 h-10 text-amber-500" />
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Master your coding skills with our curated set of algorithm challenges. 
          Pick a problem and start solving in real-time.
        </p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 animate-pulse rounded-3xl" />
          ))
        ) : (
          problems.map((problem) => (
            <Link 
              key={problem.id} 
              href={`/problems/${problem.slug}`}
              className="group relative bg-[#1e1e1e] hover:bg-[#252526] border border-white/10 p-6 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-6">
                <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-indigo-600/10 transition-colors">
                  <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-white transition-colors">
                    {problem.title}
                  </h3>
                  <span className={cn(
                    "inline-block px-3 py-0.5 rounded-full text-xs font-bold border",
                    difficultyColor(problem.difficulty)
                  )}>
                    {problem.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all flex items-center gap-2 text-indigo-400 font-bold">
                    Solve Problem <ChevronRight className="w-5 h-5" />
                 </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
