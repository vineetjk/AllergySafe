"use client";

import React from "react";
import { ShieldAlert, Sparkles, HeartHandshake, Info } from "lucide-react";

interface NavbarProps {
  onOpenWhyModal: () => void;
  engineStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWhyModal, engineStatus }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-stone-900">AllergySafe Table</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
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

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-medium">{engineStatus}</span>
          </div>

          <button
            onClick={onOpenWhyModal}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Why Open Innovation?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
