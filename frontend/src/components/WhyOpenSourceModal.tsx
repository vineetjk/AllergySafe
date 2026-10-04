"use client";

import React from "react";
import { X, ShieldAlert, Cpu, WifiOff, DollarSign, Database } from "lucide-react";

interface WhyOpenSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyOpenSourceModal: React.FC<WhyOpenSourceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const pillars = [
    {
      icon: <ShieldAlert className="h-6 w-6 text-rose-500" />,
      title: "1. Health data stays private",
      tag: "Privacy",
      argument: "Food intolerances, thyroid levels, and weight goals are personal health information. The safety checks run on this app's own server with open rules, and the profile is stored only in your browser. Nothing is sent to an AI company for the food checks. The only third-party service is ElevenLabs, and only when you choose to use voice."
    },
    {
      icon: <Database className="h-6 w-6 text-amber-500" />,
      title: "2. Answers you can check",
      tag: "No made-up answers",
      argument: "Chatbots can sound confident while being wrong, for example by missing the barley malt in a sauce. Here every verdict comes from an open, readable list of ingredients and rules, so you can see exactly why a dish was flagged and correct the list if needed. An optional local open model (such as Google Gemma via Ollama) can be added on top."
    },
    {
      icon: <WifiOff className="h-6 w-6 text-emerald-500" />,
      title: "3. Runs anywhere, even without the cloud",
      tag: "Self-hostable",
      argument: "Because the food rules are open data, you can run the whole app on your own laptop or home network, with no paid AI API. It keeps working when a cloud AI service is down or changes its prices."
    },
    {
      icon: <DollarSign className="h-6 w-6 text-blue-500" />,
      title: "4. Free to use and improve",
      tag: "Open source",
      argument: "Friends and families shouldn't need a paid subscription to cook safely for someone they care about. Anyone can add dishes, ingredients, or conditions to the open lists and share them back."
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl sm:p-8 transition-colors">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Open Innovation Manifesto
          </span>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2 tracking-tight">
            Why this app is open source
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            What being open means for the people using it.
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

        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Open rules • Self-hostable • Profile stays in your browser</span>
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
