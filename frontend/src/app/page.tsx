"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { RoommateBanner } from "../components/RoommateBanner";
import { IngredientScanner } from "../components/IngredientScanner";
import { RecipeRemixer } from "../components/RecipeRemixer";
import { MealPlanner } from "../components/MealPlanner";
import { HandoverFeedback } from "../components/HandoverFeedback";
import { WhyOpenSourceModal } from "../components/WhyOpenSourceModal";
import { UserProfile } from "../types";
import { fetchProfile, fetchHealth } from "../lib/api";
import {
  ShieldAlert, ChefHat, CalendarDays, Heart, Sparkles,
  Cpu, HeartHandshake
} from "lucide-react";

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>({
    id: "maya-default",
    name: "Maya",
    relationship: "Roommate & Best Friend",
    allergies: [
      {
        name: "Gluten / Celiac",
        severity: "anaphylactic",
        notes: "Severe Celiac Disease. Strictly no wheat, barley, rye, or hidden malt."
      },
      {
        name: "Tree Nuts",
        severity: "anaphylactic",
        notes: "Almonds, cashews, walnuts, pistachios. Carries EpiPen."
      },
      {
        name: "Lactose / Dairy",
        severity: "intolerance",
        notes: "Severe digestive discomfort; prefers dairy-free options."
      }
    ],
    dislikes: ["Cilantro", "Very spicy hot sauce"],
    favorite_cuisines: ["Mediterranean", "Japanese", "Comfort Mexican", "Rustic Italian"]
  });

  const [activeTab, setActiveTab] = useState<"scanner" | "remixer" | "planner" | "handover">("scanner");
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState("Google Gemma 2 Core: Ready");
  const [isDark, setIsDark] = useState(false);

  // Pre-fill state when transitioning from Scanner to Remixer
  const [remixDishTitle, setRemixDishTitle] = useState("Classic Spaghetti & Meatballs");
  const [remixIngredients, setRemixIngredients] = useState<string[]>([
    "Ground beef", "Egg", "Breadcrumbs", "Parmesan cheese", "All-purpose flour", "Garlic", "Marinara sauce", "Durum wheat spaghetti"
  ]);

  // Theme synchronization with localStorage and documentElement
  useEffect(() => {
    try {
      const savedTheme = typeof window !== "undefined" && window.localStorage ? localStorage.getItem("theme") : null;
      const systemPrefersDark = typeof window !== "undefined" && typeof window.matchMedia === "function" 
        ? window.matchMedia("(prefers-color-scheme: dark)").matches 
        : false;
      const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

      setIsDark(shouldBeDark);
      if (typeof document !== "undefined") {
        if (shouldBeDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (e) {
      console.warn("Theme synchronization safely bypassed on restricted mobile webview:", e);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      if (typeof document !== "undefined") {
        if (nextDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("theme", nextDark ? "dark" : "light");
      }
    } catch (e) {
      console.warn("Theme persistence safely bypassed:", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      const loadedProfile = await fetchProfile();
      if (loadedProfile) setProfile(loadedProfile);

      const health = await fetchHealth();
      if (health?.open_source_engine) {
        setEngineStatus(
          health.open_source_engine.ollama_connected
            ? `Google Gemma 2 (${health.open_source_engine.active_model})`
            : "Deterministic Clinical Taxonomy"
        );
      }
    }
    loadData();
  }, []);

  const handleSendToRemix = (dishTitle: string, ingredients: string[]) => {
    setRemixDishTitle(dishTitle);
    setRemixIngredients(ingredients);
    setActiveTab("remixer");
  };

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-emerald-100 dark:selection:bg-emerald-950 selection:text-emerald-900 dark:selection:text-emerald-200 transition-colors">
      {/* Top Navigation */}
      <Navbar
        onOpenWhyModal={() => setWhyModalOpen(true)}
        engineStatus={engineStatus}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Roommate Focus Card */}
        <RoommateBanner
          profile={profile}
          onUpdateProfile={(updated) => setProfile(updated)}
        />

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 gap-1.5 sm:gap-2 overflow-x-auto pb-px no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === "scanner"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-stone-900/60 rounded-t-xl"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              <span className="sm:hidden">Scanner</span>
              <span className="hidden sm:inline">Safety Scanner ("Can {profile.name} Eat This?")</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("remixer")}
            className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === "remixer"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-stone-900/60 rounded-t-xl"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <ChefHat className="h-4 w-4 shrink-0" />
            <span>
              <span className="sm:hidden">Recipe Remixer</span>
              <span className="hidden sm:inline">Recipe Remixer (1:1 Safe Swaps)</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === "planner"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-stone-900/60 rounded-t-xl"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              <span className="sm:hidden">Meal Planner</span>
              <span className="hidden sm:inline">Co-Dining Meal Planner</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("handover")}
            className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === "handover"
                ? "border-rose-500 text-rose-700 dark:text-rose-300 bg-white/60 dark:bg-stone-900/60 rounded-t-xl"
                : "border-transparent text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <HeartHandshake className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              <span className="sm:hidden">Friend Handover</span>
              <span className="hidden sm:inline">Handover Story & Reaction</span>
            </span>
            <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full shrink-0">
              Bonus
            </span>
          </button>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === "scanner" && (
            <IngredientScanner
              profile={profile}
              onSendToRemix={handleSendToRemix}
            />
          )}

          {activeTab === "remixer" && (
            <RecipeRemixer
              profile={profile}
              initialDishTitle={remixDishTitle}
              initialIngredients={remixIngredients}
            />
          )}

          {activeTab === "planner" && (
            <MealPlanner profile={profile} />
          )}

          {activeTab === "handover" && (
            <HandoverFeedback profile={profile} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 text-stone-500 dark:text-stone-400 text-xs transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">AllergySafe Table</span>
            <span>•</span>
            <span>Hacktoberfest Weekend Challenge 2026</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Build for a Friend</span>
          </div>
          <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400">
            <button
              onClick={() => setWhyModalOpen(true)}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Why Open Innovation?
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              100% Local Inference & Offline Data
            </span>
          </div>
        </div>
      </footer>

      {/* Why Open Source Modal */}
      <WhyOpenSourceModal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
      />
    </div>
  );
}
