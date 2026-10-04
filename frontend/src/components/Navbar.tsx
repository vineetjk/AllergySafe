"use client";

import React from "react";
import { ShieldAlert, Sparkles, HeartHandshake, Mic, Server, Sun, Moon } from "lucide-react";

interface NavbarProps {
  onOpenWhyModal: () => void;
  engineStatus: string;
  friendName: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWhyModal,
  engineStatus,
  friendName,
  isDark,
  onToggleTheme
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none">
            <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                AllergySafe Table
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 shrink-0">
                HF26
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 truncate">
              <HeartHandshake className="h-3 w-3 text-rose-500 shrink-0 inline" />
              <span className="font-medium text-stone-700 dark:text-stone-300 truncate">Built for {friendName}</span>
            </p>
          </div>
        </div>

        {/* Tech badges on larger screens */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Mic className="h-3 w-3 text-purple-600" /> ElevenLabs Voice
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <Server className="h-3 w-3 text-teal-600" /> Render
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Engine status indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 px-3 py-1 text-xs text-stone-600 dark:text-stone-300">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            <span className="font-mono font-medium text-[11px]">{engineStatus}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-stone-600" />
            )}
          </button>

          {/* Why Open AI Modal Trigger */}
          <button
            onClick={onOpenWhyModal}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-600 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Why open source?</span>
            <span className="sm:hidden">Why open?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
