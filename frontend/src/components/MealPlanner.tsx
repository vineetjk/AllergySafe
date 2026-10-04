"use client";

import React, { useState } from "react";
import { UserProfile, MealPlanResponse } from "../types";
import { generateMealPlan } from "../lib/api";
import {
  CalendarDays, ShoppingCart, ShieldCheck, Clock, Check,
  Sparkles, RefreshCw, ChefHat, CheckSquare, Square
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

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateMealPlan(days);
      setPlan(res);
      setCheckedItems({});
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              <span>Co-Dining Meal Planner: One Shared Table</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Plan meals where you and {profile.name} eat the exact same dinner without cooking two separate pans or feeling excluded.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1">
              {[3, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    days === d
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Planning Dinners...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Shared Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Render */}
      {plan && (
        <div className="space-y-6">
          {/* Day Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.days.map((day) => (
              <div
                key={day.day_number}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Day {day.day_number} • {day.day_name}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {day.prep_time_minutes} min
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-sm leading-snug mb-1.5">
                    {day.dinner_title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    {day.dinner_description}
                  </p>

                  <div className="rounded-xl bg-stone-50 p-3 border border-stone-200/60 mb-3 text-xs">
                    <span className="font-bold text-stone-800 block mb-0.5">
                      Why safe for both:
                    </span>
                    <span className="text-stone-600 leading-relaxed">
                      {day.why_safe_for_both}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200/70">
                    🛡️ <span className="font-bold">Safety Tip:</span> {day.safety_prep_tip}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grocery List By Aisle */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Aisle-Sorted Supermarket Shopping List
                </h3>
              </div>
              <span className="text-xs text-stone-400">
                Click items to check off in aisle
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(plan.grocery_list_by_aisle).map(([aisle, items]) => (
                <div key={aisle} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200/60">
                    {aisle} ({items.length})
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {items.map((item, idx) => {
                      const isChecked = checkedItems[item];
                      return (
                        <li
                          key={idx}
                          onClick={() => toggleCheck(item)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-emerald-50 text-emerald-800 line-through opacity-60"
                              : "hover:bg-stone-50 text-stone-700"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                          )}
                          <span>{item}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Safety Protocol */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Roommate Kitchen Cross-Contamination Protocol</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950 font-medium">
              {plan.kitchen_safety_protocol.map((protocol, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-emerald-200/50">
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
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
