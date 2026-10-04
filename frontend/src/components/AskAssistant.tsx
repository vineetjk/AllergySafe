"use client";

import React, { useEffect, useRef, useState } from "react";
import { AskContext, AskResponse, HealthResponse, ImageScanResult, UserProfile } from "../types";
import { askQuestion, errorMessage, speakText, transcribeAudio } from "../lib/api";
import { createUnlockedAudio, playVoice, stopSpeech } from "../lib/audio";
import { useClientValue } from "../lib/store";
import { CameraScannerModal } from "./CameraScannerModal";
import { ConditionChip } from "./ProfileSheet";
import {
  ArrowUp, Mic, Square, Camera, Volume2, RefreshCw,
  CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight, Lightbulb, Utensils, Info, RotateCcw,
} from "lucide-react";

interface AskAssistantProps {
  profile: UserProfile;
  voice: HealthResponse["voice"] | null;
  onOpenProfile: () => void;
}

type ChatMessage =
  | { id: number; role: "user"; text: string; image?: string; viaVoice?: boolean }
  | { id: number; role: "assistant"; text: string; response?: AskResponse; isError?: boolean };

type NewMessage = ChatMessage extends infer M ? (M extends ChatMessage ? Omit<M, "id"> : never) : never;

type VoiceMode = "elevenlabs" | "browser" | "none";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

function getSpeechRecognition(): AnyRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const MAX_RECORDING_MS = 20_000;

const VERDICT_STYLE = {
  SAFE: {
    label: "Good to go",
    icon: CheckCircle2,
    cls: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  CAUTION: {
    label: "In moderation",
    icon: AlertTriangle,
    cls: "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  DANGER: {
    label: "Not safe",
    icon: AlertOctagon,
    cls: "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
} as const;

export const AskAssistant: React.FC<AskAssistantProps> = ({ profile, voice, onOpenProfile }) => {
  const name = profile.name;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<AskContext>({});
  const [notice, setNotice] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [voiceLoadingId, setVoiceLoadingId] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<AnyRecognition | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Browser capabilities are only known on the client.
  const canRecord = useClientValue(
    () => typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    false,
  );
  const hasRecognition = useClientValue(() => !!getSpeechRecognition(), false);
  const voiceMode: VoiceMode =
    voice?.speech_to_text && canRecord ? "elevenlabs" : hasRecognition ? "browser" : "none";

  // New answers scroll so their first line (the verdict) is at the top;
  // everything else keeps the newest content in view.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && !loading) {
      const node = el.querySelector<HTMLElement>(`[data-msg="${last.id}"]`);
      if (node) {
        el.scrollTo({ top: Math.max(0, node.offsetTop - 12), behavior: "smooth" });
        return;
      }
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading, transcribing]);

  // Stop audio and recording when leaving the tab.
  useEffect(() => {
    return () => {
      stopSpeech(audioRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      recognitionRef.current?.abort?.();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const push = (msg: NewMessage) => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...msg, id } as ChatMessage]);
    return id;
  };

  const speak = async (id: number, text: string, unlocked?: HTMLAudioElement) => {
    if (speakingId === id) {
      stopSpeech(audioRef.current);
      setSpeakingId(null);
      return;
    }
    stopSpeech(audioRef.current);
    const audio = unlocked ?? createUnlockedAudio();
    audioRef.current = audio;
    setVoiceLoadingId(id);
    try {
      const res = await speakText(text);
      setSpeakingId(id);
      await playVoice(audio, res, () => setSpeakingId((cur) => (cur === id ? null : cur)));
    } catch (err) {
      setSpeakingId(null);
      setNotice(errorMessage(err));
    } finally {
      setVoiceLoadingId(null);
    }
  };

  const send = async (text: string, opts: { viaVoice?: boolean; image?: string; display?: string; ctx?: AskContext } = {}) => {
    const question = text.trim();
    if (!question || loading) return;
    setNotice(null);
    push({ role: "user", text: opts.display ?? question, image: opts.image, viaVoice: opts.viaVoice });
    setInput("");
    setLoading(true);
    try {
      const res = await askQuestion(question, profile, opts.ctx ?? context);
      setContext(res.context ?? {});
      const id = push({ role: "assistant", text: res.reply, response: res });
      if (opts.viaVoice && voice?.text_to_speech) {
        // Reuse the element unlocked when the mic was tapped.
        void speak(id, res.reply, audioRef.current ?? undefined);
      }
    } catch (err) {
      push({ role: "assistant", text: errorMessage(err), isError: true });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Voice input ----------
  const stopRecording = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    recognitionRef.current?.stop?.();
  };

  const startRecording = async () => {
    setNotice(null);
    if (!window.isSecureContext) {
      setNotice("Voice input needs a secure (https) page. It works on the hosted site; on a local network, type your question instead.");
      return;
    }
    // Unlock audio during this tap so the spoken answer can play later on iOS.
    stopSpeech(audioRef.current);
    audioRef.current = createUnlockedAudio();

    if (voiceMode === "elevenlabs") {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setNotice("Microphone access was blocked. Allow it in your browser settings, or type your question.");
        return;
      }
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"].find(
        (t) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(t),
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
        if (blob.size < 1000) {
          setNotice("That recording was too short. Hold on a moment longer and try again.");
          return;
        }
        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text) await send(text, { viaVoice: true });
          else setNotice("I didn't catch that. Please try again or type your question.");
        } catch (err) {
          setNotice(errorMessage(err));
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      stopTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
      return;
    }

    if (voiceMode === "browser") {
      const Recognition = getSpeechRecognition();
      const recognition = new Recognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) void send(text, { viaVoice: true });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        setNotice(
          e?.error === "not-allowed"
            ? "Microphone access was blocked. Allow it in your browser settings, or type your question."
            : "I didn't catch that. Please try again or type your question.",
        );
      };
      recognition.onend = () => setRecording(false);
      recognitionRef.current = recognition;
      recognition.start();
      setRecording(true);
      return;
    }

    setNotice("Voice input isn't supported in this browser. Please type your question.");
  };

  // ---------- Photo input ----------
  const handlePhoto = (result: ImageScanResult, thumbnail: string) => {
    if (!result.identified || !result.detected_ingredients.length) return;
    void send(result.detected_ingredients.join(", "), {
      image: thumbnail,
      display: `Can ${name} eat this? (photo: ${result.dish_name})`,
      ctx: { pending_dish: result.dish_name },
    });
  };

  const prompts = [
    { emoji: "🍛", text: `Can ${name} eat paneer butter masala?` },
    { emoji: "🫓", text: `Is chole bhature okay for ${name}?` },
    { emoji: "☕", text: `Can ${name} have masala chai?` },
    { emoji: "🍳", text: `What can ${name} have for breakfast?` },
  ];

  const resetChat = () => {
    stopSpeech(audioRef.current);
    setSpeakingId(null);
    setMessages([]);
    setContext({});
    setNotice(null);
  };

  const busy = loading || transcribing;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation: the only scrolling area in this view */}
      <div ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-6 pt-2 sm:pt-6">
              <div>
                <h1 className="font-display text-[1.7rem] leading-tight sm:text-4xl font-semibold text-stone-900 dark:text-stone-50">
                  Can {name} eat this?
                </h1>
                <p className="mt-2 text-[15px] text-stone-600 dark:text-stone-300">
                  Ask about any dish. Type it, say it, or snap a photo, and I&apos;ll check it against {name}&apos;s needs.
                </p>
              </div>

              <button
                onClick={onOpenProfile}
                className="block w-full text-left rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 p-3.5 hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400">
                  Checking for {name}
                  <span className="text-emerald-700 dark:text-emerald-400">View</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {profile.allergies.map((a, i) => (
                    <ConditionChip key={`${a.name}-${i}`} item={a} />
                  ))}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prompts.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => send(p.text)}
                    disabled={busy}
                    className="flex items-center gap-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3.5 text-left text-sm text-stone-800 dark:text-stone-200 shadow-sm shadow-stone-200/40 dark:shadow-none hover:border-emerald-400 dark:hover:border-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xl" aria-hidden>
                      {p.emoji}
                    </span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={resetChat}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New chat
              </button>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} data-msg={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-emerald-700 text-white px-4 py-2.5 text-[15px] leading-relaxed">
                  {m.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt="Food photo" className="mb-2 h-28 w-28 rounded-2xl object-cover" />
                  )}
                  <span>{m.text}</span>
                  {m.viaVoice && <Mic className="inline h-3.5 w-3.5 ml-1.5 opacity-75" aria-label="asked by voice" />}
                </div>
              </div>
            ) : (
              <AssistantBubble
                key={m.id}
                id={m.id}
                message={m}
                speaking={speakingId === m.id}
                voiceLoading={voiceLoadingId === m.id}
                onSpeak={() => speak(m.id, m.text)}
              />
            ),
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
              <span className="flex gap-1" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-stone-400 animate-bounce" />
              </span>
              <span>{transcribing ? "Listening back..." : "Checking..."}</span>
            </div>
          )}
        </div>
      </div>

      {/* Composer: pinned to the bottom of the view */}
      <div className="shrink-0 border-t border-stone-200/80 dark:border-stone-800 bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 pt-2.5 pb-2.5 space-y-2">
          {notice && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}
          {context.pending_dish && !busy && (
            <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
              List what&apos;s in <strong>{context.pending_dish}</strong>, separated by commas.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-1.5 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
          >
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              disabled={busy || recording}
              aria-label="Check a food photo"
              title="Check a food photo"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={recording ? "Listening... tap stop when done" : "Ask about a dish..."}
              aria-label="Your question"
              disabled={recording}
              enterKeyHint="send"
              className="min-w-0 flex-1 bg-transparent px-1 text-[15px] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
            />
            {voiceMode !== "none" && (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={busy}
                aria-label={recording ? "Stop recording" : "Ask by voice"}
                title={recording ? "Stop recording" : "Ask by voice"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                  recording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
            <button
              type="submit"
              disabled={busy || recording || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer disabled:bg-stone-300 dark:disabled:bg-stone-700"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
          <p className="px-1 text-center text-[11px] text-stone-400 dark:text-stone-500">
            General guidance, not medical advice.
          </p>
        </div>
      </div>

      <CameraScannerModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        profile={profile}
        onScanComplete={handlePhoto}
      />
    </div>
  );
};

function AssistantBubble({
  id,
  message,
  speaking,
  voiceLoading,
  onSpeak,
}: {
  id: number;
  message: Extract<ChatMessage, { role: "assistant" }>;
  speaking: boolean;
  voiceLoading: boolean;
  onSpeak: () => void;
}) {
  const r = message.response;
  const verdict = r?.verdict ? VERDICT_STYLE[r.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <div data-msg={id} className="flex justify-start">
      <div
        className={`w-full sm:max-w-[90%] rounded-3xl rounded-bl-lg border px-4 py-3.5 text-[15px] space-y-3.5 shadow-sm shadow-stone-200/40 dark:shadow-none ${
          message.isError
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
            : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 text-stone-800 dark:text-stone-100"
        }`}
      >
        {verdict && VerdictIcon && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${verdict.cls}`}>
            <VerdictIcon className="h-3.5 w-3.5" />
            {verdict.label}
          </span>
        )}
        <p className="leading-relaxed">{message.text}</p>

        {r && r.concerns.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">Why</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-stone-700 dark:text-stone-300">
              {r.concerns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {r && r.swaps.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">Easy swaps</h4>
            <ul className="space-y-1.5 text-sm">
              {r.swaps.map((s) => (
                <li key={s.ingredient} className="flex flex-wrap items-center gap-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2">
                  <span className="text-stone-500 dark:text-stone-400 line-through">{s.ingredient}</span>
                  <ArrowRight className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">{s.swap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {r && r.suggestions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              {r.verdict ? "Better options" : "Ideas"}
            </h4>
            <ul className="space-y-1.5">
              {r.suggestions.map((s) => (
                <li key={s.title} className="flex items-start gap-2 text-sm">
                  <Utensils className="h-3.5 w-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-stone-900 dark:text-stone-100">{s.title}</strong>
                    <span className="text-stone-600 dark:text-stone-400">: {s.why}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {r && r.tips.length > 0 && (
          <ul className="space-y-1">
            {r.tips.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}

        {r && r.assumed_ingredients.length > 0 && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Typical ingredients assumed: {r.assumed_ingredients.join(", ")}.
          </p>
        )}

        {!message.isError && (
          <button
            onClick={onSpeak}
            disabled={voiceLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-60"
          >
            {voiceLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : speaking ? (
              <Square className="h-3 w-3 fill-current" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
            {speaking ? "Stop" : "Listen"}
          </button>
        )}
      </div>
    </div>
  );
}
