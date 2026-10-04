"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, RecipeRemixResponse } from "../types";
import { remixRecipe } from "../lib/api";
import {
  ChefHat, Sparkles, CheckCircle2, ShieldCheck, Copy, Printer,
  RefreshCw, ArrowRight, ArrowLeftRight, Volume2, Square, Mic, Radio
} from "lucide-react";
import confetti from "canvas-confetti";

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

    try {
      const res = await fetch("http://localhost:8000/api/voice-guide", {
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
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
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
      // Direct browser speech fallback
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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-emerald-600" />
              <span>Recipe Remixer: Flavor Preservation & Safe Swaps</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
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
            className="w-full text-sm font-semibold rounded-xl border border-stone-200 px-3.5 py-2 text-stone-900 focus:border-emerald-500 focus:outline-none"
          />

          <textarea
            rows={5}
            placeholder="Original recipe ingredients (one per line)..."
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            className="w-full text-sm rounded-xl border border-stone-200 p-3.5 text-stone-800 focus:border-emerald-500 focus:outline-none font-mono"
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
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-md shadow-emerald-50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  100% Co-Living Approved
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Google Gemma 2 Core
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 mt-2">
                {remixResult.remixed_title}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Prep: {remixResult.prep_time} • Cook: {remixResult.cook_time} • Servings: {remixResult.servings}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* ElevenLabs Hands-free Button */}
              <button
                onClick={handlePlayVoiceGuide}
                disabled={voiceLoading}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
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

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* ElevenLabs Active Playing Banner */}
          {isPlayingAudio && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 flex items-center justify-between text-xs text-purple-950">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-purple-600 animate-pulse" />
                <div>
                  <span className="font-bold">Hands-Free Kitchen Narration Active</span>
                  <p className="text-[11px] text-purple-700">
                    Voice Provider: {voiceProvider || "ElevenLabs"} • Cooking hands-free prevents allergen cross-contact on screens!
                  </p>
                </div>
              </div>
              <button
                onClick={handlePlayVoiceGuide}
                className="text-xs text-purple-700 font-bold hover:underline"
              >
                Stop Audio
              </button>
            </div>
          )}

          {/* Flavor Notes */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Culinary Science & Flavor Preservation</span>
            </h4>
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              {remixResult.flavor_preservation_notes}
            </p>
          </div>

          {/* Side-by-Side Substitutions Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-stone-500" />
              <span>Ingredient Swaps & Equivalence Matrix</span>
            </h4>
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-2.5">Original (Unsafe)</th>
                    <th className="px-4 py-2.5">Safe 1:1 Replacement</th>
                    <th className="px-4 py-2.5">Culinary Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {remixResult.safe_ingredients.map((item, idx) => {
                    const isChanged = item.original !== item.substitute;
                    return (
                      <tr
                        key={idx}
                        className={isChanged ? "bg-emerald-50/20" : "hover:bg-stone-50/50"}
                      >
                        <td className="px-4 py-2.5 text-stone-700">
                          {isChanged ? (
                            <span className="line-through text-rose-600 opacity-80">
                              {item.original}
                            </span>
                          ) : (
                            item.original
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-stone-900">
                          {isChanged ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.substitute}
                            </span>
                          ) : (
                            <span className="text-stone-500">Unchanged (Safe)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 text-[11px] leading-relaxed">
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Sterile Kitchen Prep Instructions
            </h4>
            <div className="space-y-2">
              {remixResult.instructions.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-600 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cross Contamination Rules */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              Kitchen Cross-Contamination Guardrails for this Dish
            </h5>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-5">
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
