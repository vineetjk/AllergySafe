"use client";

import React, { useState } from "react";
import { UserProfile, AllergenItem } from "../types";
import { AlertTriangle, Heart, User, ShieldCheck, Settings, Plus, X } from "lucide-react";

interface RoommateBannerProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const RoommateBanner: React.FC<RoommateBannerProps> = ({ profile, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedRelationship, setEditedRelationship] = useState(profile.relationship);
  const [allergies, setAllergies] = useState<AllergenItem[]>(profile.allergies);
  const [newAllergenName, setNewAllergenName] = useState("");
  const [newSeverity, setNewSeverity] = useState<"anaphylactic" | "severe" | "moderate" | "intolerance">("severe");

  const handleAddAllergen = () => {
    if (!newAllergenName.trim()) return;
    setAllergies([...allergies, { name: newAllergenName.trim(), severity: newSeverity }]);
    setNewAllergenName("");
  };

  const handleRemoveAllergen = (idx: number) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      name: editedName,
      relationship: editedRelationship,
      allergies
    });
    setIsEditing(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-r from-amber-50/60 via-stone-50 to-emerald-50/50 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Persona info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xl shadow-md shadow-emerald-200">
            {profile.name.charAt(0)}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white ring-2 ring-white">
              <Heart className="h-3 w-3 fill-current" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">Cooking for {profile.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700 font-medium">
                {profile.relationship}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Personalized co-living dining profile • Real-time allergen guardrails active
            </p>
          </div>
        </div>

        {/* Right: Allergen Badges + Edit Button */}
        <div className="flex flex-wrap items-center gap-2">
          {profile.allergies.map((allergy, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs ${
                allergy.severity === "anaphylactic"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : allergy.severity === "severe"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{allergy.name}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-75 font-mono">
                ({allergy.severity})
              </span>
            </div>
          ))}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer ml-1"
          >
            <Settings className="h-3.5 w-3.5 text-stone-500" />
            <span>{isEditing ? "Close" : "Edit Profile"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Edit Drawer */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-stone-200/70 bg-white/70 p-4 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            Modify Roommate Medical & Dietary Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Friend / Roommate Name</label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Relationship</label>
              <input
                type="text"
                value={editedRelationship}
                onChange={(e) => setEditedRelationship(e.target.value)}
                className="w-full text-sm rounded-lg border border-stone-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-stone-700 mb-1">Active Allergies & Conditions</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allergies.map((all, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-xs font-medium text-stone-800"
                >
                  {all.name} ({all.severity})
                  <button onClick={() => handleRemoveAllergen(i)} className="text-stone-400 hover:text-rose-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Shellfish, Sesame, Nightshades"
                value={newAllergenName}
                onChange={(e) => setNewAllergenName(e.target.value)}
                className="text-xs rounded-lg border border-stone-300 px-3 py-1.5 flex-1 focus:border-emerald-500 focus:outline-none"
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as any)}
                className="text-xs rounded-lg border border-stone-300 px-2 py-1.5 bg-white focus:outline-none"
              >
                <option value="anaphylactic">Anaphylactic (EpiPen)</option>
                <option value="severe">Severe / Celiac</option>
                <option value="moderate">Moderate</option>
                <option value="intolerance">Intolerance</option>
              </select>
              <button
                onClick={handleAddAllergen}
                className="flex items-center gap-1 bg-stone-800 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-stone-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
