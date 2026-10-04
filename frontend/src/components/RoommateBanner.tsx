"use client";

import React, { useState } from "react";
import { UserProfile, AllergenItem, Severity, SEVERITY_LABELS } from "../types";
import { AlertTriangle, Heart, Settings, Plus, X, ChevronDown, ChevronUp, RotateCcw, Target, Activity } from "lucide-react";

interface RoommateBannerProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetProfile: () => void;
}

const BADGE_STYLE: Record<Severity, string> = {
  anaphylactic: "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/60",
  severe: "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/60",
  moderate: "bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-900/60",
  intolerance: "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900/60",
  preference: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60",
};

function BadgeIcon({ severity }: { severity: Severity }) {
  if (severity === "preference") return <Target className="h-3 w-3 shrink-0" />;
  if (severity === "moderate") return <Activity className="h-3 w-3 shrink-0" />;
  return <AlertTriangle className="h-3 w-3 shrink-0" />;
}

export const RoommateBanner: React.FC<RoommateBannerProps> = ({ profile, onUpdateProfile, onResetProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedRelationship, setEditedRelationship] = useState(profile.relationship);
  const [allergies, setAllergies] = useState<AllergenItem[]>(profile.allergies);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newSeverity, setNewSeverity] = useState<Severity>("intolerance");

  const openEditor = () => {
    // Start from the current profile every time the editor opens.
    setEditedName(profile.name);
    setEditedRelationship(profile.relationship);
    setAllergies(profile.allergies);
    setNewName("");
    setNewNotes("");
    setIsEditing(true);
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    setAllergies([...allergies, { name: name.slice(0, 60), severity: newSeverity, notes: newNotes.trim().slice(0, 500) }]);
    setNewName("");
    setNewNotes("");
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      name: editedName.trim().slice(0, 40) || profile.name,
      relationship: editedRelationship.trim().slice(0, 60),
      allergies,
    });
    setIsEditing(false);
  };

  const inputCls =
    "w-full text-base sm:text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-900 dark:text-stone-100 focus:border-emerald-500 focus:outline-none";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-gradient-to-r from-amber-50/60 via-stone-50 to-emerald-50/50 dark:from-stone-900 dark:via-stone-900/90 dark:to-emerald-950/30 p-4 sm:p-5 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-lg sm:text-xl shadow-md shadow-emerald-200 dark:shadow-none">
            {profile.name.charAt(0).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-white dark:ring-stone-900">
              <Heart className="h-3 w-3 fill-current" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight truncate">
                Cooking for {profile.name}
              </h2>
              {profile.relationship && (
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium shrink-0">
                  {profile.relationship}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              aria-expanded={showDetails}
            >
              {showDetails ? "Hide what each one means" : "See what each one means"}
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {profile.allergies.map((a, idx) => (
            <span
              key={`${a.name}-${idx}`}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold ${BADGE_STYLE[a.severity] ?? BADGE_STYLE.moderate}`}
              title={SEVERITY_LABELS[a.severity]}
            >
              <BadgeIcon severity={a.severity} />
              <span>{a.name}</span>
            </span>
          ))}
          <button
            onClick={() => (isEditing ? setIsEditing(false) : openEditor())}
            className="flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
            <span>{isEditing ? "Close" : "Edit profile"}</span>
          </button>
        </div>
      </div>

      {showDetails && !isEditing && (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {profile.allergies.map((a, idx) => (
            <li
              key={`${a.name}-detail-${idx}`}
              className="rounded-xl bg-white/80 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-stone-900 dark:text-stone-100">{a.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {SEVERITY_LABELS[a.severity]}
                </span>
              </div>
              {a.notes && <p className="mt-1 text-stone-600 dark:text-stone-300 leading-relaxed">{a.notes}</p>}
            </li>
          ))}
        </ul>
      )}

      {isEditing && (
        <div className="mt-4 pt-4 border-t border-stone-200/70 dark:border-stone-800 bg-white/70 dark:bg-stone-800/80 p-3.5 sm:p-4 rounded-xl space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Changes are saved only in this browser. Nobody else using the app sees them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="pf-name" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Name</label>
              <input id="pf-name" type="text" value={editedName} maxLength={40} onChange={(e) => setEditedName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="pf-rel" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Relationship</label>
              <input id="pf-rel" type="text" value={editedRelationship} maxLength={60} onChange={(e) => setEditedRelationship(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Allergies, conditions, and goals</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
              {allergies.length === 0 && <span className="text-xs text-stone-400">None yet.</span>}
              {allergies.map((a, i) => (
                <span
                  key={`${a.name}-edit-${i}`}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-800 dark:text-stone-200"
                >
                  {a.name} <span className="text-stone-400">({SEVERITY_LABELS[a.severity]})</span>
                  <button
                    onClick={() => setAllergies(allergies.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${a.name}`}
                    className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <input
                type="text"
                placeholder="e.g. Peanuts, Sensitive gut, High TSH, Weight loss goal"
                value={newName}
                maxLength={60}
                onChange={(e) => setNewName(e.target.value)}
                className={inputCls}
                aria-label="New allergy or condition"
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as Severity)}
                className={inputCls}
                aria-label="Type"
              >
                <option value="anaphylactic">Anaphylactic allergy</option>
                <option value="severe">Severe allergy</option>
                <option value="intolerance">Intolerance</option>
                <option value="moderate">Health condition</option>
                <option value="preference">Health goal</option>
              </select>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={newNotes}
                maxLength={500}
                onChange={(e) => setNewNotes(e.target.value)}
                className={inputCls}
                aria-label="Notes"
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="flex items-center justify-center gap-1 bg-stone-800 dark:bg-stone-700 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-stone-700 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
              Recognised: gluten, tree nuts, peanuts, dairy or lactose, soy, eggs, shellfish, sesame, sensitive gut, thyroid / TSH, and weight goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => {
                onResetProfile();
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to default
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                Save profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
