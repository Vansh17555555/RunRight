"use client";

import { Terminal, Clock, Cpu, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Result {
  verdict: string;
  stdout?: string;
  stderr?: string;
  cpuTime?: number;
}

export default function ResultPanel({ result, isRunning }: { result: Result | null, isRunning: boolean }) {
  if (isRunning) {
    return (
      <div className="bg-[#1e1e1e] rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <Cpu className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Judging in Progress...
          </p>
          <p className="text-sm text-gray-400 max-w-[200px]">
            We've accepted your submission and our Docker workers are executing it.
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-[#1e1e1e] rounded-xl border border-white/10 p-12 flex flex-col items-center justify-center text-center opacity-50">
        <Terminal className="w-12 h-12 text-gray-500 mb-4" />
        <p className="text-gray-400">Output will be displayed here after execution.</p>
      </div>
    );
  }

  const isSuccess = result.verdict === 'AC';

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between px-6 py-4 bg-[#252526] border-b border-white/5">
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500" />
          )}
          <span className={`font-bold uppercase tracking-wider ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
            {result.verdict}
          </span>
        </div>

        {result.cpuTime !== undefined && (
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>{result.cpuTime}ms</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {result.stdout && (
            <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" /> Output
                </p>
                <pre className="bg-black/50 p-4 rounded-lg border border-white/5 text-gray-200 font-mono text-sm overflow-x-auto">
                    {result.stdout}
                </pre>
            </div>
        )}

        {result.stderr && (
            <div className="space-y-2">
                <p className="text-xs font-semibold text-rose-500/70 uppercase tracking-widest flex items-center gap-2">
                   <AlertCircle className="w-3 h-3" /> Errors
                </p>
                <pre className="bg-rose-500/5 p-4 rounded-lg border border-rose-500/10 text-rose-200 font-mono text-sm overflow-x-auto">
                    {result.stderr}
                </pre>
            </div>
        )}
      </div>
    </div>
  );
}
