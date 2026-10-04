"use client";

import React, { useState } from "react";
import { createLocalStore, useLocalStore } from "../lib/store";
import { UserProfile } from "../types";
import { Send, Trash2, ThumbsUp, ThumbsDown, Meh } from "lucide-react";

interface HandoverFeedbackProps {
  profile: UserProfile;
}

type Reaction = "loved" | "okay" | "avoid";

interface Note {
  id: string;
  dish: string;
  reaction: Reaction;
  text: string;
  date: string;
}

const STORAGE_KEY = "allergysafe.notes.v1";

const REACTIONS: Array<{ value: Reaction; label: string; icon: typeof ThumbsUp; cls: string }> = [
  { value: "loved", label: "Loved it", icon: ThumbsUp, cls: "text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50" },
  { value: "okay", label: "It was okay", icon: Meh, cls: "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50" },
  { value: "avoid", label: "Didn't sit well", icon: ThumbsDown, cls: "text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50" },
];

const notesStore = createLocalStore<Note[]>(STORAGE_KEY, [], {
  validate: (v): v is Note[] => Array.isArray(v),
});

export const HandoverFeedback: React.FC<HandoverFeedbackProps> = ({ profile }) => {
  const notes = useLocalStore(notesStore);
  const [dish, setDish] = useState("");
  const [text, setText] = useState("");
  const [reaction, setReaction] = useState<Reaction>("loved");

  const update = (next: Note[]) => notesStore.set(next);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dish.trim() && !text.trim()) return;
    const note: Note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dish: dish.trim().slice(0, 120) || "General note",
      reaction,
      text: text.trim().slice(0, 1000),
      date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    };
    update([note, ...notes]);
    setDish("");
    setText("");
  };

  const inputCls =
    "w-full text-base sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 px-3 py-2 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 shadow-sm shadow-stone-200/40 dark:shadow-none transition-colors">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={dish}
            onChange={(e) => setDish(e.target.value)}
            maxLength={120}
            placeholder="Dish (e.g. Moong dal khichdi)"
            aria-label="Dish"
            className={inputCls}
          />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How did it go?">
            {REACTIONS.map((r) => {
              const Icon = r.icon;
              const active = reaction === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setReaction(r.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    active ? r.cls : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {r.label}
                </button>
              );
            })}
          </div>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="What worked or didn't? (e.g. lactose-free curd was fine, too spicy, wants it again)"
            aria-label="Note"
            className={inputCls}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!dish.trim() && !text.trim()}
              className="flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Save note
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-center text-xs text-stone-400 dark:text-stone-500 py-6">
            No notes yet. Add one after you cook something for {profile.name}.
          </p>
        ) : (
          notes.map((n) => {
            const r = REACTIONS.find((x) => x.value === n.reaction) ?? REACTIONS[1];
            const Icon = r.icon;
            return (
              <div
                key={n.id}
                className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{n.dish}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.cls}`}>
                        <Icon className="h-3 w-3" />
                        {r.label}
                      </span>
                    </div>
                    {n.text && <p className="mt-1.5 text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">{n.text}</p>}
                    <span className="mt-1 block text-[10px] text-stone-400">{n.date}</span>
                  </div>
                  <button
                    onClick={() => update(notes.filter((x) => x.id !== n.id))}
                    aria-label={`Delete note about ${n.dish}`}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
