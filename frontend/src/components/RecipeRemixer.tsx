"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, RecipeRemixResponse } from "../types";
import { remixRecipe, getApiBase } from "../lib/api";
import {
  ChefHat, Sparkles, CheckCircle2, ShieldCheck, Copy, Printer,
  RefreshCw, ArrowRight, ArrowLeftRight, Volume2, Square, Mic, Radio
} from "lucide-react";
import confetti from "canvas-confetti";

// 0.01s of silence, used to unlock audio playback on iOS.
const SILENT_WAV = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

interface RecipeRemixerProps {
  profile: UserProfile;
  initialDishTitle?: string;
  initialIngredients?: string[];
}

export const RecipeRemixer: React.FC<RecipeRemixerProps> = ({
  profile,
  initialDishTitle = "Classic Spaghetti & Meatballs",
  initialIngredients = ["Ground beef", "Egg", "Breadcrumbs", "Parmesan cheese", "All-purpose flour", "Garlic", "Marinara sauce", "Durum wheat spaghetti"]
}) => {
  const [dishTitle, setDishTitle] = useState(initialDishTitle);
  const [ingredientsText, setIngredientsText] = useState(initialIngredients.join("\n"));
  const [loading, setLoading] = useState(false);
  const [remixResult, setRemixResult] = useState<RecipeRemixResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Voice narration state (ElevenLabs)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialDishTitle) setDishTitle(initialDishTitle);
    if (initialIngredients && initialIngredients.length > 0) {
      setIngredientsText(initialIngredients.join("\n"));
    }
  }, [initialDishTitle, initialIngredients]);

  const handleRemix = async () => {
    const list = ingredientsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return;

    setLoading(true);
    try {
      const res = await remixRecipe(dishTitle, list);
      setRemixResult(res);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!remixResult) return;
    const text = `🍽️ ${remixResult.remixed_title}\n\nSafe Ingredients:\n${remixResult.safe_ingredients
      .map((i) => `• ${i.substitute} (${i.notes})`)
      .join("\n")}\n\nInstructions:\n${remixResult.instructions.join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayVoiceGuide = async () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!remixResult) return;
    setVoiceLoading(true);

    // iOS Safari only lets audio play from a direct tap. Start a silent clip
    // now, while we're still inside the tap, then reuse the same element for
    // the ElevenLabs audio once the network request finishes.
    const audio = new Audio(SILENT_WAV);
    audio.play().catch(() => {});

    try {
      const res = await fetch(`${getApiBase()}/voice-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: remixResult.remixed_title,
          steps: remixResult.instructions,
          roommate_name: profile.name
        })
      });

      const data = await res.json();
      setVoiceProvider(data.provider || "ElevenLabs Voice");

      if (data.audio_base64) {
        audio.pause();
        audio.src = `data:audio/mpeg;base64,${data.audio_base64}`;
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        await audio.play();
        setIsPlayingAudio(true);
      } else {
        // Fallback to Web Speech API
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.script);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.onend = () => setIsPlayingAudio(false);
          window.speechSynthesis.speak(utterance);
          setIsPlayingAudio(true);
        }
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(
          `Let's cook ${remixResult.remixed_title} safely for ${profile.name}. Remember to use clean non-porous utensils.`
        );
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } finally {
      setVoiceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Formulation */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Recipe Remixer: Flavor Preservation & Safe Swaps</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Powered by Google Gemma 2 open weights • Replaces allergen triggers while preserving Maillard reaction, savoriness, and textures.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Dish Title (e.g. Chicken Parmigiana)"
            value={dishTitle}
            onChange={(e) => setDishTitle(e.target.value)}
            className="w-full text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:outline-none"
          />

          <textarea
            rows={5}
            placeholder="Original recipe ingredients (one per line)..."
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3.5 text-stone-800 dark:text-stone-200 focus:border-emerald-500 focus:outline-none font-mono"
          />

          <div className="flex justify-end">
            <button
              onClick={handleRemix}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing with Gemma 2...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Remix for {profile.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Remix Results Card */}
      {remixResult && (
        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-stone-900 p-6 shadow-md shadow-emerald-50 dark:shadow-none space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  100% Co-Living Approved
                </span>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Google Gemma 2 Core
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mt-2">
                {remixResult.remixed_title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Prep: {remixResult.prep_time} • Cook: {remixResult.cook_time} • Servings: {remixResult.servings}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* ElevenLabs Hands-free Button */}
              <button
                onClick={handlePlayVoiceGuide}
                disabled={voiceLoading}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto ${
                  isPlayingAudio
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {voiceLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading Voice...</span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop Voice Guide</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Hands-Free Voice (ElevenLabs)</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* ElevenLabs Active Playing Banner */}
          {isPlayingAudio && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 p-3.5 flex items-center justify-between text-xs text-purple-950 dark:text-purple-200">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                <div>
                  <span className="font-bold">Hands-Free Kitchen Narration Active</span>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Voice Provider: {voiceProvider || "ElevenLabs"} • Cooking hands-free prevents allergen cross-contact on screens!
                  </p>
                </div>
              </div>
              <button
                onClick={handlePlayVoiceGuide}
                className="text-xs text-purple-700 dark:text-purple-300 font-bold hover:underline"
              >
                Stop Audio
              </button>
            </div>
          )}

          {/* Flavor Notes */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Culinary Science & Flavor Preservation</span>
            </h4>
            <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
              {remixResult.flavor_preservation_notes}
            </p>
          </div>

          {/* Substitutions: Mobile Card View + Desktop Table View */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span>Ingredient Swaps & Equivalence Matrix</span>
            </h4>

            {/* Mobile Card List (< 640px) */}
            <div className="block sm:hidden space-y-2.5">
              {remixResult.safe_ingredients.map((item, idx) => {
                const isChanged = item.original !== item.substitute;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 border text-xs ${
                      isChanged
                        ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                        : "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-medium ${isChanged ? "line-through text-rose-600 dark:text-rose-400" : "text-stone-700 dark:text-stone-300"}`}>
                        {item.original}
                      </span>
                      {isChanged && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full shrink-0">
                          Safe Swap
                        </span>
                      )}
                    </div>
                    {isChanged && (
                      <div className="mt-1 font-bold text-stone-900 dark:text-stone-100">
                        ➔ {item.substitute}
                      </div>
                    )}
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= 640px) */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 uppercase font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="px-4 py-2.5">Original (Unsafe)</th>
                    <th className="px-4 py-2.5">Safe 1:1 Replacement</th>
                    <th className="px-4 py-2.5">Culinary Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                  {remixResult.safe_ingredients.map((item, idx) => {
                    const isChanged = item.original !== item.substitute;
                    return (
                      <tr
                        key={idx}
                        className={isChanged ? "bg-emerald-50/20 dark:bg-emerald-950/20" : "hover:bg-stone-50/50 dark:hover:bg-stone-800/50"}
                      >
                        <td className="px-4 py-2.5 text-stone-700 dark:text-stone-300">
                          {isChanged ? (
                            <span className="line-through text-rose-600 dark:text-rose-400 opacity-80">
                              {item.original}
                            </span>
                          ) : (
                            item.original
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-stone-900 dark:text-stone-100">
                          {isChanged ? (
                            <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {item.substitute}
                            </span>
                          ) : (
                            <span className="text-stone-500 dark:text-stone-400">Unchanged (Safe)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                          {item.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              Sterile Kitchen Prep Instructions
            </h4>
            <div className="space-y-2">
              {remixResult.instructions.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-600 dark:text-stone-300 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cross Contamination Rules */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2">
              Kitchen Cross-Contamination Guardrails for this Dish
            </h5>
            <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 list-disc pl-5">
              {remixResult.cross_contamination_rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
