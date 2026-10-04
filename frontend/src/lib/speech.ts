import type { AskResponse } from "../types";

// Longest text sent for speech; matches the server's limit.
export const MAX_SPOKEN_CHARS = 1500;

// Make symbols read naturally: "1-2" as "1 to 2", "eggs / chicken" as "eggs or chicken".
const forSpeech = (text: string) =>
  text.replace(/(\d)\s*-\s*(\d)/g, "$1 to $2").replace(/\s+\/\s+/g, " or ").replace(/\s*&\s*/g, " and ");

const sentence = (text: string) => {
  const t = forSpeech(text.trim());
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

// Swaps that already start with an instruction ("Cut the sugar...") read as "For sugar, cut...".
const STARTS_WITH_VERB = /^(cut|keep|make|use|add|try|skip|choose|swap|sweeten|reduce|replace|limit|go|have)\b/i;

function spokenSwap(ingredient: string, swap: string): string {
  const what = ingredient.toLowerCase();
  const lower = swap.charAt(0).toLowerCase() + swap.slice(1);
  return STARTS_WITH_VERB.test(swap) ? sentence(`For ${what}, ${lower}`) : sentence(`Instead of ${what}, use ${lower}`);
}

/** Everything shown in an answer, written to be read aloud. */
export function spokenAnswer(r: AskResponse): string {
  const parts: string[] = [sentence(r.reply)];
  if (r.concerns.length) parts.push(`Here's why. ${r.concerns.map(sentence).join(" ")}`);
  if (r.swaps.length) {
    parts.push(
      `Easy swaps. ${r.swaps.map((s) => spokenSwap(s.ingredient, s.swap)).join(" ")}`,
    );
  }
  if (r.suggestions.length) {
    parts.push(`${r.verdict ? "Better options" : "Ideas"}. ${r.suggestions.map((s) => `${sentence(s.title)} ${sentence(s.why)}`).join(" ")}`);
  }
  if (r.tips.length) parts.push(r.tips.map(sentence).join(" "));

  // Keep whole sentences within the limit.
  let text = "";
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part;
    if (next.length > MAX_SPOKEN_CHARS) break;
    text = next;
  }
  return text || r.reply.slice(0, MAX_SPOKEN_CHARS);
}
