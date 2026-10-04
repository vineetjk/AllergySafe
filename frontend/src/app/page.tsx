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
  const [engineStatus, setEngineStatus] = useState("Local Open AI: Ready");

  // Pre-fill state when transitioning from Scanner to Remixer
  const [remixDishTitle, setRemixDishTitle] = useState("Classic Spaghetti & Meatballs");
  const [remixIngredients, setRemixIngredients] = useState<string[]>([
    "Ground beef", "Egg", "Breadcrumbs", "Parmesan cheese", "All-purpose flour", "Garlic", "Marinara sauce", "Durum wheat spaghetti"
  ]);

  useEffect(() => {
    async function loadData() {
      const loadedProfile = await fetchProfile();
      if (loadedProfile) setProfile(loadedProfile);

      const health = await fetchHealth();
      if (health?.open_source_engine) {
        setEngineStatus(
          health.open_source_engine.ollama_connected
            ? `Local Llama 3.2 (${health.open_source_engine.active_model})`
            : "Local Open Deterministic Engine"
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
    <div className="min-h-screen bg-stone-100/60 font-sans text-stone-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        onOpenWhyModal={() => setWhyModalOpen(true)}
        engineStatus={engineStatus}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Roommate Focus Card */}
        <RoommateBanner
          profile={profile}
          onUpdateProfile={(updated) => setProfile(updated)}
        />

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "scanner"
                ? "border-emerald-600 text-emerald-800 bg-white/60 rounded-t-xl"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Safety Scanner ("Can {profile.name} Eat This?")</span>
          </button>

          <button
            onClick={() => setActiveTab("remixer")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "remixer"
                ? "border-emerald-600 text-emerald-800 bg-white/60 rounded-t-xl"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>Recipe Remixer (1:1 Safe Swaps)</span>
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "planner"
                ? "border-emerald-600 text-emerald-800 bg-white/60 rounded-t-xl"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Co-Dining Meal Planner</span>
          </button>

          <button
            onClick={() => setActiveTab("handover")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "handover"
                ? "border-rose-500 text-rose-700 bg-white/60 rounded-t-xl"
                : "border-transparent text-stone-500 hover:text-rose-600 hover:border-stone-300"
            }`}
          >
            <HeartHandshake className="h-4 w-4 text-rose-500" />
            <span>Handover Story & Reaction</span>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
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
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 text-stone-500 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">AllergySafe Table</span>
            <span>•</span>
            <span>Hacktoberfest Weekend Challenge 2026</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Build for a Friend</span>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <button
              onClick={() => setWhyModalOpen(true)}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Why Open Innovation?
            </button>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-emerald-600" />
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
