"use client";

import React, { useEffect, useState } from "react";
import { UserProfile, AllergenItem, Severity, SEVERITY_LABELS } from "../types";
import { X, Plus, RotateCcw, Pencil, Target, Activity, AlertTriangle, Droplet } from "lucide-react";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetProfile: () => void;
}

const TONE: Record<Severity, { chip: string; icon: typeof Target }> = {
  anaphylactic: { chip: "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200", icon: AlertTriangle },
  severe: { chip: "bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200", icon: AlertTriangle },
  intolerance: { chip: "bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200", icon: Droplet },
  moderate: { chip: "bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200", icon: Activity },
  preference: { chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200", icon: Target },
};

export function ConditionChip({ item }: { item: AllergenItem }) {
  const tone = TONE[item.severity] ?? TONE.moderate;
  const Icon = tone.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone.chip}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {item.name}
    </span>
  );
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ open, onClose, profile, onUpdateProfile, onResetProfile }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [relationship, setRelationship] = useState(profile.relationship);
  const [items, setItems] = useState<AllergenItem[]>(profile.allergies);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newSeverity, setNewSeverity] = useState<Severity>("intolerance");

  // Close with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startEditing = () => {
    setName(profile.name);
    setRelationship(profile.relationship);
    setItems(profile.allergies);
    setNewName("");
    setNewNotes("");
    setEditing(true);
  };

  const close = () => {
    setEditing(false);
    onClose();
  };

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    setItems([...items, { name: n.slice(0, 60), severity: newSeverity, notes: newNotes.trim().slice(0, 500) }]);
    setNewName("");
    setNewNotes("");
  };

  const save = () => {
    onUpdateProfile({
      ...profile,
      name: name.trim().slice(0, 40) || profile.name,
      relationship: relationship.trim().slice(0, 60),
      allergies: items,
    });
    setEditing(false);
  };

  const field =
    "w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/50 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-stone-900 shadow-2xl">
        {/* Grab handle on phones */}
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-stone-200 dark:bg-stone-700" aria-hidden />

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white font-display text-lg font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 id="profile-title" className="font-display text-xl font-semibold text-stone-900 dark:text-stone-50 truncate">
                {editing ? "Edit profile" : `${profile.name}'s food profile`}
              </h2>
              {!editing && profile.relationship && (
                <p className="text-sm text-stone-500 dark:text-stone-400">{profile.relationship}</p>
              )}
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-5 space-y-4">
          {!editing ? (
            <>
              <ul className="space-y-2.5">
                {profile.allergies.length === 0 && (
                  <li className="text-sm text-stone-500">No allergies or conditions added yet.</li>
                )}
                {profile.allergies.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ConditionChip item={a} />
                      <span className="text-xs text-stone-500 dark:text-stone-400">{SEVERITY_LABELS[a.severity]}</span>
                    </div>
                    {a.notes && <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{a.notes}</p>}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Saved only on this device. General guidance, not medical advice.
              </p>
              <button
                onClick={startEditing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 px-4 py-3 text-sm font-semibold text-white dark:text-stone-900 hover:opacity-90 cursor-pointer"
              >
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-300">Name</span>
                  <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className={field} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-stone-600 dark:text-stone-300">Relationship</span>
                  <input value={relationship} maxLength={60} onChange={(e) => setRelationship(e.target.value)} className={field} />
                </label>
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium text-stone-600 dark:text-stone-300">Allergies, conditions, and goals</span>
                <div className="flex flex-wrap gap-2">
                  {items.length === 0 && <span className="text-sm text-stone-400">None yet.</span>}
                  {items.map((a, i) => (
                    <span key={`${a.name}-e-${i}`} className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-800 pl-3 pr-1 py-1 text-xs font-medium text-stone-800 dark:text-stone-200">
                      {a.name}
                      <button
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${a.name}`}
                        className="rounded-full p-1 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-2.5">
                <span className="block text-xs font-medium text-stone-600 dark:text-stone-300">Add another</span>
                <input
                  value={newName}
                  maxLength={60}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Peanuts, Sensitive gut, High TSH"
                  aria-label="Name of allergy or condition"
                  className={field}
                />
                <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value as Severity)} aria-label="Type" className={field}>
                  <option value="anaphylactic">Anaphylactic allergy</option>
                  <option value="severe">Severe allergy</option>
                  <option value="intolerance">Intolerance</option>
                  <option value="moderate">Health condition</option>
                  <option value="preference">Health goal</option>
                </select>
                <input
                  value={newNotes}
                  maxLength={500}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  aria-label="Notes"
                  className={field}
                />
                <button
                  onClick={add}
                  disabled={!newName.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Understands gluten, tree nuts, peanuts, dairy or lactose, soy, eggs, shellfish, sesame, gut, thyroid, and weight goals.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => {
                    onResetProfile();
                    close();
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Reset to default
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
