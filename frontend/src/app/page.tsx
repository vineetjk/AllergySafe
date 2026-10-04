"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { RoommateBanner } from "../components/RoommateBanner";
import { AskAssistant } from "../components/AskAssistant";
import { IngredientScanner } from "../components/IngredientScanner";
import { RecipeRemixer } from "../components/RecipeRemixer";
import { MealPlanner } from "../components/MealPlanner";
import { HandoverFeedback } from "../components/HandoverFeedback";
import { WhyOpenSourceModal } from "../components/WhyOpenSourceModal";
import { HealthResponse, UserProfile } from "../types";
import { fetchHealth } from "../lib/api";
import { profileStore } from "../lib/profile";
import { createLocalStore, useLocalStore } from "../lib/store";
import { MessageCircleQuestion, ShieldAlert, ChefHat, CalendarDays, NotebookPen } from "lucide-react";

const themeStore = createLocalStore<boolean>("allergysafe.dark", false, {
  clientDefault: () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  validate: (v): v is boolean => typeof v === "boolean",
});

type Tab = "ask" | "scanner" | "remixer" | "planner" | "notes";

const TABS: Array<{ id: Tab; short: string; long: (name: string) => string; icon: typeof ShieldAlert }> = [
  { id: "ask", short: "Ask", long: (n) => `Ask: Can ${n} eat this?`, icon: MessageCircleQuestion },
  { id: "scanner", short: "Scanner", long: () => "Ingredient Scanner", icon: ShieldAlert },
  { id: "remixer", short: "Remixer", long: () => "Recipe Remixer", icon: ChefHat },
  { id: "planner", short: "Planner", long: () => "Meal Planner", icon: CalendarDays },
  { id: "notes", short: "Notes", long: () => "Food Notes", icon: NotebookPen },
];

export default function Home() {
  const profile = useLocalStore(profileStore);
  const isDark = useLocalStore(themeStore);
  const [activeTab, setActiveTab] = useState<Tab>("ask");
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [serverDown, setServerDown] = useState(false);

  // Pre-fill state when moving from Scanner to Remixer
  const [remixDishTitle, setRemixDishTitle] = useState("Paneer Butter Masala");
  const [remixIngredients, setRemixIngredients] = useState<string[]>([
    "Paneer", "Butter", "Fresh cream", "Tomato", "Onion", "Ginger garlic paste", "Sugar", "Spices",
  ]);

  // Apply the theme to <html> (an external DOM update, so an effect is right here).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => themeStore.set(!isDark);
  const updateProfile = (updated: UserProfile) => profileStore.set(updated);
  const resetProfile = () => profileStore.clear();

  useEffect(() => {
    let cancelled = false;
    fetchHealth().then((h) => {
      if (cancelled) return;
      setHealth(h);
      setServerDown(!h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const engineStatus = !health
    ? serverDown
      ? "Server unreachable"
      : "Connecting..."
    : health.open_source_engine?.ollama_connected
    ? `Local model: ${health.open_source_engine.active_model}`
    : "Rule-based engine";

  const handleSendToRemix = (dishTitle: string, ingredients: string[]) => {
    setRemixDishTitle(dishTitle);
    setRemixIngredients(ingredients);
    setActiveTab("remixer");
  };

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-emerald-100 dark:selection:bg-emerald-950 transition-colors">
      <Navbar
        onOpenWhyModal={() => setWhyModalOpen(true)}
        engineStatus={engineStatus}
        friendName={profile.name}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 space-y-6">
        {serverDown && (
          <div role="status" className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            The server isn&apos;t responding yet. If the app was asleep it can take up to a minute to wake up; your next action will retry.
          </div>
        )}

        <RoommateBanner profile={profile} onUpdateProfile={updateProfile} onResetProfile={resetProfile} />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Sections"
          className="flex border-b border-stone-200 dark:border-stone-800 gap-1 sm:gap-2 overflow-x-auto pb-px no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? "border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-stone-900/60 rounded-t-xl"
                    : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.long(profile.name)}</span>
              </button>
            );
          })}
        </div>

        <div role="tabpanel">
          {activeTab === "ask" && <AskAssistant profile={profile} voice={health?.voice ?? null} />}
          {activeTab === "scanner" && <IngredientScanner profile={profile} onSendToRemix={handleSendToRemix} />}
          {activeTab === "remixer" && (
            <RecipeRemixer
              key={`${remixDishTitle}|${remixIngredients.join("|")}`}
              profile={profile}
              initialDishTitle={remixDishTitle} initialIngredients={remixIngredients} />
          )}
          {activeTab === "planner" && <MealPlanner profile={profile} />}
          {activeTab === "notes" && <HandoverFeedback profile={profile} />}
        </div>
      </main>

      <footer className="mt-16 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 text-stone-500 dark:text-stone-400 text-xs transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-stone-800 dark:text-stone-200">AllergySafe Table</span>
              <span aria-hidden>•</span>
              <span>Built for {profile.name}</span>
              <span aria-hidden>•</span>
              <span>Open source</span>
            </div>
            <button
              onClick={() => setWhyModalOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Why open source?
            </button>
          </div>
          <p className="max-w-3xl leading-relaxed">
            This app gives general food guidance based on typical recipes and the profile you set. It is not medical advice.
            Recipes and packaged foods vary, so check labels, and follow the advice of a doctor or dietitian for thyroid, gut, and weight concerns.
          </p>
        </div>
      </footer>

      <WhyOpenSourceModal isOpen={whyModalOpen} onClose={() => setWhyModalOpen(false)} />
    </div>
  );
}
