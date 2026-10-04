"use client";

import React, { useState } from "react";
import { UserProfile } from "../types";
import { MessageSquareHeart, Quote, Heart, CheckCircle2, Send, ThumbsUp } from "lucide-react";

interface HandoverFeedbackProps {
  profile: UserProfile;
}

export const HandoverFeedback: React.FC<HandoverFeedbackProps> = ({ profile }) => {
  const [userComment, setUserComment] = useState("");
  const [commentList, setCommentList] = useState([
    {
      author: "Maya (Roommate)",
      role: "Recipient & Taste-Tester",
      text: "I used to feel so guilty every time we talked about ordering dinner or grocery shopping because my Celiac and tree nut allergies make everything ten times harder. Seeing you build something that treats my safety as the default—and gives us dinners that actually taste incredible—made me tear up. For the first time, I don’t feel like a burden at our dinner table.",
      date: "Saturday, 8:45 PM"
    }
  ]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    setCommentList([
      ...commentList,
      {
        author: "Roommate Friend",
        role: "Community Tester",
        text: userComment.trim(),
        date: "Just now"
      }
    ]);
    setUserComment("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Handover Story Card */}
      <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 via-white to-amber-50/30 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
            <Heart className="h-4 w-4 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              The Handover: Giving AllergySafe Table to {profile.name}
            </h3>
            <p className="text-xs text-stone-500">
              Field testing in our apartment kitchen on Thursday night
            </p>
          </div>
        </div>

        <div className="relative rounded-xl bg-white p-5 border border-stone-200 shadow-2xs mt-4">
          <Quote className="absolute top-3 right-3 h-8 w-8 text-rose-200" />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 text-sm">Maya</span>
                <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                  Verified Roommate
                </span>
                <span className="text-xs text-stone-400">Oct 3, 2026</span>
              </div>
              <p className="text-xs text-stone-700 mt-2 leading-relaxed italic">
                "{commentList[0].text}"
              </p>
            </div>
          </div>
        </div>

        {/* Before vs After Impact Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Before AllergySafe Table:
            </h4>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
              <li>45-minute panics reading ingredient labels with magnifying glasses</li>
              <li>Cooking in two separate, depressing mini-skillets to avoid cross-contact</li>
              <li>Constant mental exhaustion and fear of accidental ER visits</li>
              <li>Maya felt like an "inconvenient roommate" whenever friends came over</li>
            </ul>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
              After (With Local Open-Source AI):
            </h4>
            <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-4 font-medium">
              <li>Instant 0.2s ingredient audit highlighting sneaky malt extract & derivatives</li>
              <li>1:1 chef-grade replacements (Tamari, sunflower creams, coconut aminos)</li>
              <li>A single shared table where both roommates eat the exact same meal</li>
              <li>100% private: Maya's sensitive medical conditions stay off cloud servers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Community / Roommate Notes Widget */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h4 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4 text-rose-500" />
          <span>Roommate Feedback & Kitchen Notes</span>
        </h4>
        <p className="text-xs text-stone-500 mb-4">
          Leave notes on recipe modifications or how your household handles food allergies.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={2}
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="Write a quick note, reaction, or substitute tip..."
            className="w-full text-xs rounded-xl border border-stone-200 p-3 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex justify-between items-center">
            {submitted && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Note saved!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" /> Post Note
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 space-y-3 pt-4 border-t border-stone-100">
          {commentList.map((c, i) => (
            <div key={i} className="text-xs p-3 rounded-xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between font-bold text-stone-800 mb-1">
                <span>{c.author}</span>
                <span className="text-[10px] text-stone-400 font-normal">{c.date}</span>
              </div>
              <p className="text-stone-600 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
