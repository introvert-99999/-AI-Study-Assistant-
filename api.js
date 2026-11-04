// api.js - build the prompt, call the AI (Google Gemini), validate the reply.
const MODEL = "gemini-2.5-flash"; // change here if Google renames the model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 1. Prompt: ask for JSON only, in a fixed shape.
export function buildPrompt(notes, style, level) {
  return `You are a study assistant. Use the notes below (they may be just a topic).
Reply with ONLY valid JSON in exactly this shape:
{"summary":"...","quiz":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}],"flashcards":[{"front":"...","back":"..."}]}
Rules: summary is ${style}, in short paragraphs separated by blank lines. Exactly 5 quiz questions of ${level} difficulty, 4 options each, answerIndex is 0-3. 6 to 8 flashcards.
Notes:
"""${notes}"""`;
}

// 2. Request: POST with headers and a JSON body.
export async function generate(key, notes, style, level) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(notes, style, level) }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
  } catch {
    throw new Error("Network error. Check your internet connection and try again.");
  }
  if (!res.ok) throw new Error(httpMessage(res.status));

  const json = await res.json().catch(() => null);
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  return parseReply(parts.map((p) => p.text || "").join(""));
}

// 3. Friendly message for each HTTP status.
function httpMessage(status) {
  if (status === 400 || status === 401 || status === 403)
    return `The API key was rejected (HTTP ${status}). Check that you pasted it correctly in Settings.`;
  if (status === 429) return "Rate limit reached (HTTP 429). Wait a minute, then try again.";
  if (status >= 500) return `The AI service is having problems (HTTP ${status}). Try again later.`;
  return `Request failed (HTTP ${status}).`;
}

// 4. Parse and validate: never trust the AI's format.
export function parseReply(text) {
  const bad = () => new Error("The AI sent a reply in the wrong format. Please click Generate again.");
  let d;
  try { d = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()); }
  catch { throw bad(); }

  const okQuestion = (q) => q && typeof q.question === "string" && Array.isArray(q.options) &&
    q.options.length >= 2 && q.options.every((o) => typeof o === "string") &&
    Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < q.options.length;
  const okCard = (c) => c && typeof c.front === "string" && typeof c.back === "string";

  if (typeof d?.summary !== "string" || !d.summary.trim() ||
      !Array.isArray(d.quiz) || !d.quiz.length || !d.quiz.every(okQuestion) ||
      !Array.isArray(d.flashcards) || !d.flashcards.length || !d.flashcards.every(okCard)) throw bad();

  return { summary: d.summary, quiz: d.quiz.slice(0, 5), flashcards: d.flashcards };
}