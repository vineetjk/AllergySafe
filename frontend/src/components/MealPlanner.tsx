"use client";

import React, { useState } from "react";
import { UserProfile, MealPlanResponse } from "../types";
import { generateMealPlan, errorMessage } from "../lib/api";
import {
  CalendarDays, ShoppingCart, ShieldCheck, Clock, Check,
  Sparkles, RefreshCw, CheckSquare, Square, Info
} from "lucide-react";
import confetti from "canvas-confetti";

interface MealPlannerProps {
  profile: UserProfile;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ profile }) => {
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateMealPlan(days, profile);
      setPlan(res);
      setCheckedItems({});
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Control Box */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Meal Planner: one dinner for everyone</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Dinners that suit {profile.name}&apos;s profile, so everyone eats the same meal. Comes with a shopping list.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-1 rounded-xl bg-stone-100 dark:bg-stone-800 p-1 w-full sm:w-auto">
              {[3, 5, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    days === d
                      ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Plan dinners</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-200">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Render */}
      {plan && (
        <div className="space-y-6">
          {/* Day Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.days.map((day) => (
              <div
                key={day.day_number}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Day {day.day_number} • {day.day_name}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {day.prep_time_minutes} min
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug mb-1.5">
                    {day.dinner_title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                    {day.dinner_description}
                  </p>

                  <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/60 dark:border-stone-700/60 mb-3 text-xs">
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-0.5">
                      Why it suits {profile.name}:
                    </span>
                    <span className="text-stone-600 dark:text-stone-400 leading-relaxed">
                      {day.why_safe_for_both}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2 border border-amber-200/70 dark:border-amber-800/60">
                    <span className="font-bold">Tip:</span> {day.safety_prep_tip}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grocery List By Aisle */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Shopping list
                </h3>
              </div>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Tap items to tick them off
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(plan.grocery_list_by_aisle).map(([aisle, items]) => (
                <div key={aisle} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/70 px-2.5 py-1 rounded-md border border-stone-200/60 dark:border-stone-700">
                    {aisle} ({items.length})
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {items.map((item, idx) => {
                      const isChecked = checkedItems[item];
                      return (
                        <li key={idx}>
                          <button
                          type="button"
                          onClick={() => toggleCheck(item)}
                          aria-pressed={!!isChecked}
                          className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 line-through opacity-60"
                              : "hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-stone-400 dark:text-stone-600 shrink-0" />
                          )}
                          <span>{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Safety Protocol */}
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 p-5 transition-colors">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span>Kitchen habits that help</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950 dark:text-emerald-100 font-medium">
              {plan.kitchen_safety_protocol.map((protocol, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/70 dark:bg-stone-800/80 p-2.5 rounded-lg border border-emerald-200/50 dark:border-stone-700">
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <span>{protocol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
