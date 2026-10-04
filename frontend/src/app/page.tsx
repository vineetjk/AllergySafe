"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { Navbar, BottomNav, NavTab } from "../components/Navbar";
import { ProfileSheet } from "../components/ProfileSheet";
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
import { MessageCircle, ScanLine, ChefHat, CalendarDays, NotebookPen } from "lucide-react";

const themeStore = createLocalStore<boolean>("allergysafe.dark", false, {
  clientDefault: () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
  validate: (v): v is boolean => typeof v === "boolean",
});

type Tab = "ask" | "scan" | "remix" | "plan" | "notes";

const TABS: NavTab<Tab>[] = [
  { id: "ask", label: "Ask", icon: MessageCircle },
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "remix", label: "Remix", icon: ChefHat },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: NotebookPen },
];

const TAB_IDS = TABS.map((t) => t.id);

// The active tab lives in the URL hash (#scan, #plan, ...) so tabs are
// linkable and the phone's back button moves between them.
function readTab(): Tab {
  const hash = window.location.hash.replace("#", "") as Tab;
  return TAB_IDS.includes(hash) ? hash : "ask";
}
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function goToTab(tab: Tab) {
  if (readTab() === tab) return;
  window.location.hash = tab === "ask" ? "" : tab;
  if (tab === "ask") history.replaceState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

const PAGE_COPY: Record<Exclude<Tab, "ask">, { title: string; subtitle: (name: string) => string }> = {
  scan: { title: "Check ingredients", subtitle: (n) => `Paste a recipe or label, or check a photo, to see what suits ${n}.` },
  remix: { title: "Remix a recipe", subtitle: (n) => `Swap only what doesn't suit ${n}, and keep the rest of the dish.` },
  plan: { title: "Plan dinners", subtitle: (n) => `Meals that suit ${n}, so everyone eats the same thing.` },
  notes: { title: "Food notes", subtitle: (n) => `Remember what ${n} loved and what didn't sit well.` },
};

export default function Home() {
  const profile = useLocalStore(profileStore);
  const isDark = useLocalStore(themeStore);
  const activeTab = useSyncExternalStore(subscribeHash, readTab, () => "ask" as Tab);
  const setActiveTab = goToTab;
  const [profileOpen, setProfileOpen] = useState(false);
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [serverDown, setServerDown] = useState(false);

  // Pre-fill when moving from the scanner to the remixer
  const [remixDishTitle, setRemixDishTitle] = useState("Paneer Butter Masala");
  const [remixIngredients, setRemixIngredients] = useState<string[]>([
    "Paneer", "Butter", "Fresh cream", "Tomato", "Onion", "Ginger garlic paste", "Sugar", "Spices",
  ]);

  // Apply the theme to <html> (an external DOM update, so an effect is right here).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

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

  const updateProfile = (updated: UserProfile) => profileStore.set(updated);

  const handleSendToRemix = (dishTitle: string, ingredients: string[]) => {
    setRemixDishTitle(dishTitle);
    setRemixIngredients(ingredients);
    setActiveTab("remix");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden text-stone-900 dark:text-stone-100">
      <Navbar
        tabs={TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        friendName={profile.name}
        onOpenProfile={() => setProfileOpen(true)}
        isDark={isDark}
        onToggleTheme={() => themeStore.set(!isDark)}
      />

      {serverDown && (
        <div role="status" className="shrink-0 bg-amber-50 dark:bg-amber-950/50 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-200">
          The server is waking up. This can take up to a minute; your next action will retry.
        </div>
      )}

      {activeTab === "ask" ? (
        <main className="flex min-h-0 flex-1 flex-col">
          <AskAssistant profile={profile} voice={health?.voice ?? null} onOpenProfile={() => setProfileOpen(true)} />
        </main>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-5 sm:mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50">
                {PAGE_COPY[activeTab].title}
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{PAGE_COPY[activeTab].subtitle(profile.name)}</p>
            </div>

            {activeTab === "scan" && <IngredientScanner profile={profile} onSendToRemix={handleSendToRemix} />}
            {activeTab === "remix" && (
              <RecipeRemixer
                key={`${remixDishTitle}|${remixIngredients.join("|")}`}
                profile={profile}
                initialDishTitle={remixDishTitle}
                initialIngredients={remixIngredients}
              />
            )}
            {activeTab === "plan" && <MealPlanner profile={profile} />}
            {activeTab === "notes" && <HandoverFeedback profile={profile} />}

            <footer className="mt-12 border-t border-stone-200 dark:border-stone-800 pt-6 text-xs text-stone-500 dark:text-stone-400 space-y-2">
              <p className="max-w-2xl leading-relaxed">
                General food guidance based on typical recipes and the profile you set, not medical advice. Check labels,
                and follow a doctor or dietitian for thyroid, gut, and weight concerns.
              </p>
              <button onClick={() => setWhyModalOpen(true)} className="underline-offset-2 hover:underline cursor-pointer">
                Why this app is open source
              </button>
            </footer>
          </div>
        </main>
      )}

      <BottomNav tabs={TABS} activeTab={activeTab} onSelectTab={setActiveTab} />

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
        onResetProfile={() => profileStore.clear()}
      />
      <WhyOpenSourceModal isOpen={whyModalOpen} onClose={() => setWhyModalOpen(false)} />
    </div>
  );
}
