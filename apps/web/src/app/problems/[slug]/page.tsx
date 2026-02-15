"use client";

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import CodeEditor from '@/components/Editor';
import ResultPanel from '@/components/ResultPanel';
import axios from 'axios';
import { Sparkles, Terminal as TerminalIcon, Info, ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProblemSolver() {
  const { slug } = useParams();
  const { token, user, loading } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
        router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await axios.get(`${API_BASE}/problems/${slug}`);
        setProblem(res.data);
      } catch (err) {
        console.error('Problem not found');
        router.push('/');
      }
    };
    if (slug) fetchProblem();
  }, [slug]);

  useEffect(() => {
    const newSocket = io(API_BASE);
    setSocket(newSocket);

    newSocket.on('SUBMISSION_COMPLETED', (data) => {
      setResult(data);
      setIsRunning(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleRun = async (code: string, language: string) => {
    if (!token || !problem) return;
    
    setIsRunning(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/submissions`, {
        sourceCode: code,
        language,
        problemId: problem.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { submissionId } = response.data;
      if (socket) {
        socket.emit('subscribe', submissionId);
      }
    } catch (error) {
      console.error('Execution failed:', error);
      setIsRunning(false);
      setResult({ verdict: 'IE', stderr: 'Failed to reach the execution engine.' });
    }
  };

  if (loading || !problem) return null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <Link 
            href="/" 
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all"
        >
            <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-lg font-bold flex items-center gap-2">
            {problem.title} 
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {problem.difficulty}
            </span>
        </h2>
      </div>

      <div className="flex-grow flex min-h-0">
        {/* Left: Description */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto bg-[#141414] p-8 space-y-6">
          <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
            <Info className="w-4 h-4" /> Description
          </div>
          <div 
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: problem.description }}
          />

          {problem.testCases && problem.testCases.length > 0 && (
            <div className="space-y-4 pt-8 border-t border-white/5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sample Inputs</p>
                {problem.testCases.map((tc: any, i: number) => (
                    <div key={i} className="space-y-2">
                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-sm">
                            <span className="text-indigo-400 text-xs block mb-1">Input</span>
                            {tc.input}
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-sm">
                            <span className="text-emerald-400 text-xs block mb-1">Expected Output</span>
                            {tc.expectedOutput}
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Code & Console */}
        <div className="flex-grow flex flex-col p-6 gap-6 bg-[#0a0a0a]">
          <div className="flex-grow min-h-0">
            <CodeEditor onRun={handleRun} isRunning={isRunning} starterCode={problem.defaultCode} />
          </div>
          
          <div className="h-1/3 flex flex-col gap-3 min-h-[250px]">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest px-2">
              <TerminalIcon className="w-4 h-4" />
              Judging Output
            </div>
            <div className="flex-grow overflow-y-auto">
               <ResultPanel result={result} isRunning={isRunning} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
