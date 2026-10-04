import {
  UserProfile,
  ScanResponse,
  RecipeRemixResponse,
  MealPlanResponse,
  ImageScanResult,
  AskContext,
  AskResponse,
  VoiceResponse,
  HealthResponse,
} from "../types";

export function getApiBase(): string {
  // Optional override for calling a backend directly from the browser.
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  // Default: same-origin path, proxied to the backend by the Next.js server
  // (see rewrites in next.config.ts). Works on localhost, LAN phones and Render.
  return "/api";
}

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Free hosting can take up to a minute to wake the server after it sleeps.
const DEFAULT_TIMEOUT_MS = 60_000;

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError("The server took too long to respond. Please try again.");
    }
    throw new ApiError("Couldn't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body?.detail === "string" ? body.detail : "";
    } catch {
      // Non-JSON error body.
    }
    if (res.status === 422) throw new ApiError("That input is too long or incomplete. Please shorten it and try again.", 422);
    if (res.status === 429) throw new ApiError(detail || "Too many requests. Please wait a few minutes.", 429);
    throw new ApiError(detail || `The server returned an error (${res.status}). Please try again.`, res.status);
  }
  return (await res.json()) as T;
}

function postJson<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(
    path,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    timeoutMs,
  );
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
}

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    return await request<HealthResponse>("/health", { cache: "no-store" });
  } catch {
    return null;
  }
}

export function scanIngredients(text: string, profile: UserProfile, dish_title?: string): Promise<ScanResponse> {
  return postJson<ScanResponse>("/scan", { text, profile, dish_title });
}

export function remixRecipe(
  title: string,
  original_ingredients: string[],
  profile: UserProfile,
  original_instructions?: string[],
): Promise<RecipeRemixResponse> {
  return postJson<RecipeRemixResponse>("/remix", { title, original_ingredients, original_instructions, profile });
}

export function generateMealPlan(days: number, profile: UserProfile): Promise<MealPlanResponse> {
  return postJson<MealPlanResponse>("/meal-plan", { days, roommate_profile: profile });
}

export function scanImage(imageBase64: string, profile: UserProfile, hintLabel?: string): Promise<ImageScanResult> {
  return postJson<ImageScanResult>("/scan-image", { image_base64: imageBase64, profile, hint_label: hintLabel || null });
}

export function askQuestion(message: string, profile: UserProfile, context?: AskContext): Promise<AskResponse> {
  return postJson<AskResponse>("/ask", { message, profile, context: context ?? null });
}

export function requestVoiceGuide(title: string, steps: string[], name: string): Promise<VoiceResponse> {
  return postJson<VoiceResponse>("/voice-guide", { title, steps, roommate_name: name });
}

export function speakText(text: string): Promise<VoiceResponse> {
  return postJson<VoiceResponse>("/speak", { text: text.slice(0, 700) });
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", audio, `question.${ext}`);
  const res = await request<{ text: string }>("/transcribe", { method: "POST", body: form });
  return res.text;
}
