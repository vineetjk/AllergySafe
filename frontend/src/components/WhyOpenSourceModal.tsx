"use client";

import React from "react";
import { X, ShieldAlert, Cpu, WifiOff, DollarSign, Database, CheckCircle2 } from "lucide-react";

interface WhyOpenSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyOpenSourceModal: React.FC<WhyOpenSourceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const pillars = [
    {
      icon: <ShieldAlert className="h-6 w-6 text-rose-500" />,
      title: "1. Health Data Sovereignty & Personal Privacy",
      tag: "Zero Cloud Leakage",
      argument: "Dietary restrictions, Celiac auto-immune diagnoses, and anaphylactic triggers are sensitive protected health information. Closed cloud LLMs retain user chats on remote corporate servers to retrain proprietary models. With local open-source inference, Maya's medical profile never leaves the device."
    },
    {
      icon: <Database className="h-6 w-6 text-amber-500" />,
      title: "2. Deterministic Verification vs. Generative Hallucinations",
      tag: "Auditable Safety",
      argument: "Closed commercial LLMs optimize for conversational fluency, not clinical rigor. They frequently hallucinate dangerous advice (e.g. claiming regular soy sauce is harmless, or overlooking barley malt extract). Our open-source stack pairs Google Gemma 2 with transparent, deterministic allergen taxonomies where every substitution is verifiable and auditable."
    },
    {
      icon: <WifiOff className="h-6 w-6 text-emerald-500" />,
      title: "3. The Basement Supermarket (Offline) Reality",
      tag: "100% Offline Capable",
      argument: "Real grocery shopping happens in subterranean urban supermarket basements, bodega corners, or remote farmstands with zero cellular reception. A closed API app leaves you stranded in aisle 4. AllergySafe Table runs entirely on local models and offline taxonomies with zero internet needed."
    },
    {
      icon: <DollarSign className="h-6 w-6 text-blue-500" />,
      title: "4. Uncapped Zero-Cost for Students & Roommates",
      tag: "$0 / Month Forever",
      argument: "Roommates splitting rent and college students shouldn't have to budget $20/month per user or face metered API billing just to safely plan dinner together. Open weights (Google Gemma 2) and open frameworks cost nothing to execute."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl sm:p-8 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Open Innovation Manifesto
          </span>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2 tracking-tight">
            Why Open Innovation Matters for What We Built
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Where an open-based architecture worked demonstrably better than a closed API.
          </p>
        </div>

        <div className="space-y-4">
          {pillars.map((p, idx) => (
            <div key={idx} className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="shrink-0 p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs">
                  {p.icon}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{p.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-stone-900 px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {p.argument}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Open Weights: Google Gemma 2 • Open Food Facts Schema • Fast, Local & Private</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2 text-xs font-bold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
