import { VoiceResponse } from "../types";

// 0.01s of silence. Playing it inside a tap "unlocks" audio on iOS Safari, so
// the same element can play the ElevenLabs clip after the network request.
const SILENT_WAV = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

export function createUnlockedAudio(): HTMLAudioElement {
  const audio = new Audio(SILENT_WAV);
  audio.play().catch(() => {});
  return audio;
}

export function stopSpeech(audio: HTMLAudioElement | null): void {
  if (audio) audio.pause();
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Play an ElevenLabs clip on the pre-unlocked element, or fall back to the
 * browser's built-in voice. Calls onEnd when playback finishes.
 */
export async function playVoice(audio: HTMLAudioElement, voice: VoiceResponse, onEnd: () => void): Promise<void> {
  if (voice.audio_base64) {
    audio.pause();
    audio.src = `data:audio/mpeg;base64,${voice.audio_base64}`;
    audio.onended = onEnd;
    await audio.play();
    return;
  }
  speakWithBrowser(voice.script, onEnd);
}

export function speakWithBrowser(text: string, onEnd: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
}
