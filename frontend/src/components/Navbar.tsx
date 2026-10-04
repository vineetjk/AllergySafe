"use client";

import React from "react";
import { ShieldAlert, Sparkles, HeartHandshake, Mic, Server, Activity, Cpu } from "lucide-react";

interface NavbarProps {
  onOpenWhyModal: () => void;
  engineStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWhyModal, engineStatus }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-stone-900">AllergySafe Table</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                HF26 Challenge
              </span>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <span>Co-Living Dining & Food Safety</span>
              <span>•</span>
              <span className="font-medium text-stone-700 flex items-center gap-1">
                <HeartHandshake className="h-3 w-3 text-rose-500 inline" /> Built for Maya
              </span>
            </p>
          </div>
        </div>

        {/* Partner tech pill list */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
            <Cpu className="h-3 w-3 text-blue-600" /> Google Gemma 2
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
            <Mic className="h-3 w-3 text-purple-600" /> ElevenLabs Voice
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
            <Server className="h-3 w-3 text-teal-600" /> Render
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            <Activity className="h-3 w-3 text-amber-600" /> Sentry Tracing
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-medium text-[11px]">{engineStatus}</span>
          </div>

          <button
            onClick={onOpenWhyModal}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Why Open AI?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
