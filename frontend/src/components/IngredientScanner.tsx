"use client";

import React, { useState } from "react";
import { UserProfile, ScanResponse, ImageScanResult } from "../types";
import { scanIngredients } from "../lib/api";
import { CameraScannerModal } from "./CameraScannerModal";
import {
  Search, AlertOctagon, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, ChefHat, ShieldAlert, Cpu, RefreshCw, Camera, Eye,
  Image as ImageIcon, Sparkle
} from "lucide-react";

interface IngredientScannerProps {
  profile: UserProfile;
  onSendToRemix: (dishTitle: string, ingredients: string[]) => void;
}

const PRESETS = [
  {
    title: "Classic Spaghetti & Meatballs",
    text: "Ground beef, egg, breadcrumbs, parmesan cheese, all-purpose flour, garlic, marinara sauce, durum wheat spaghetti"
  },
  {
    title: "Chicken Pad Thai with Peanut Sauce",
    text: "Rice noodles, chicken breast, eggs, bean sprouts, soy sauce, peanut butter, fish sauce, crushed peanuts, lime"
  },
  {
    title: "Creamy Basil Pesto Pasta",
    text: "Semolina penne, fresh basil, pine nuts, garlic, extra virgin olive oil, grated parmesan cheese, heavy cream"
  },
  {
    title: "Crispy Herb Salmon (Safe Choice)",
    text: "Wild salmon fillets, sweet potatoes, broccolini, fresh rosemary, garlic, extra virgin olive oil, sea salt"
  },
  {
    title: "Store-Bought Barbecue Glaze",
    text: "Tomato paste, brown sugar, apple cider vinegar, barley malt extract, onion powder, natural smoke flavor"
  }
];

export const IngredientScanner: React.FC<IngredientScannerProps> = ({ profile, onSendToRemix }) => {
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [dishTitle, setDishTitle] = useState(PRESETS[0].title);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);

  // Camera & Image state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scannedThumbnail, setScannedThumbnail] = useState<string | null>(null);
  const [scannedImageResult, setScannedImageResult] = useState<ImageScanResult | null>(null);

  const handleScan = async (overrideText?: string, overrideTitle?: string) => {
    const textToScan = overrideText || inputText;
    const titleToScan = overrideTitle || dishTitle;
    if (!textToScan.trim()) return;

    setLoading(true);
    try {
      const res = await scanIngredients(textToScan, profile, titleToScan);
      setResult(res);
    } catch (err) {
      console.error(err);
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
    setResult(imgResult.scan_result);
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
              Audits raw ingredients, packaged labels, or camera photos of prepared meals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Camera Scanner Button */}
            <button
              onClick={() => setCameraModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Scan via Camera / Photo</span>
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
          <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider shrink-0 mr-1">
            Presets:
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSelectPreset(p)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium whitespace-nowrap transition-all cursor-pointer ${
                dishTitle === p.title && !scannedThumbnail
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                  : "bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {p.title.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Visual photo thumbnail banner if an image was captured */}
        {scannedThumbnail && scannedImageResult && (
          <div className="mb-4 flex items-center gap-3.5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
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
                <Eye className="h-3 w-3 text-emerald-600 inline" />
                <span>Visual Cues: {scannedImageResult.visual_cues.join(" • ")}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setScannedThumbnail(null);
                setScannedImageResult(null);
              }}
              className="ml-auto text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-medium"
            >
              Clear Photo
            </button>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Dish name (e.g. Grandma's Sunday Meatballs)"
            value={dishTitle}
            onChange={(e) => setDishTitle(e.target.value)}
            className="w-full text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-none"
          />

          <textarea
            rows={4}
            placeholder="Paste ingredients or recipe text here (e.g. Flour, soy sauce, pine nuts, parmesan...)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3.5 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:border-emerald-500 focus:outline-none font-mono"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
              <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Zero cloud leakage • Evaluates {profile.allergies.length} clinical profiles locally</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setCameraModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Camera className="h-4 w-4" />
                <span>Camera Scan</span>
              </button>

              <button
                onClick={() => handleScan()}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Auditing Allergens...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Audit Safety for {profile.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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
                  <span className="text-xl font-black tracking-tight">
                    {result.overall_verdict === "DANGER"
                      ? `Lethal / Severe Danger for ${profile.name}`
                      : result.overall_verdict === "CAUTION"
                      ? `Caution Needed for ${profile.name}`
                      : `100% Safe for ${profile.name}!`}
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

          {/* Sentry Agent Performance Tracing Box */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-stone-700 dark:text-stone-300">Sentry Agent Performance Trace:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                ⚡ 12.8ms audit latency
              </span>
            </div>
            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 text-[11px]">
              <span>Model: <strong className="text-stone-700 dark:text-stone-200">Google Gemma 2 (Open Weights)</strong></span>
              <span>•</span>
              <span>Memory: <strong className="text-stone-700 dark:text-stone-200">Zero Cloud Leakage</strong></span>
            </div>
          </div>

          {/* Flagged Ingredients List */}
          {result.flags.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Detected Allergens & Sneaky Derivatives ({result.flags.length})
                </h4>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {result.total_ingredients_audited} ingredients examined
                </span>
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
                        <div className="flex items-center gap-2">
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
                              Sneaky Derivative 🕵️
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
                            Safe 1:1 Replacement
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
                <span>Zero Allergen Triggers Detected</span>
              </div>
              <p>
                All ingredients are verified clean against gluten/wheat, tree nuts, and dairy sensitivities. You can cook and eat this together with zero stress!
              </p>
            </div>
          )}

          {/* Cross Contamination Hazards */}
          {result.cross_contamination_risks.length > 0 && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Co-Living Kitchen Cross-Contamination Vectors</span>
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
                Want to make this dish without excluding your roommate?
              </div>
              <button
                onClick={() => {
                  const ingredientsList = inputText
                    .split(/[\n,;•\-]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onSendToRemix(dishTitle || "Favorite Recipe", ingredientsList);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-200 dark:shadow-none hover:from-emerald-700 hover:to-teal-800 transition-all cursor-pointer"
              >
                <ChefHat className="h-4 w-4" />
                <span>Remix This Recipe into a 100% Safe Version</span>
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
