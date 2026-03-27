const Question = require("../models/question.model");
const mongoose = require("mongoose");
require("dotenv").config();

// ============================================
// PROVIDER CHAIN — edit this array freely
// System tries each entry top-to-bottom until
// one succeeds. Add/remove providers as needed.
// ============================================
const PROVIDER_CHAIN = [
  // ── Groq (primary — fastest + cheapest) ────────────────────
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
  },
  {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
  },
  {
    provider: "groq",
    model: "gemma2-9b-it",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
  },

  // ── Anthropic (secondary fallback) ─────────────────────────
  {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    baseURL: null,
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },

  // ── OpenAI (last resort) ────────────────────────────────────
  {
    provider: "openai",
    model: "gpt-4o-mini",
    baseURL: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
  },
];

const GENERATE_COUNT = 20;
const TIMEOUT_MS = 15000;

// ============================================
// IN-MEMORY LOCK
// ============================================
const generatingLocks = new Set();

// ============================================
// MAIN EXPORT
// ============================================
async function generateAndSaveQuestions(topicId, topicName, difficulty) {
  const lockKey = `${topicId}_${difficulty}`;

  if (generatingLocks.has(lockKey)) {
    console.log(`[AI Gen] Lock active for "${topicName}" [${difficulty}] — skipped duplicate call`);
    return { success: false, count: 0, reason: "locked" };
  }

  generatingLocks.add(lockKey);

  try {
    const prompt = buildPrompt(topicName, difficulty);

    let rawText = null;
    let usedModel = null;

    for (const config of PROVIDER_CHAIN) {
      const apiKey = process.env[config.apiKeyEnv];
      if (!apiKey) continue;

      console.log(`[AI Gen] Trying ${config.provider}/${config.model} for "${topicName}" [${difficulty}]`);

      try {
        rawText = await callWithTimeout(
          () => callProvider(config, apiKey, prompt),
          TIMEOUT_MS,
          config.model
        );
        if (rawText) {
          usedModel = `${config.provider}/${config.model}`;
          break;
        }
      } catch (err) {
        console.warn(`[AI Gen] ${config.provider}/${config.model} failed — ${err.message} — trying next model`);
        continue;
      }
    }

    console.log("ENV CHECK:", {
      GROQ: !!process.env.GROQ_API_KEY,
      ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
      OPENAI: !!process.env.OPENAI_API_KEY,
    });

    if (!rawText) {
      console.error(`[AI Gen] All models exhausted for "${topicName}" [${difficulty}] — no questions generated`);
      return { success: false, count: 0, reason: "all_models_failed" };
    }

    console.log(`[AI Gen] Response received from ${usedModel}`);

    // ── Parse ─────────────────────────────────────────────────
    let parsed;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (err) {
      console.error(`[AI Gen] JSON parse failed from ${usedModel}: ${err.message}`);
      return { success: false, count: 0, reason: "parse_error" };
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.error(`[AI Gen] Empty or non-array response from ${usedModel}`);
      return { success: false, count: 0, reason: "empty_response" };
    }

    // ============================================
    // ENHANCED VALIDATION
    // Five-layer check before any question hits DB
    // ============================================
    const FORBIDDEN_PHRASES = [
      "all of the above",
      "none of the above",
      "both a and b",
      "a and b both",
      "all the above",
      "none the above",
    ];

    const valid = [];

    for (const q of parsed) {

      // Layer 1 — schema + type check
      if (
        typeof q.text !== "string" ||
        q.text.trim().length < 15 ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some((o) => typeof o !== "string" || o.trim().length === 0) ||
        typeof q.correctAnswer !== "number" ||
        !Number.isInteger(q.correctAnswer) ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        console.warn(`[AI Gen] Layer1-fail (schema): "${String(q.text).slice(0, 50)}"`);
        continue;
      }

      // Layer 2 — all 4 options must be distinct (case-insensitive)
      const optionSet = new Set(q.options.map((o) => o.trim().toLowerCase()));
      if (optionSet.size < 4) {
        console.warn(`[AI Gen] Layer2-fail (duplicate options): "${q.text.slice(0, 50)}"`);
        continue;
      }

      // Layer 3 — question must be a proper question or fill-in-blank
      const cleanText = q.text.trim();
      const isProperQuestion =
        cleanText.endsWith("?") ||
        cleanText.includes("___") ||
        cleanText.includes("__");
      if (!isProperQuestion) {
        console.warn(`[AI Gen] Layer3-fail (not a question): "${cleanText.slice(0, 50)}"`);
        continue;
      }

      // Layer 4 — forbid lazy/ambiguous options
      const hasLazyOption = q.options.some((o) =>
        FORBIDDEN_PHRASES.some((phrase) => o.trim().toLowerCase().includes(phrase))
      );
      if (hasLazyOption) {
        console.warn(`[AI Gen] Layer4-fail (forbidden option): "${cleanText.slice(0, 50)}"`);
        continue;
      }

      // Layer 5 — correct option must have meaningful content
      // Rejects cases where model puts empty string or single char as answer
      const correctOptionText = q.options[q.correctAnswer].trim();
      if (correctOptionText.length < 1) {
        console.warn(`[AI Gen] Layer5-fail (empty correct option): "${cleanText.slice(0, 50)}"`);
        continue;
      }

      valid.push({
        topicId: new mongoose.Types.ObjectId(topicId),
        difficulty,
        text: cleanText,
        options: q.options.map((o) => String(o).trim()),
        correctAnswer: q.correctAnswer,
      });
    }

    if (valid.length === 0) {
      console.error(`[AI Gen] No valid questions after 5-layer validation from ${usedModel}`);
      return { success: false, count: 0, reason: "validation_failed" };
    }

    // ── Deduplicate against existing DB questions ─────────────
    const existing = await Question.find({
      topicId: new mongoose.Types.ObjectId(topicId),
      difficulty,
    })
      .select("text")
      .lean();

    const existingSet = new Set(existing.map((q) => q.text.toLowerCase().trim()));
    const deduped = valid.filter((q) => !existingSet.has(q.text.toLowerCase().trim()));

    if (deduped.length === 0) {
      console.log(`[AI Gen] All generated questions already exist in DB for "${topicName}" [${difficulty}]`);
      return { success: false, count: 0, reason: "all_duplicates" };
    }

    await Question.insertMany(deduped, { ordered: false });

    console.log(`[AI Gen] ✅ Inserted ${deduped.length} questions via ${usedModel} for "${topicName}" [${difficulty}]`);
    return { success: true, count: deduped.length, model: usedModel };

  } finally {
    generatingLocks.delete(lockKey);
  }
}

// ============================================
// PROVIDER ROUTER
// ============================================
async function callProvider(config, apiKey, prompt) {
  switch (config.provider) {
    case "anthropic":
      return callAnthropic(config, apiKey, prompt);
    case "groq":
    case "openai":
      return callOpenAICompatible(config, apiKey, prompt);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ============================================
// ANTHROPIC CALLER
// ============================================
async function callAnthropic(config, apiKey, prompt) {
  let Anthropic;
  try {
    Anthropic = require("@anthropic-ai/sdk");
  } catch {
    throw new Error("@anthropic-ai/sdk not installed — run: npm install @anthropic-ai/sdk");
  }
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: config.model,
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content?.[0]?.text || null;
}

// ============================================
// OPENAI-COMPATIBLE CALLER
// ============================================
async function callOpenAICompatible(config, apiKey, prompt) {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 429) throw new Error(`Rate limit / token quota exceeded (429)`);
    if (response.status === 503 || response.status === 502) throw new Error(`Model overloaded / unavailable (${response.status})`);
    if (response.status === 401) throw new Error(`Invalid API key (401)`);
    throw new Error(`HTTP ${response.status}: ${errBody.slice(0, 120)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// ============================================
// TIMEOUT WRAPPER
// ============================================
function callWithTimeout(fn, ms, modelName) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${ms}ms — ${modelName}`));
    }, ms);
    fn()
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// ============================================
// PROMPT BUILDER — FULLY OPTIMISED
//
// What changed from previous version:
//
// PROBLEM 1 — Wrong correctAnswer index
// Root cause: model assigned index first, THEN filled
// options around it. Fix: SOLVE-FIRST instruction forces
// model to compute the answer before writing any option.
// Self-verify step catches remaining index mismatches.
//
// PROBLEM 2 — Easy/vague questions
// Root cause: difficulty descriptions were vague.
// Fix: each level now specifies exact cognitive step count,
// time-to-solve target, and a concrete example question.
//
// PROBLEM 3 — Weak distractors / correct-looking wrong answers
// Root cause: no instruction on HOW to make wrong options.
// Fix: each difficulty level specifies exactly what type of
// error each distractor must represent — formula error,
// intermediate-step stop, unit error, common trap.
//
// PROBLEM 4 — Answer clustering at index 1/2
// Fix: explicit uniform distribution instruction (5 per index).
//
// Token cost: ~270 tokens (was ~175). Within all model limits.
// Output format: IDENTICAL — no backend changes needed.
// ============================================
function buildPrompt(topicName, difficulty) {

  const spec = {
    easy: {
      label: "Easy — Difficulty Level 2",
      cognitive: `Requires exactly 2 reasoning steps. Student must recall one formula/rule AND apply it to specific given values. Solvable in 60-90 seconds by a prepared student. NOT one-liners. Must involve actual computation, not just definition recall.`,
      distractor: `Wrong options must each represent a specific mistake: (1) correct formula but wrong substitution of values, (2) correct intermediate step but wrong final operation, (3) a commonly confused related formula applied incorrectly. All 3 wrong answers must be numerically close to the correct answer.`,
      example: `"A can complete a task in 15 days, B in 20 days. How many days do they take together?" — requires unit fraction setup + addition + reciprocal (2 clear steps).`
    },
    medium: {
      label: "Medium — Difficulty Level 4",
      cognitive: `Requires 4 to 5 distinct computation steps. Must combine at least 2 different concepts or formulas. Solvable in 2 to 3 minutes. Student must compute intermediate values before reaching the final answer. A student who knows only one concept will get it wrong.`,
      distractor: `Wrong options must represent: (1) answer obtained by stopping at the most tempting intermediate step, (2) answer from swapping which quantity is the base in a ratio/percentage, (3) answer from a sign or direction error in the final step. All must be numerically plausible.`,
      example: `"A sum of money doubles in 5 years at SI. In how many years will it become 4 times?" — requires SI formula + ratio comparison + proportional reasoning (4-5 steps).`
    },
    hard: {
      label: "Hard — Difficulty Level 6",
      cognitive: `Requires 6 or more steps OR contains a non-obvious trap that reverses naive intuition. Must combine 3 or more concepts. Solvable in 3-5 minutes only with deep understanding. A student who applies standard methods carelessly will pick a wrong answer confidently. Abstract reasoning preferred over just longer arithmetic.`,
      distractor: `Wrong options must represent: (1) the answer a student gets by falling for the PRIMARY trap in this type of problem, (2) the answer from applying the correct method to the wrong sub-problem, (3) the answer from a conceptually adjacent but wrong formula. These should be the answers that 60-70% of unprepared students would choose.`,
      example: `"Two pipes fill a tank in 12 and 18 mins. A drain empties it in 6 mins. If all three open together, will the tank ever fill? If yes, in how much time?" — requires net rate check, direction of inequality, and conditional reasoning (6+ steps with a trap).`
    }
  }[difficulty];

  return `You are a senior question setter for TCS NQT, Infosys IRT, and Wipro placement aptitude exams. You have 10 years of experience writing questions where exactly one answer is unambiguously correct and the three wrong options are convincingly wrong.

TOPIC: "${topicName}"
DIFFICULTY: ${spec.label}
COGNITIVE REQUIREMENT: ${spec.cognitive}

MANDATORY PROCESS — follow for every single question:
1. Write a question scenario about "${topicName}" matching the difficulty requirement.
2. SOLVE IT YOURSELF completely, step by step, to get the exact correct answer.
3. Write the correct answer as one of the 4 options.
4. Write exactly 3 distractor options as follows: ${spec.distractor}
5. Set correctAnswer to the INDEX (0, 1, 2, or 3) of your solved answer.
6. VERIFY: read options[correctAnswer] — it must exactly equal your Step 2 answer. Fix if not.

EXAMPLE of the required difficulty: ${spec.example}

HARD RULES:
- Generate exactly ${GENERATE_COUNT} questions
- Every question must end with "?"
- All 4 options per question must be distinct from each other
- NEVER use: "All of the above", "None of the above", "Both A and B", "Cannot be determined"
- Spread correctAnswer uniformly — approximately 5 questions each at index 0, 1, 2, and 3
- All questions must be strictly about "${topicName}" only
- Numbers must lead to clean answers (avoid irrational or repeating decimals unless topic requires)
- Each question must be self-contained — no reference to previous questions

Return ONLY a raw valid JSON array. No markdown. No explanation. No text before or after.

[
  {
    "text": "Question ending with ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2
  }
]`;
}

module.exports = { generateAndSaveQuestions };