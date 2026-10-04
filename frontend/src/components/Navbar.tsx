"use client";

import { Leaf, Sun, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavTab<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface NavbarProps<T extends string> {
  tabs: NavTab<T>[];
  activeTab: T;
  onSelectTab: (tab: T) => void;
  friendName: string;
  onOpenProfile: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Navbar<T extends string>({
  tabs,
  activeTab,
  onSelectTab,
  friendName,
  onOpenProfile,
  isDark,
  onToggleTheme,
}: NavbarProps<T>) {
  return (
    <header className="shrink-0 z-30 border-b border-stone-200/80 dark:border-stone-800 bg-white/85 dark:bg-stone-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Leaf className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50 truncate">
            AllergySafe Table
          </span>
        </div>

        {/* Inline tabs on tablets and desktop */}
        <nav aria-label="Sections" className="hidden md:flex flex-1 justify-center">
          <div role="tablist" className="flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-900 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-300 shadow-sm"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right actions */}
        <div className="ml-auto md:ml-0 flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-1 pl-1 pr-3 text-sm font-medium text-stone-800 dark:text-stone-200 hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors cursor-pointer"
            aria-label={`${friendName}'s food profile`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-semibold">
              {friendName.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[7rem] truncate">{friendName}</span>
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar for phones: every section is always visible, no scrolling. */
export function BottomNav<T extends string>({
  tabs,
  activeTab,
  onSelectTab,
}: Pick<NavbarProps<T>, "tabs" | "activeTab" | "onSelectTab">) {
  return (
    <nav
      aria-label="Sections"
      className="md:hidden shrink-0 z-30 border-t border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md pb-safe"
    >
      <div role="tablist" className="grid h-16" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                active ? "text-emerald-700 dark:text-emerald-400" : "text-stone-500 dark:text-stone-400"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-emerald-100 dark:bg-emerald-950" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
