"use client";

import { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { Play, Loader2, Sparkles } from 'lucide-react';

interface CodeEditorProps {
  onRun: (code: string, language: string) => void;
  isRunning: boolean;
  starterCode?: Record<string, string>;
}

const LANGUAGES = [
  { id: 'python', name: 'Python', default: 'print("Hello from RunRight!")' },
  { id: 'javascript', name: 'JavaScript', default: 'console.log("Hello from RunRight!");' },
  { id: 'cpp', name: 'C++', default: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from RunRight!" << std::endl;\n    return 0;\n}' },
];

export default function CodeEditor({ onRun, isRunning, starterCode }: CodeEditorProps) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(language.default);

  useEffect(() => {
    if (starterCode && starterCode[language.id]) {
      setCode(starterCode[language.id]);
    } else {
      setCode(language.default);
    }
  }, [starterCode, language.id]);

  const handleLanguageChange = (id: string) => {
    const lang = LANGUAGES.find(l => l.id === id)!;
    setLanguage(lang);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-white/5">
        <div className="flex items-center gap-4">
          <select
            value={language.id}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[#3c3c3c] text-sm text-gray-200 px-3 py-1.5 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onRun(code, language.id)}
          disabled={isRunning}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>

      <div className="flex-grow">
        <Editor
          height="100%"
          language={language.id}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 20 },
            roundedSelection: true,
            scrollBeyondLastLine: false,
            cursorStyle: 'line',
            automaticLayout: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </div>
    </div>
  );
}
