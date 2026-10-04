"use client";

import React, { useState } from "react";
import { UserProfile, ScanResponse, ImageScanResult } from "../types";
import { scanIngredients, errorMessage } from "../lib/api";
import { CameraScannerModal } from "./CameraScannerModal";
import {
  Search, AlertOctagon, CheckCircle2, AlertTriangle, ArrowRight,
  ChefHat, ShieldAlert, RefreshCw, Camera, Eye, Info, Timer
} from "lucide-react";

interface IngredientScannerProps {
  profile: UserProfile;
  onSendToRemix: (dishTitle: string, ingredients: string[]) => void;
}

const PRESETS = [
  {
    label: "Paneer Butter Masala",
    title: "Paneer Butter Masala",
    text: "Paneer, butter, fresh cream, tomato, cashew paste, onion, ginger garlic paste, kasuri methi, sugar, spices"
  },
  {
    label: "Chole Bhature",
    title: "Chole Bhature",
    text: "Chickpeas, onion, tomato, chole masala, deep-fried bhature made with maida and curd, oil"
  },
  {
    label: "Masala Chai",
    title: "Masala Chai",
    text: "Milk, tea leaves, sugar, ginger, cardamom"
  },
  {
    label: "Tofu Stir Fry",
    title: "Tofu Stir Fry",
    text: "Tofu, mixed vegetables, soy sauce, ginger, garlic, oil"
  },
  {
    label: "Moong Dal Khichdi",
    title: "Moong Dal Khichdi",
    text: "Moong dal, rice, carrot, peas, turmeric, cumin, ginger, cold-pressed oil"
  },
  {
    label: "Spaghetti & Meatballs",
    title: "Classic Spaghetti & Meatballs",
    text: "Ground beef, egg, breadcrumbs, parmesan cheese, all-purpose flour, garlic, marinara sauce, durum wheat spaghetti"
  }
];

export const IngredientScanner: React.FC<IngredientScannerProps> = ({ profile, onSendToRemix }) => {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [dishTitle, setDishTitle] = useState(PRESETS[0].title);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera & Image state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scannedThumbnail, setScannedThumbnail] = useState<string | null>(null);
  const [scannedImageResult, setScannedImageResult] = useState<ImageScanResult | null>(null);

  const handleScan = async (overrideText?: string, overrideTitle?: string) => {
    const textToScan = overrideText || inputText;
    const titleToScan = overrideTitle || dishTitle;
    if (!textToScan.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await scanIngredients(textToScan, profile, titleToScan);
      setResult(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setScannedThumbnail(null);
    setScannedImageResult(null);
    setDishTitle(preset.title);
    setInputText(preset.text);
    handleScan(preset.text, preset.title);
  };

  const handleCameraScanComplete = (imgResult: ImageScanResult, thumbnail: string) => {
    setScannedThumbnail(thumbnail);
    setScannedImageResult(imgResult);
    setDishTitle(imgResult.dish_name);
    setInputText(imgResult.detected_ingredients.join("\n"));
    if (imgResult.scan_result) setResult(imgResult.scan_result);
  };

  return (
    <div className="space-y-6">
      {/* Search & Input Box */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Safety Scanner: Can {profile.name} Eat This?</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Paste ingredients or a label, pick a sample, or check a photo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Camera Scanner Button */}
            <button
              onClick={() => setCameraModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Check a photo</span>
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 -mx-1 px-1">
          <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider shrink-0 mr-1">
            Samples:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSelectPreset(p)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium whitespace-nowrap transition-all cursor-pointer ${
                dishTitle === p.title && !scannedThumbnail
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                  : "bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Visual photo thumbnail banner if an image was captured */}
        {scannedThumbnail && scannedImageResult && (
          <div className="mb-4 flex items-center gap-3.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL thumbnail */}
              <img
                src={scannedThumbnail}
                alt="Captured food item"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {scannedImageResult.dish_name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                  {scannedImageResult.item_category}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 flex items-center gap-1">
                <Eye className="h-3 w-3 text-emerald-600 inline shrink-0" />
                <span>{scannedImageResult.visual_cues.join(" • ") || scannedImageResult.vision_engine}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setScannedThumbnail(null);
                setScannedImageResult(null);
              }}
              className="ml-auto text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-medium cursor-pointer shrink-0"
            >
              Clear photo
            </button>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Dish name (e.g. Grandma's Sunday Meatballs)"
            value={dishTitle}
            onChange={(e) => setDishTitle(e.target.value)}
            className="w-full text-base sm:text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-none"
          />

          <textarea
            rows={4}
            placeholder="Paste ingredients or recipe text here (e.g. Flour, soy sauce, pine nuts, parmesan...)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full text-base sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:border-emerald-500 focus:outline-none font-mono"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Checks against {profile.allergies.length} items in {profile.name}&apos;s profile</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => handleScan()}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Check for {profile.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-200">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm space-y-6 transition-colors">
          {/* Header Score Card */}
          <div
            className={`rounded-xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              result.overall_verdict === "DANGER"
                ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100"
                : result.overall_verdict === "CAUTION"
                ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100"
                : "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
                  result.overall_verdict === "DANGER"
                    ? "bg-rose-600 text-white"
                    : result.overall_verdict === "CAUTION"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {result.overall_verdict === "DANGER" ? (
                  <AlertOctagon className="h-6 w-6" />
                ) : result.overall_verdict === "CAUTION" ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight">
                    {result.overall_verdict === "DANGER"
                      ? `Not safe for ${profile.name}`
                      : result.overall_verdict === "CAUTION"
                      ? `OK in moderation for ${profile.name}`
                      : `Good to go for ${profile.name}`}
                  </span>
                </div>
                <p className="text-sm mt-1 opacity-90 leading-relaxed font-medium">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* Hazard Score Gauge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-current/10">
              <span className="text-xs uppercase font-bold tracking-wider opacity-75">Hazard Index</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{result.hazard_score}</span>
                <span className="text-xs font-semibold opacity-75">/ 100</span>
              </div>
            </div>
          </div>

          {/* Analysis details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              {result.ai_trace?.trace?.latency_ms !== undefined
                ? `Checked in ${result.ai_trace.trace.latency_ms} ms`
                : "Checked"}
            </span>
            <span>{result.total_ingredients_audited} ingredients examined</span>
            <span>Engine: {result.ai_trace?.engine}</span>
          </div>

          {/* Flagged Ingredients List */}
          {result.flags.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  What to watch out for ({result.flags.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {result.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border transition-all ${
                      flag.risk_level === "DANGER"
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                        : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                            {flag.ingredient_name}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              flag.risk_level === "DANGER"
                                ? "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                                : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                            }`}
                          >
                            {flag.matched_allergen}
                          </span>
                          {flag.is_hidden_derivative && (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold px-2 py-0.5 rounded-full">
                              Hidden source
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                          {flag.scientific_reason}
                        </p>
                      </div>

                      {flag.safe_substitute && (
                        <div className="shrink-0 bg-white/90 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-lg p-2.5 sm:max-w-xs shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            Suggested swap
                          </span>
                          <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                            {flag.safe_substitute}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 p-4 text-emerald-900 dark:text-emerald-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Nothing to flag</span>
              </div>
              <p>
                None of these ingredients conflict with {profile.name}&apos;s profile. Packaged foods can still change recipes, so check the label when you buy them.
              </p>
            </div>
          )}

          {/* Cross Contamination Hazards */}
          {result.cross_contamination_risks.length > 0 && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Kitchen tips</span>
              </h5>
              <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc pl-5">
                {result.cross_contamination_risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Footer: Remix Button */}
          {result.overall_verdict !== "SAFE" && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100 dark:border-stone-800">
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Want a version of this dish that suits {profile.name}?
              </div>
              <button
                onClick={() => {
                  const ingredientsList = inputText
                    .split(/[\n,;•]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onSendToRemix(dishTitle || "Favorite Recipe", ingredientsList);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 dark:shadow-none hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer"
              >
                <ChefHat className="h-4 w-4" />
                <span>Make a {profile.name}-friendly version</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera & Photo Scanner Modal */}
      <CameraScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        profile={profile}
        onScanComplete={handleCameraScanComplete}
      />
    </div>
  );
};
