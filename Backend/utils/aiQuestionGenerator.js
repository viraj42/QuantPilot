const Question = require("../models/question.model");
const mongoose = require("mongoose");
require("dotenv").config();

// ============================================
// PROVIDER CHAIN — UNCHANGED
// ============================================
const PROVIDER_CHAIN = [
  {
    provider:  "groq",
    model:     "llama-3.3-70b-versatile",
    baseURL:   "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    tier:      "high",
    timeout:   20000,
  },
  {
    provider:  "groq",
    model:     "llama-3.1-8b-instant",
    baseURL:   "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    tier:      "low",
    timeout:   20000,
  },
  {
    provider:  "groq",
    model:     "gemma2-9b-it",
    baseURL:   "https://api.groq.com/openai/v1",
    apiKeyEnv: "GROQ_API_KEY",
    tier:      "low",
    timeout:   20000,
  },
  {
    provider:  "anthropic",
    model:     "claude-sonnet-4-6",
    baseURL:   null,
    apiKeyEnv: "ANTHROPIC_API_KEY",
    tier:      "high",
    timeout:   35000,
  },
  {
    provider:  "openai",
    model:     "gpt-4o-mini",
    baseURL:   "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    tier:      "high",
    timeout:   30000,
  },
];

// ============================================
// CONSTANTS — UNCHANGED
// ============================================
const BATCH_SIZE       = 10;
const SMALL_BATCH_SIZE = 5;
const TARGET_COUNT     = 20;
const MATH_TEMP        = 0.2;

const FORBIDDEN_PHRASES = [
  "all of the above",
  "none of the above",
  "both a and b",
  "a and b both",
  "all the above",
  "none the above",
  "cannot be determined",
  "data insufficient",
];

// ============================================
// IN-MEMORY LOCK — UNCHANGED
// ============================================
const generatingLocks = new Set();

// ============================================
// SUBTOPIC MAP
// ─────────────────────────────────────────────
// NEW ADDITION — this is the ONLY new data structure.
//
// Maps topic name keywords → array of distinct subtopics.
// Used by getSubtopics() which is called inside
// buildPromptFull() and buildPromptSimple().
//
// Purpose: inject a subtopic distribution instruction
// into the prompt so the model covers different question
// patterns instead of repeating the same template 10 times.
//
// Root cause of repetition: model defaults to the most
// common pattern it's seen (e.g., average speed for T&D,
// "X's parent is sibling of Y's parent" for Blood Relations).
// Without a subtopic diversity instruction, all 10 questions
// follow 1-2 templates regardless of what the topic contains.
// ============================================
const SUBTOPIC_MAP = [

  // ── QUANTITATIVE ──────────────────────────────────────────
  {
    keys: ["time", "distance", "speed"],
    subtopics: [
      "basic speed = distance ÷ time (find speed, distance, or time)",
      "average speed for a two-leg journey (different speeds each way)",
      "relative speed — two objects moving in same direction",
      "relative speed — two objects moving in opposite directions",
      "train crossing a pole or stationary point",
      "train crossing a platform or bridge (both have length)",
      "train crossing another train (both moving)",
      "boat going upstream and downstream (stream speed involved)",
      "meeting point — two people start from opposite ends",
      "time saved by changing speed mid-journey",
    ],
  },
  {
    keys: ["time", "work"],
    subtopics: [
      "single person — find days to complete work",
      "two people working together — find combined time",
      "two people — one leaves before completion",
      "pipes filling a tank — two inlet pipes",
      "pipes — one inlet one outlet (leak problem)",
      "work done in fractions — efficiency ratio",
      "wages divided proportionally to work done",
      "alternating work — A and B work on alternate days",
      "work completed in parts — find remaining time",
      "men and days variation (M×D=W relationship)",
    ],
  },
  {
    keys: ["percentage", "percent"],
    subtopics: [
      "percentage of a number (find X% of Y)",
      "percentage increase/decrease",
      "find original value given percentage increase/decrease",
      "percentage of one number relative to another",
      "successive percentage changes",
      "population growth with percentage",
      "percentage error or approximation",
      "election votes — percentage majority",
      "percentage comparison between two quantities",
      "reverse percentage — find base value from result",
    ],
  },
  {
    keys: ["profit", "loss"],
    subtopics: [
      "find profit or loss given cost price and selling price",
      "find selling price given cost price and profit %",
      "find cost price given selling price and profit %",
      "discount on marked price — find selling price",
      "successive discounts equivalent single discount",
      "two articles — one profit one loss (same %)",
      "dishonest dealer — false weight or measure",
      "cost price of multiple items — total profit/loss",
      "break-even — how many units to sell to cover cost",
      "profit after multiple transactions",
    ],
  },
  {
    keys: ["simple interest", "compound interest", "interest", "si ", "ci "],
    subtopics: [
      "find SI given principal, rate, time",
      "find principal given SI, rate, time",
      "find rate given SI, principal, time",
      "find time given SI, principal, rate",
      "CI annually — find amount after N years",
      "CI half-yearly or quarterly",
      "difference between CI and SI for 2 years",
      "difference between CI and SI for 3 years",
      "effective annual rate from nominal rate",
      "find principal given CI and SI difference",
    ],
  },
  {
    keys: ["ratio", "proportion"],
    subtopics: [
      "simplify and compare ratios",
      "find unknown in a proportion (a:b = c:d)",
      "divide a quantity in a given ratio",
      "compound ratio (ratio of ratios)",
      "ratio changes when a quantity is added/removed",
      "ages expressed as ratios",
      "mixture ratios — combine two mixtures",
      "income and expenditure ratio — find savings",
      "partners in business — profit sharing by ratio",
      "equivalent ratio and proportion problems",
    ],
  },
  {
    keys: ["average", "mean"],
    subtopics: [
      "average of given numbers",
      "find missing number given average",
      "average changes when a number is added or removed",
      "weighted average of two groups",
      "average speed (harmonic mean application)",
      "average age — new member joins or leaves",
      "average of consecutive integers",
      "average runs/marks over multiple rounds",
      "combine two groups with different averages",
      "average change when one value is replaced",
    ],
  },
  {
    keys: ["number system", "number series", "divisibility", "hcf", "lcm", "factors"],
    subtopics: [
      "HCF of two or three numbers",
      "LCM of two or three numbers",
      "HCF and LCM relationship — find one given the other",
      "divisibility rules (2, 3, 4, 5, 6, 8, 9, 11)",
      "remainder when divided by a number",
      "sum of digits and digit reversal problems",
      "unit digit of a power",
      "number of factors of a given number",
      "consecutive integers with given product or sum",
      "find the missing number in a series",
    ],
  },
  {
    keys: ["mixture", "alligation"],
    subtopics: [
      "mix two solutions of different concentrations — find final concentration",
      "alligation rule — find mixing ratio",
      "replacement — remove some mixture, replace with pure liquid",
      "repeated replacement — after N replacements",
      "cost price alligation — mix two goods to get target price",
      "mix water and milk — find ratio after dilution",
      "find quantity of ingredient added to change concentration",
      "two mixtures combined — resulting ratio",
      "alligation to find cheaper ingredient proportion",
      "mixture purity after partial removal and replacement",
    ],
  },
  {
    keys: ["permutation", "combination", "arrangement", "selection"],
    subtopics: [
      "number of ways to arrange N distinct objects",
      "arrange N objects with repetition allowed",
      "arrange with some objects fixed in position",
      "circular arrangement of N people",
      "select R objects from N (combination)",
      "selection with at least / at most constraint",
      "arrange letters of a word — some repeated",
      "form numbers from given digits — with/without repetition",
      "handshakes or matches in a group",
      "distribute N identical/distinct objects into groups",
    ],
  },
  {
    keys: ["probability"],
    subtopics: [
      "probability of a single event (coin, die, card)",
      "probability of two independent events (AND)",
      "probability of at least one event (OR)",
      "conditional probability",
      "probability with drawing balls without replacement",
      "probability with drawing balls with replacement",
      "probability of getting specific sum on two dice",
      "complementary probability (1 - P(not E))",
      "probability in card problems (suits, face cards)",
      "probability of exactly K successes in N trials",
    ],
  },
  {
    keys: ["age", "ages"],
    subtopics: [
      "find present age given ratio of ages",
      "find age given age N years ago or later",
      "sum of ages of family members",
      "age problem with two people and time shift",
      "ratio of ages now vs. N years ago",
      "age expressed as fraction of another's age",
      "three people — find individual ages",
      "grandfather/father/child age chain",
      "age word problem with equation setup",
      "find year of birth given current ages",
    ],
  },
  {
    keys: ["pipes", "cistern", "tank"],
    subtopics: [
      "two pipes fill tank — find time together",
      "one fill one drain — net rate",
      "three pipes — two fill one drain",
      "pipe opened for partial time",
      "leaky tank — find extra time to fill",
      "find capacity given fill rates",
      "alternate pipes — A for odd hours, B for even",
      "one pipe N times faster than other",
      "find drain time given fill and combined times",
      "word problem with partial filling scenario",
    ],
  },

  // ── LOGICAL REASONING ─────────────────────────────────────
  {
    keys: ["blood relation", "blood-relation", "family"],
    subtopics: [
      "parent–child relationship (one link)",
      "sibling relationship (brothers/sisters)",
      "uncle or aunt to nephew or niece (two links)",
      "cousin relationship (three links)",
      "grandparent to grandchild (three links)",
      "pointing to a photograph — find relationship",
      "complex chain — four or more links",
      "gender-sensitive chain (he said, she said)",
      "two separate chains — find cross-relationship",
      "family tree with multiple members given",
    ],
  },
  {
    keys: ["syllogism", "statement", "conclusion", "assumption"],
    subtopics: [
      "two statements — one conclusion (direct deduction)",
      "two statements — two conclusions (evaluate both)",
      "three statements — find which conclusion follows",
      "complementary pair of conclusions",
      "negative universal statements (No A is B)",
      "particular positive (Some A are B) deduction",
      "possibility-type conclusions",
      "statement–assumption pair evaluation",
      "statement–inference evaluation",
      "statement–course of action evaluation",
    ],
  },
  {
    keys: ["direction", "distance", "navigation", "compass"],
    subtopics: [
      "final direction after turning (N/S/E/W)",
      "total distance travelled — L-shaped path",
      "displacement — straight-line distance from start",
      "shadow direction problems (morning/evening sun)",
      "find direction facing after multiple turns",
      "two people walking from same point — find gap",
      "map reading — find position relative to start",
      "clockwise/anticlockwise turn problem",
      "multiple people walking in different directions",
      "final bearing after a series of turns",
    ],
  },
  {
    keys: ["coding", "decoding", "code"],
    subtopics: [
      "letter shifted by fixed number (Caesar cipher style)",
      "word coded as number sequence",
      "reverse of word or alternate letters",
      "number coding — each letter = positional value",
      "symbol coding — letters replaced by symbols",
      "pattern-based coding (first/last letter swap)",
      "decode a message given the coding rule",
      "number–letter mixed coding",
      "conditional coding (vowels treated differently)",
      "two-step coding (apply two transformations)",
    ],
  },
  {
    keys: ["seating", "arrangement", "circular", "linear"],
    subtopics: [
      "linear arrangement — 4 people, 2-3 constraints",
      "linear arrangement — 6 people, 4-5 constraints",
      "circular arrangement — find neighbour",
      "circular arrangement — who is opposite whom",
      "double row arrangement (facing each other)",
      "arrangement with gender alternating constraint",
      "find rank or position from both ends",
      "arrangement with 'not adjacent' constraints",
      "arrangement with fixed anchor positions",
      "box/floor/floor-level arrangement puzzle",
    ],
  },
  {
    keys: ["series", "number series", "letter series", "pattern"],
    subtopics: [
      "arithmetic progression series (find next term)",
      "geometric progression series",
      "square or cube-based series",
      "alternating two-series interleaved",
      "difference-of-differences pattern",
      "prime number series",
      "letter series — alphabetical shift pattern",
      "letter-number mixed series",
      "missing term in the middle of a series",
      "wrong term — find the odd one out in series",
    ],
  },
  {
    keys: ["analogy", "odd one out", "classification"],
    subtopics: [
      "word analogy — category relationship",
      "word analogy — part-whole relationship",
      "number analogy — mathematical relationship",
      "letter analogy — alphabetical position",
      "odd one out — one doesn't belong to the group",
      "odd one out — numbers (divisibility, primes, etc.)",
      "odd one out — letters (pattern break)",
      "classification by category",
      "classification by function or property",
      "double analogy (A:B :: C:?)",
    ],
  },
  {
    keys: ["calendar", "day", "date"],
    subtopics: [
      "find day of week for a given date",
      "find day after N days from a given day",
      "find day before N days from a given day",
      "leap year — which years are leap years",
      "day difference between two dates",
      "find date given day and reference date",
      "same calendar year — which years repeat",
      "count specific days in a month or year",
      "find month/date of specific occasion",
      "odd days method — century day calculation",
    ],
  },
  {
    keys: ["clock", "clocks", "angle", "hands"],
    subtopics: [
      "angle between clock hands at given time",
      "times when hour and minute hands coincide",
      "times when hands are perpendicular",
      "times when hands are at 180 degrees",
      "fast/slow clock — find correct time",
      "time gained or lost in given duration",
      "minute hand moves how many degrees in N minutes",
      "how many times hands overlap in 12 hours",
      "find time when angle is given",
      "defective clock problem (runs fast or slow)",
    ],
  },

  // ── VERBAL / ENGLISH ──────────────────────────────────────
  {
    keys: ["reading comprehension", "comprehension", "passage"],
    subtopics: [
      "main idea / central theme of passage",
      "specific detail question (directly stated)",
      "inference question (implied, not stated)",
      "vocabulary in context (word meaning from passage)",
      "author's tone or attitude",
      "title that best suits the passage",
      "logical conclusion from passage",
      "which statement is true/false per passage",
      "purpose of a specific paragraph",
      "weakening or strengthening the argument in passage",
    ],
  },
  {
    keys: ["fill in the blank", "fill in", "blank", "cloze"],
    subtopics: [
      "single blank — correct verb tense",
      "single blank — correct preposition",
      "single blank — noun/adjective agreement",
      "single blank — vocabulary (right word choice)",
      "double blank — both blanks from word pair",
      "cloze test — context-dependent word choice",
      "article usage (a/an/the) in blank",
      "conjunction in blank (and/but/although/however)",
      "idiom or phrase completion",
      "collocation — which word naturally follows",
    ],
  },
  {
    keys: ["sentence correction", "error detection", "grammatical error", "error"],
    subtopics: [
      "subject-verb agreement error",
      "tense consistency error",
      "pronoun reference error",
      "article error (a/an/the used incorrectly)",
      "preposition error",
      "adjective vs adverb confusion",
      "double negative error",
      "redundancy / pleonasm error",
      "comparative/superlative error",
      "parallel structure error",
    ],
  },
  {
    keys: ["synonym", "antonym", "vocabulary", "word meaning"],
    subtopics: [
      "synonym — find word closest in meaning",
      "antonym — find word opposite in meaning",
      "synonym from context (passage sentence given)",
      "antonym from context",
      "formal vs informal register synonym",
      "positive/negative connotation distinction",
      "one word for a given phrase or definition",
      "word pair — find the odd meaning",
      "commonly confused word pairs (affect/effect etc.)",
      "advanced vocabulary — C1 level synonym",
    ],
  },
  {
    keys: ["para jumble", "parajumble", "sentence rearrangement", "paragraph"],
    subtopics: [
      "4-sentence jumble — find correct order",
      "5-sentence jumble — find correct order",
      "find the opening sentence of the paragraph",
      "find the closing sentence of the paragraph",
      "find sentence that does not belong",
      "identify the link between two given sentences",
      "6-sentence jumble — more complex",
      "chronological order of events",
      "cause-effect sequence ordering",
      "contrast/concession sentence placement",
    ],
  },
  {
    keys: ["active", "passive", "voice"],
    subtopics: [
      "simple present active → passive",
      "simple past active → passive",
      "present perfect active → passive",
      "future tense active → passive",
      "modal verb active → passive (can/should/must)",
      "interrogative sentence active → passive",
      "imperative sentence active → passive",
      "identify voice of underlined sentence",
      "passive → active transformation",
      "complex sentence with relative clause — voice change",
    ],
  },
  {
    keys: ["direct", "indirect", "narration", "speech"],
    subtopics: [
      "statement — direct to indirect speech",
      "question — direct to indirect speech",
      "command/request — direct to indirect",
      "exclamatory — direct to indirect",
      "indirect to direct — statement",
      "indirect to direct — question",
      "tense backshift in reported speech",
      "pronoun change in reported speech",
      "time and place expressions in reported speech",
      "reporting verb selection (said/told/asked/ordered)",
    ],
  },
];

// ============================================
// GET SUBTOPICS FOR A TOPIC
// ─────────────────────────────────────────────
// NEW ADDITION — fuzzy keyword match against SUBTOPIC_MAP.
// Returns array of subtopic strings for the given topic,
// or empty array if topic is not in the map (graceful).
//
// Matching: all keys in an entry must appear in topicName
// for a partial match OR any key alone can match.
// We use a scoring approach: entry with the most keyword
// matches to the topicName wins.
// ============================================
function getSubtopics(topicName) {
  const t = topicName.toLowerCase();
  let bestEntry  = null;
  let bestScore  = 0;

  for (const entry of SUBTOPIC_MAP) {
    const score = entry.keys.filter((k) => t.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestScore > 0 ? bestEntry.subtopics : [];
}

// ============================================
// BUILD SUBTOPIC DIVERSITY INSTRUCTION
// ─────────────────────────────────────────────
// NEW ADDITION — formats the subtopic list into a
// prompt instruction block.
// Returns empty string if no subtopics found (no-op).
//
// For full prompt (tier:high): list all subtopics with
// max-per-subtopic and min-coverage rules.
//
// For simple prompt (tier:low): condensed version —
// just the subtopic names with a short instruction.
// ============================================
function buildSubtopicInstruction(topicName, batchSize, mode) {
  const subtopics = getSubtopics(topicName);
  if (subtopics.length === 0) return "";

  const minCover = Math.min(subtopics.length, Math.ceil(batchSize * 0.6));
  const maxPer   = 2;

  if (mode === "full") {
    const listed = subtopics.map((s, i) => `  ${i + 1}. ${s}`).join("\n");
    return `
SUBTOPIC DIVERSITY REQUIREMENT (critical — read carefully):
The topic "${topicName}" has multiple distinct subtopics. You MUST distribute your ${batchSize} questions across different subtopics.

Known subtopics for "${topicName}":
${listed}

RULES:
- Write AT MOST ${maxPer} questions per subtopic
- Cover AT LEAST ${minCover} different subtopics across the ${batchSize} questions
- Do NOT write all questions using the same subtopic or the same question template
- Each question must feel structurally different from the others
`;
  }

  // Condensed for tier:low
  const listed = subtopics.slice(0, 8).map((s) => `- ${s}`).join("\n");
  return `
VARIETY RULE: Cover different subtopics. Do NOT repeat the same question pattern.
Subtopics to use (pick at least ${minCover} different ones):
${listed}
Max ${maxPer} questions from same subtopic.
`;
}

// ============================================
// MAIN EXPORT — UNCHANGED
// ============================================
async function generateAndSaveQuestions(topicId, topicName, difficulty) {
  const lockKey = `${topicId}_${difficulty}`;

  if (generatingLocks.has(lockKey)) {
    console.log(`[AI Gen] Lock active for "${topicName}" [${difficulty}] — skipped`);
    return { success: false, count: 0, reason: "locked" };
  }

  generatingLocks.add(lockKey);

  try {
    console.log(`[AI Gen] Starting: "${topicName}" [${difficulty}]`);
    console.log("ENV CHECK:", {
      GROQ:      !!process.env.GROQ_API_KEY,
      ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
      OPENAI:    !!process.env.OPENAI_API_KEY,
    });

    const existingDocs = await Question.find({
      topicId: new mongoose.Types.ObjectId(topicId),
      difficulty,
    }).select("text").lean();

    const existingSet = new Set(existingDocs.map((q) => q.text.toLowerCase().trim()));

    const allValid = [];
    let successConfig = null;

    for (let batch = 0; batch < 4 && allValid.length < TARGET_COUNT; batch++) {

      let rawText    = null;
      let usedConfig = null;

      if (batch === 0 || successConfig === null) {
        const result = await tryProviderChain(topicName, difficulty);
        rawText      = result.rawText;
        usedConfig   = result.config;
        if (rawText) successConfig = usedConfig;
      } else {
        const batchSize = successConfig.tier === "high" ? BATCH_SIZE : SMALL_BATCH_SIZE;
        const prompt    = successConfig.tier === "high"
          ? buildPromptFull(topicName, difficulty, batchSize)
          : buildPromptSimple(topicName, difficulty, batchSize);

        console.log(`[AI Gen] Batch ${batch + 1} — reusing ${successConfig.provider}/${successConfig.model}`);
        try {
          rawText    = await callWithTimeout(
            () => callProvider(successConfig, process.env[successConfig.apiKeyEnv], prompt),
            successConfig.timeout,
            successConfig.model
          );
          usedConfig = successConfig;
        } catch (err) {
          console.warn(`[AI Gen] Batch ${batch + 1} reuse failed — ${err.message} — retrying chain`);
          successConfig = null;
          const retry   = await tryProviderChain(topicName, difficulty);
          rawText       = retry.rawText;
          usedConfig    = retry.config;
          if (rawText) successConfig = usedConfig;
        }
      }

      if (!rawText || !usedConfig) {
        console.warn(`[AI Gen] Batch ${batch + 1} — no response`);
        if (batch === 0) break;
        continue;
      }

      const batchValid = parseAndVerify(rawText, topicId, difficulty, existingSet, usedConfig.tier);
      console.log(`[AI Gen] Batch ${batch + 1} (${usedConfig.tier}) — ${batchValid.length} valid`);

      batchValid.forEach((q) => existingSet.add(q.text.toLowerCase().trim()));
      allValid.push(...batchValid);

      if (allValid.length >= TARGET_COUNT) break;
      if (successConfig && successConfig.tier === "high" && batch >= 1) break;
    }

    if (allValid.length === 0) {
      console.error(`[AI Gen] Zero valid questions for "${topicName}" [${difficulty}]`);
      return { success: false, count: 0, reason: "validation_failed" };
    }

    const toInsert = allValid.slice(0, TARGET_COUNT).map((q) => ({
      topicId:       new mongoose.Types.ObjectId(topicId),
      difficulty:    q.difficulty,
      text:          q.text,
      options:       q.options,
      correctAnswer: q.correctAnswer,
    }));

    await Question.insertMany(toInsert, { ordered: false });

    console.log(`[AI Gen] ✅ Inserted ${toInsert.length} verified questions for "${topicName}" [${difficulty}]`);
    return { success: true, count: toInsert.length };

  } finally {
    generatingLocks.delete(lockKey);
  }
}

// ============================================
// TRY PROVIDER CHAIN — UNCHANGED
// ============================================
async function tryProviderChain(topicName, difficulty) {
  for (const config of PROVIDER_CHAIN) {
    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) continue;

    const batchSize = config.tier === "high" ? BATCH_SIZE : SMALL_BATCH_SIZE;
    const prompt    = config.tier === "high"
      ? buildPromptFull(topicName, difficulty, batchSize)
      : buildPromptSimple(topicName, difficulty, batchSize);

    console.log(`[AI Gen] Trying ${config.provider}/${config.model} [tier:${config.tier}] for "${topicName}" [${difficulty}]`);

    try {
      const rawText = await callWithTimeout(
        () => callProvider(config, apiKey, prompt),
        config.timeout,
        config.model
      );
      if (rawText) return { rawText, config };
    } catch (err) {
      console.warn(`[AI Gen] ${config.provider}/${config.model} — ${err.message} — next`);
    }
  }

  console.error(`[AI Gen] All providers exhausted for "${topicName}" [${difficulty}]`);
  return { rawText: null, config: null };
}

// ============================================
// PARSE + VERIFY — UNCHANGED (all 7 layers)
// ============================================
function parseAndVerify(rawText, topicId, difficulty, existingSet, tier) {
  let parsed;
  try {
    let clean = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const arrayStart = clean.indexOf("[");
    const arrayEnd   = clean.lastIndexOf("]");
    if (arrayStart === -1 || arrayEnd === -1) {
      console.error(`[AI Gen][${tier}] No JSON array in response`);
      return [];
    }
    clean  = clean.slice(arrayStart, arrayEnd + 1);
    parsed = JSON.parse(clean);
  } catch (err) {
    console.error(`[AI Gen][${tier}] JSON parse error: ${err.message}`);
    return [];
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  const valid = [];

  for (const q of parsed) {

    if (
      typeof q.text !== "string"          ||
      q.text.trim().length < 20           ||
      !Array.isArray(q.options)           ||
      q.options.length !== 4              ||
      q.options.some((o) => typeof o !== "string" || o.trim().length === 0) ||
      typeof q.correctAnswer !== "number" ||
      !Number.isInteger(q.correctAnswer)  ||
      q.correctAnswer < 0                 ||
      q.correctAnswer > 3
    ) {
      console.warn(`[AI Gen][${tier}] L1-fail: "${String(q.text).slice(0, 60)}"`);
      continue;
    }

    const cleanText   = q.text.trim();
    const trimmedOpts = q.options.map((o) => o.trim());

    if (!cleanText.endsWith("?") && !cleanText.includes("___")) {
      console.warn(`[AI Gen][${tier}] L2-fail (no ?): "${cleanText.slice(0, 60)}"`);
      continue;
    }

    const optLower = trimmedOpts.map((o) => o.toLowerCase());
    if (new Set(optLower).size < 4) {
      console.warn(`[AI Gen][${tier}] L3-fail (duplicate opts): "${cleanText.slice(0, 60)}"`);
      continue;
    }

    if (trimmedOpts.some((o) =>
      FORBIDDEN_PHRASES.some((p) => o.toLowerCase().includes(p))
    )) {
      console.warn(`[AI Gen][${tier}] L4-fail (forbidden): "${cleanText.slice(0, 60)}"`);
      continue;
    }

    let finalIndex = q.correctAnswer;

    if (typeof q.correctAnswerValue === "string" && q.correctAnswerValue.trim().length > 0) {
      const claimed  = q.correctAnswerValue.trim().toLowerCase();
      const assigned = optLower[finalIndex];
      const isMatch  =
        assigned === claimed ||
        assigned.includes(claimed) ||
        claimed.includes(assigned);

      if (!isMatch) {
        const repairIdx = optLower.findIndex(
          (o) => o === claimed || o.includes(claimed) || claimed.includes(o)
        );
        if (repairIdx !== -1) {
          console.log(`[AI Gen][${tier}] L5-repair: index ${finalIndex}→${repairIdx} | claimed="${claimed}"`);
          finalIndex = repairIdx;
        } else {
          console.warn(`[AI Gen][${tier}] L5-discard: claimed="${claimed}" not in opts | "${cleanText.slice(0, 50)}"`);
          continue;
        }
      }
    }

    if (trimmedOpts[finalIndex].length < 1) {
      console.warn(`[AI Gen][${tier}] L6-fail (empty correct opt): "${cleanText.slice(0, 60)}"`);
      continue;
    }

    if (existingSet.has(cleanText.toLowerCase().trim())) continue;

    valid.push({
      topicId:       new mongoose.Types.ObjectId(topicId),
      difficulty,
      text:          cleanText,
      options:       trimmedOpts,
      correctAnswer: finalIndex,
    });
  }

  return valid;
}

// ============================================
// TOPIC CATEGORY DETECTOR — UNCHANGED
// ============================================
function detectTopicCategory(topicName) {
  const t = topicName.toLowerCase();

  const LOGICAL_KEYWORDS = [
    "syllogism", "blood relation", "blood-relation", "seating arrangement",
    "seating", "arrangement", "direction", "coding decoding", "coding-decoding",
    "puzzle", "ranking", "order", "sequence", "inequality", "statement",
    "assumption", "conclusion", "course of action", "inference", "argument",
    "analogy", "series", "number series", "letter series", "odd one out",
    "classification", "logical", "reasoning", "venn diagram", "input output",
    "machine input", "calendar", "clock", "data sufficiency",
  ];

  const VERBAL_KEYWORDS = [
    "reading comprehension", "comprehension", "para jumble", "parajumble",
    "sentence correction", "error detection", "fill in the blank", "fill in",
    "cloze test", "cloze", "vocabulary", "synonym", "antonym", "idiom",
    "phrase", "one word substitution", "active passive", "direct indirect",
    "narration", "voice", "grammar", "verbal", "english", "spelling",
    "word meaning", "sentence improvement", "preposition", "conjunction",
  ];

  if (LOGICAL_KEYWORDS.some((k) => t.includes(k))) return "logical";
  if (VERBAL_KEYWORDS.some((k) => t.includes(k))) return "verbal";
  return "quant";
}

// ============================================
// PROVIDER ROUTER — UNCHANGED
// ============================================
async function callProvider(config, apiKey, prompt) {
  switch (config.provider) {
    case "anthropic": return callAnthropic(config, apiKey, prompt);
    case "groq":
    case "openai":    return callOpenAICompatible(config, apiKey, prompt);
    default: throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ============================================
// ANTHROPIC CALLER — UNCHANGED
// ============================================
async function callAnthropic(config, apiKey, prompt) {
  let Anthropic;
  try   { Anthropic = require("@anthropic-ai/sdk"); }
  catch { throw new Error("@anthropic-ai/sdk not installed"); }

  const client  = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model:      config.model,
    max_tokens: 5000,
    messages:   [{ role: "user", content: prompt }],
  });
  return message.content?.[0]?.text || null;
}

// ============================================
// OPENAI-COMPATIBLE CALLER — UNCHANGED
// ============================================
async function callOpenAICompatible(config, apiKey, prompt) {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       config.model,
      messages:    [{ role: "user", content: prompt }],
      max_tokens:  5000,
      temperature: MATH_TEMP,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) throw new Error(`Rate limit (429)`);
    if (response.status === 503 || response.status === 502) throw new Error(`Model unavailable (${response.status})`);
    if (response.status === 401) throw new Error(`Invalid API key (401)`);
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 100)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// ============================================
// TIMEOUT WRAPPER — UNCHANGED
// ============================================
function callWithTimeout(fn, ms, modelName) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout ${ms}ms — ${modelName}`)), ms
    );
    fn()
      .then((r) => { clearTimeout(timer); resolve(r); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}

// ============================================
// BUILD PROMPT — FULL (tier:"high")
// ─────────────────────────────────────────────
// ONLY CHANGE vs previous version:
//   buildSubtopicInstruction() injected after cognitive block.
//   Everything else word-for-word identical.
// ============================================
function buildPromptFull(topicName, difficulty, batchSize) {
  const category = detectTopicCategory(topicName);

  const QUANT_SPEC = {
    easy: {
      label: "AMCAT Easy / TCS NQT Foundation Level",
      benchmark: `REQUIRED DIFFICULTY — match this solved example exactly:
Example Q: "A train 150m long crosses a pole in 15 seconds. What is the speed in km/h?"
Example Solution: Speed = 150/15 = 10 m/s. Convert: 10 × (18/5) = 36 km/h.
Example Answer: 36 km/h
2-3 steps, one formula, one conversion. NOT simpler than this.`,
      cognitive: `Every question MUST:
- Require 2-3 calculation steps (NOT 1, NOT 4+)
- Apply one named formula from ${topicName}
- Include at least one unit conversion, ratio setup, or percentage calculation
- Use numbers > 10 (no single-digit trivial arithmetic)`,
      distractors: `3 wrong options MUST be:
(D1) Correct formula, wrong unit conversion or substitution
(D2) Stops at the intermediate step, doesn't complete
(D3) Reciprocal or inverse of the correct ratio
All 3 within 40% of the correct answer numerically.`,
    },
    medium: {
      label: "AMCAT Medium / Infosys IRT / Wipro NLTH Level",
      benchmark: `REQUIRED DIFFICULTY — match this solved example exactly:
Example Q: "Pipes A and B fill a tank in 20 and 30 min. Pipe C drains in 15 min. All 3 open when half full. Minutes to fill completely?"
Example Solution: Net = 1/20+1/30-1/15 = 1/60 tank/min. Remaining = 0.5. Time = 30 min.
Example Answer: 30 minutes
4-5 steps, 2 concepts combined. NOT simpler.`,
      cognitive: `Every question MUST:
- Require 4-5 distinct calculation steps
- Combine exactly 2 different concepts from ${topicName}
- Have an intermediate value computed before final answer
- Be unsolvable if student knows only one concept`,
      distractors: `3 wrong options MUST be:
(D1) Stops at most tempting intermediate step
(D2) Swaps numerator/denominator in key ratio
(D3) +/- sign error or adds instead of subtracts rates
All within 60% of correct answer.`,
    },
    hard: {
      label: "Capgemini Advanced / Top-10% Campus Placement Level",
      benchmark: `REQUIRED DIFFICULTY — match this solved example exactly:
Example Q: "80L mixture, milk:water=7:3. Litres of water to add so milk = 49% of new mixture?"
Example Solution: Milk=56L, Water=24L. 56/(80+x)=49/100 → x=34.3L.
Example Answer: 34.3 litres
6+ steps, algebraic equation, non-integer. NOT simpler.`,
      cognitive: `Every question MUST:
- Require 6+ steps OR a non-obvious trap
- Combine 3 concepts from ${topicName}
- Require algebraic equation setup
- Be unsolvable in under 3 min without mastery`,
      distractors: `3 wrong options MUST be:
(D1) Answer from falling for the primary trap
(D2) Correct method on wrong sub-quantity
(D3) Adjacent but wrong formula from same family
Each traps 20-35% of unprepared students.`,
    },
  };

  const LOGICAL_SPEC = {
    easy: {
      label: "AMCAT Easy / TCS NQT Foundation — Logical",
      benchmark: `Example Q: "All cats are animals. Some animals are dogs. Which conclusion follows?"
Example Solution: All cats→animals means some animals are cats. Only definite conclusion.
Example Answer: Some animals are cats
2-3 deduction steps, single chain.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Require 2-3 logical deduction steps
- Have exactly ONE unambiguous conclusion`,
      distractors: `(D1) Partial conclusion requiring unstated assumption
(D2) Reverse/converse of correct relationship
(D3) Common reasoning mistake for this topic type`,
    },
    medium: {
      label: "AMCAT Medium / Infosys IRT — Logical",
      benchmark: `Example Q: "Some A are B. All B are C. No C is D. Conclusion: I: Some A are C. II: No A is D."
Example Solution: Some A→B→C so I follows. A→C but no C is D → II follows too.
Example Answer: Both I and II
3-4 inference steps, 2 conclusions simultaneously.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Require 3-4 logical inference steps
- Present 2+ conclusions/relationships to evaluate`,
      distractors: `(D1) Correct on one part, mis-evaluates the second
(D2) Most common confusion error for this topic
(D3) Logically invalid but plausible-sounding conclusion`,
    },
    hard: {
      label: "Capgemini Advanced / Top-10% — Logical",
      benchmark: `Example Q: "6 people A-F in circle. A 2nd right of C. B opposite D. E not adjacent A or B. F between C and D. Who sits immediately left of B?"
Example Solution: Systematic constraint placement → unique arrangement → answer E.
Example Answer: E
5+ constraints, systematic elimination.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Require 5+ inference steps or constraint eliminations
- Have a non-obvious trap where intuitive answer is WRONG
- Evaluate 3+ conclusions or trace 4+ relationship links`,
      distractors: `(D1) Falls for the primary trap
(D2) Evaluates 2 of 3 conclusions correctly, misses one
(D3) Most common error pattern for this topic type
Each traps 20-35% of unprepared students.`,
    },
  };

  const VERBAL_SPEC = {
    easy: {
      label: "AMCAT Easy / TCS NQT Foundation — Verbal",
      benchmark: `Example Q: "The teacher asked students to ______ their assignments. (A) submit (B) submits (C) submitted (D) submitting"
Example Solution: 'Asked to' + base infinitive → submit.
Example Answer: submit
One grammar rule applied, fundamental level.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Test one clear, specific rule or word meaning
- Have exactly ONE correct answer with no ambiguity`,
      distractors: `(D1) Similar but grammatically/semantically wrong
(D2) Common confusion word pair
(D3) Plausible but clearly wrong on reflection`,
    },
    medium: {
      label: "AMCAT Medium / Infosys IRT — Verbal",
      benchmark: `Example Q: "She didn't had any idea about the meeting. (A) didn't had (B) any idea (C) about the meeting (D) No error"
Example Solution: didn't + base form → 'had' should be 'have'. Error at A.
Example Answer: A
Subtle grammar rule, requires auxiliary verb knowledge.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Require applying 2-3 language rules or contextual reasoning steps
- NOT be solvable in under 45 seconds without solid English knowledge`,
      distractors: `(D1) Correct by one rule, wrong by another
(D2) Sounds natural in speech but violates written grammar
(D3) Correct in a slightly different sentence context`,
    },
    hard: {
      label: "Capgemini Advanced / Top-10% — Verbal",
      benchmark: `Example Q: "His ______ remarks, though intended humorously, were perceived as offensive. (A) flippant (B) sincere (C) profound (D) taciturn"
Example Solution: dismissively casual humor → flippant = treating serious things lightly.
Example Answer: flippant
Advanced vocabulary, tone inference from full context.`,
      cognitive: `Every question MUST:
- Be strictly about "${topicName}" patterns only
- Distinguish between 2-3 subtly different meanings or structures
- Demand C1-level vocabulary or complex grammar knowledge
- Have a trap where the simple choice is WRONG`,
      distractors: `(D1) Fits surface meaning but misses nuance
(D2) Correct in different but similar context
(D3) Sounds sophisticated but semantically/grammatically off
Each traps 25-40% of average students.`,
    },
  };

  const SPECS = { quant: QUANT_SPEC, logical: LOGICAL_SPEC, verbal: VERBAL_SPEC };
  const spec  = SPECS[category][difficulty];

  // ── Subtopic diversity block (NEW — only addition) ────────
  const subtopicBlock = buildSubtopicInstruction(topicName, batchSize, "full");

  const solvingProcess = category === "quant"
    ? `1. Write question with specific numbers about "${topicName}".
2. SOLVE completely — show every arithmetic step.
3. State FINAL ANSWER as exact text (e.g. "36 km/h").
4. Write 4 options — correctAnswer index points to Step 3 answer EXACTLY.
5. Set correctAnswerValue = exact Step 3 text.
6. VERIFY: options[correctAnswer] === correctAnswerValue. Fix if not.`
    : category === "logical"
    ? `1. Write question following "${topicName}" patterns (statements/relationships/constraints).
2. REASON completely — trace every deduction step.
3. State FINAL ANSWER as exact text (e.g. "Uncle" or "Both I and II").
4. Write 4 options — correctAnswer index points to Step 3 answer EXACTLY.
5. Set correctAnswerValue = exact Step 3 text.
6. VERIFY: options[correctAnswer] === correctAnswerValue. Fix if not.`
    : `1. Write question following "${topicName}" patterns (fill-in-blank / error / synonym etc.).
2. REASON completely — state the rule, why correct is right, why others fail.
3. State FINAL ANSWER as exact text (e.g. "submit" or "A" or "flippant").
4. Write 4 options — correctAnswer index points to Step 3 answer EXACTLY.
5. Set correctAnswerValue = exact Step 3 text.
6. VERIFY: options[correctAnswer] === correctAnswerValue. Fix if not.`;

  return `You are a senior placement exam question setter for TCS NQT, AMCAT, Infosys IRT, Wipro NLTH, and Capgemini. You specialise in "${topicName}". Every question you write has EXACTLY ONE unambiguously correct answer.

TOPIC: "${topicName}"
DIFFICULTY: ${spec.label}

${spec.benchmark}

COGNITIVE REQUIREMENT:
${spec.cognitive}
${subtopicBlock}
DISTRACTOR REQUIREMENT:
${spec.distractors}

MANDATORY PROCESS PER QUESTION:
${solvingProcess}

NON-NEGOTIABLE RULES:
- Generate exactly ${batchSize} questions
- Every question ends with "?"
- Minimum 25 words per question (no short stubs)
- All 4 options distinct
- NEVER: "All of the above" / "None of the above" / "Both A and B" / "Cannot be determined"
- correctAnswer index spread: ~2-3 at each of 0, 1, 2, 3
- Questions EXCLUSIVELY about "${topicName}" — no topic drift

Return ONLY this JSON array, nothing else:
[
  {
    "text": "Question about ${topicName} ending with ?",
    "solution": "Step 1: ... Step 2: ... Final answer: [value]",
    "correctAnswerValue": "exact text of correct option",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2
  }
]

FINAL CHECK: For every question, options[correctAnswer] must equal correctAnswerValue. Questions must cover different subtopics — not the same template repeated.
Return ONLY the JSON array. No markdown. No text before or after.`;
}

// ============================================
// BUILD PROMPT — SIMPLE (tier:"low")
// ─────────────────────────────────────────────
// ONLY CHANGE vs previous version:
//   buildSubtopicInstruction() condensed block injected.
//   Everything else word-for-word identical.
// ============================================
function buildPromptSimple(topicName, difficulty, batchSize) {
  const category = detectTopicCategory(topicName);

  const diffSpec = {
    quant: {
      easy:   `2-3 arithmetic steps, one formula from "${topicName}", one unit conversion or ratio. Numbers > 10. Cannot be solved by guessing.`,
      medium: `4-5 steps, combine 2 concepts from "${topicName}", must compute intermediate values. Solvable in ~2 min.`,
      hard:   `6+ steps, combine 3 concepts, algebraic equation required, at least one non-obvious trap. Solvable in ~4 min only with mastery.`,
    },
    logical: {
      easy:   `2-3 deduction steps using "${topicName}" patterns. One clear unambiguous conclusion from 2 given statements.`,
      medium: `3-4 inference steps. Present 2 conclusions, student must evaluate both. Use "${topicName}" patterns only.`,
      hard:   `5+ constraint eliminations or inference steps. Non-obvious trap. 3+ conclusions or 4+ relationship links. Use "${topicName}" patterns only.`,
    },
    verbal: {
      easy:   `One grammar rule or word meaning test. Strictly "${topicName}" patterns. Clear single correct answer.`,
      medium: `2-3 language rules or contextual reasoning steps. Subtle rule application. Strictly "${topicName}" patterns.`,
      hard:   `Advanced vocabulary or complex grammar. Trap where simple choice is wrong. Strictly "${topicName}" patterns.`,
    },
  };

  const cognitive    = diffSpec[category][difficulty];
  const categoryNote = category === "quant"   ? "quantitative aptitude"
                     : category === "logical" ? "logical reasoning"
                     :                          "English verbal ability";

  // ── Subtopic diversity block (NEW — condensed for low tier) ─
  const subtopicBlock = buildSubtopicInstruction(topicName, batchSize, "simple");

  return `You are an aptitude exam question setter for campus placement exams (TCS NQT, AMCAT, Infosys IRT). Generate ${batchSize} MCQ questions.

TOPIC: "${topicName}" (${categoryNote})
DIFFICULTY: ${difficulty.toUpperCase()} — ${cognitive}
${subtopicBlock}
FOR EACH QUESTION:
1. Write a question about "${topicName}" ending with "?"
2. Compute the correct answer yourself.
3. Write exactly 4 options. One must be your correct answer.
4. Set correctAnswer = index (0/1/2/3) of the correct option.
5. Set correctAnswerValue = the exact text of the correct option.
6. Make the 3 wrong options plausible but clearly wrong — use common mistakes for this topic.

RULES:
- All questions ONLY about "${topicName}" — no other topic
- Every question ends with "?"
- All 4 options are different
- No: "All of the above", "None of the above", "Cannot be determined"
- Spread correctAnswer: some at 0, some at 1, some at 2, some at 3
- Minimum 20 words per question
- Each question must test a DIFFERENT subtopic or scenario — no repeated templates

Return ONLY this JSON array:
[
  {
    "text": "Question about ${topicName}?",
    "correctAnswerValue": "exact text of correct option",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1
  }
]

Return ONLY the JSON. No text before or after.`;
}

module.exports = { generateAndSaveQuestions };