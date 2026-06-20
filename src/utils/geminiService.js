import { KB, detectTopic } from './tutorEngine';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ---------------------------------------------------------------------------
// Rate limiter — stay safely under the free-tier 15 RPM ceiling.
// ---------------------------------------------------------------------------
const RATE_LIMIT = 12; // max requests per 60-second window
const requestLog = []; // timestamps of recent requests

const checkRateLimit = () => {
  const now = Date.now();
  const cutoff = now - 60_000;
  // Drop timestamps outside the 60-second window
  while (requestLog.length && requestLog[0] < cutoff) requestLog.shift();
  if (requestLog.length >= RATE_LIMIT) {
    const retryIn = Math.ceil((requestLog[0] + 60_000 - now) / 1000);
    throw Object.assign(new Error('rate_limited'), { retryIn });
  }
  requestLog.push(now);
};

// ---------------------------------------------------------------------------
// Response cache — identical prompt + context = no second round-trip.
// ---------------------------------------------------------------------------
const CACHE_TTL = 5 * 60_000; // 5 minutes
const CACHE_MAX = 60;
const cache = new Map(); // key → { text, ts }

const cacheKey = (userText, context) =>
  `${context.level}:${context.activeInstrument}:${userText.trim().toLowerCase()}`;

const fromCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL) { cache.delete(key); return null; }
  return hit.text;
};

const toCache = (key, text) => {
  if (cache.size >= CACHE_MAX) {
    // Evict the oldest entry
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { text, ts: Date.now() });
};

// ---------------------------------------------------------------------------
// Gemini request helpers
// ---------------------------------------------------------------------------
const buildKBContext = (userText, activeInstrument) => {
  const topic = detectTopic(userText, activeInstrument);
  const entry = KB[topic];
  if (!entry) return '';
  const lines = [
    entry.beginner && `Beginner: ${entry.beginner}`,
    entry.intermediate && `Intermediate: ${entry.intermediate}`,
    entry.advanced && `Advanced: ${entry.advanced}`,
    entry.why && `Why it matters: ${entry.why}`,
    entry.example && `Example: ${entry.example}`,
  ].filter(Boolean).join('\n');
  return `\n\nThe app's existing knowledge base already covers this topic:\n${lines}\n\nBuild on this — add detail, nuance, or context not already covered. Do not repeat sentences that are already there verbatim.`;
};

const systemInstruction = (context, userText = '') => {
  const { level, activeInstrument, currentModule, overallMastery } = context;
  return (
    `You are a lab tutor inside an electronics workbench learning app called Adapt. ` +
    `The student has ${overallMastery ?? 0}% overall mastery and is at ${level} level. ` +
    `They are currently using the ${activeInstrument || 'workbench'} ` +
    `and studying the "${currentModule || 'Signal Behavior'}" module. ` +
    `Respond clearly and completely, plain text only (no markdown), matched to a ${level} learner. Use as many sentences as needed to fully answer the question.` +
    buildKBContext(userText, activeInstrument)
  );
};

// Keep only the last 6 messages to minimise token usage per request.
const toContents = (history, userText) => [
  ...history.slice(-6).map((m) => ({
    role: m.from === 'student' ? 'user' : 'model',
    parts: [{ text: m.text }],
  })),
  { role: 'user', parts: [{ text: userText }] },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const isGeminiEnabled = () => Boolean(API_KEY);

export const askGemini = async (userText, context, history = []) => {
  const key = cacheKey(userText, context);
  const cached = fromCache(key);
  if (cached) return cached;

  checkRateLimit(); // throws if over limit

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction(context, userText) }] },
      contents: toContents(history, userText),
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini ${res.status}`);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "I'm not sure — could you rephrase that?";

  toCache(key, text);
  return text;
};
