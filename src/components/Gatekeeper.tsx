"use client";

import { CheckCircle2, Eye, Sparkles } from "lucide-react";

interface GatekeeperProps {
  onSelect: (isDagan: boolean) => void;
}

export default function Gatekeeper({ onSelect }: GatekeeperProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-950/5 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-inner">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tight">
          האם אתה דגן?
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
          בחר באפשרות המתאימה כדי להמשיך
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => onSelect(true)}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-rose-500/25 flex items-center justify-center gap-3 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>כן, אני דגן</span>
          </button>

          <button
            onClick={() => onSelect(false)}
            className="w-full py-4 px-6 rounded-2xl font-medium text-lg text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Eye className="w-5 h-5 text-zinc-400" />
            <span>לא, סתם מתעניין</span>
          </button>
        </div>
      </div>
    </div>
  );
}
