"use client";

import React, { useEffect, useRef, useState } from "react";
import { AskContext, AskResponse, HealthResponse, ImageScanResult, UserProfile } from "../types";
import { askQuestion, errorMessage, speakText, transcribeAudio } from "../lib/api";
import { createUnlockedAudio, playVoice, stopSpeech } from "../lib/audio";
import { useClientValue } from "../lib/store";
import { CameraScannerModal } from "./CameraScannerModal";
import {
  MessageCircleQuestion, Send, Mic, Square, Camera, Volume2, RefreshCw,
  CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight, Lightbulb, Utensils, Info,
} from "lucide-react";

interface AskAssistantProps {
  profile: UserProfile;
  voice: HealthResponse["voice"] | null;
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

export const AskAssistant: React.FC<AskAssistantProps> = ({ profile, voice }) => {
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

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
    `Can ${name} eat paneer butter masala?`,
    `Is chole bhature okay for ${name}?`,
    `Can ${name} have masala chai?`,
    `What can ${name} have for breakfast?`,
    `Suggest a healthy evening snack`,
  ];

  const busy = loading || transcribing;

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm transition-colors">
      <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Ask: Can {name} eat this?</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Type, speak, or snap a photo. Answers are checked against {name}&apos;s profile and can be read aloud.
        </p>
      </div>

      {/* Conversation */}
      <div
        ref={listRef}
        className="max-h-[60vh] min-h-[220px] overflow-y-auto p-4 sm:p-6 space-y-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  disabled={busy}
                  className="text-left text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600 text-white px-4 py-2.5 text-sm">
                {m.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image} alt="Food photo" className="mb-2 h-24 w-24 rounded-lg object-cover" />
                )}
                <span>{m.text}</span>
                {m.viaVoice && <Mic className="inline h-3 w-3 ml-1.5 opacity-75" aria-label="asked by voice" />}
              </div>
            </div>
          ) : (
            <AssistantBubble
              key={m.id}
              message={m}
              speaking={speakingId === m.id}
              voiceLoading={voiceLoadingId === m.id}
              onSpeak={() => speak(m.id, m.text)}
            />
          ),
        )}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>{transcribing ? "Listening back to your question..." : "Checking..."}</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-100 dark:border-stone-800 p-3 sm:p-4 space-y-2">
        {notice && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {context.pending_dish && !busy && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Tell me what&apos;s in <strong>{context.pending_dish}</strong>, separated by commas.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={busy || recording}
            aria-label="Check a food photo"
            title="Check a food photo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Camera className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder={recording ? "Listening... tap stop when done" : `Ask about a dish for ${name}...`}
            aria-label="Your question"
            disabled={recording}
            className="min-w-0 flex-1 h-11 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 text-base sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-none"
          />
          {voiceMode !== "none" && (
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={busy}
              aria-label={recording ? "Stop recording" : "Ask by voice"}
              title={recording ? "Stop recording" : "Ask by voice"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                recording
                  ? "bg-rose-600 text-white animate-pulse"
                  : "border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
            >
              {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button
            type="submit"
            disabled={busy || recording || !input.trim()}
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          General food guidance, not medical advice. For thyroid and gut issues, follow {name}&apos;s doctor or dietitian.
        </p>
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
  message,
  speaking,
  voiceLoading,
  onSpeak,
}: {
  message: Extract<ChatMessage, { role: "assistant" }>;
  speaking: boolean;
  voiceLoading: boolean;
  onSpeak: () => void;
}) {
  const r = message.response;
  const verdict = r?.verdict ? VERDICT_STYLE[r.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-bl-md border px-4 py-3 text-sm space-y-3 ${
          message.isError
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            : "bg-stone-50 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
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
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Why</h4>
            <ul className="list-disc pl-5 space-y-0.5 text-xs text-stone-700 dark:text-stone-300">
              {r.concerns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {r && r.swaps.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Easy swaps</h4>
            <ul className="space-y-1 text-xs">
              {r.swaps.map((s) => (
                <li key={s.ingredient} className="flex flex-wrap items-center gap-1.5">
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
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
              {r.verdict ? "Better options" : "Ideas"}
            </h4>
            <ul className="space-y-1.5">
              {r.suggestions.map((s) => (
                <li key={s.title} className="flex items-start gap-2 text-xs">
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
              <li key={t} className="flex items-start gap-2 text-xs text-stone-600 dark:text-stone-400">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}

        {r && r.assumed_ingredients.length > 0 && (
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Typical ingredients assumed: {r.assumed_ingredients.join(", ")}.
          </p>
        )}

        {!message.isError && (
          <button
            onClick={onSpeak}
            disabled={voiceLoading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer disabled:opacity-60"
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
