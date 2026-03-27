const mongoose = require("mongoose");
const Question = require("../models/question.model");
const Attempt = require("../models/attempt.model");
const LEVEL_CONFIG = require("./levelConfig");
const { isLevelUnlocked } = require("./unlockEvaluator");
// ✅ NEW IMPORT — only addition to this file
const { generateAndSaveQuestions } = require("./aiQuestionGenerator");

// ============================================
// THRESHOLD — if unseen questions for this user
// drops below this, AI top-up triggers in background
// With 100 admin-seeded questions, this rarely fires
// ============================================
const UNSEEN_THRESHOLD = 20;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function buildSession(userId, topicId, level) {
  const levelData = LEVEL_CONFIG.levels[level];
  if (!levelData) throw new Error("Invalid level");

  const unlocked = await isLevelUnlocked(userId, topicId, level);
  if (!unlocked) {
    return {
      allowed: false,
      message: "Level locked. Complete previous level requirements.",
    };
  }

  const difficulty = levelData.difficulty;
  const sessionSize = LEVEL_CONFIG.sessionSize;
  const unseenTarget = Math.floor(sessionSize * LEVEL_CONFIG.unseenRatio);

  const objectUserId = new mongoose.Types.ObjectId(userId);
  const objectTopicId = new mongoose.Types.ObjectId(topicId);

  // ============================================
  // ✅ AI SAFETY NET CHECK
  // Runs AFTER level unlock is confirmed.
  // Checks unseen count for this user + this difficulty.
  // If below threshold → fire background AI generation.
  // NON-BLOCKING — does not delay session delivery.
  // ============================================
  const attemptedDocs = await Attempt.find({
    userId: objectUserId,
    topicId: objectTopicId,
    difficulty,
  }).select("questionId");

  const attemptedIds = attemptedDocs.map((a) => a.questionId);

  const unseenCount = await Question.countDocuments({
    topicId: objectTopicId,
    difficulty,
    _id: { $nin: attemptedIds },
  });

  if (unseenCount < UNSEEN_THRESHOLD) {
    // Fire-and-forget — does NOT block session delivery
    // Topic name fetched inside generator for clean separation
    const Topic = require("../models/topic.model");
    Topic.findById(topicId)
      .select("name")
      .lean()
      .then((topic) => {
        if (topic) {
          generateAndSaveQuestions(topicId, topic.name, difficulty).catch(
            (err) =>
              console.error("[SessionBuilder] Background AI gen error:", err.message)
          );
        }
      })
      .catch((err) =>
        console.error("[SessionBuilder] Topic fetch error:", err.message)
      );
  }
  // ============================================
  // END AI BLOCK
  // Everything below is 100% original — UNCHANGED
  // ============================================

  const totalQuestionsInDB = await Question.countDocuments({
    topicId: objectTopicId,
    difficulty,
  });

  const uniqueAttemptedCount = new Set(
    attemptedIds.map((id) => id.toString())
  ).size;

  const levelExhausted = uniqueAttemptedCount >= totalQuestionsInDB;

  let questions = [];

  // 1️⃣ Unseen
  const unseenQuestions = await Question.find({
    topicId: objectTopicId,
    difficulty,
    _id: { $nin: attemptedIds },
  })
    .limit(unseenTarget)
    .lean();

  questions.push(...unseenQuestions);

  // 2️⃣ Incorrect reinforcement
  if (questions.length < sessionSize) {
    const incorrectAttempts = await Attempt.find({
      userId: objectUserId,
      topicId: objectTopicId,
      difficulty,
      isCorrect: false,
    }).select("questionId");

    const incorrectIds = incorrectAttempts.map((a) => a.questionId);

    const incorrectQuestions = await Question.find({
      topicId: objectTopicId,
      difficulty,
      _id: {
        $in: incorrectIds,
        $nin: questions.map((q) => q._id),
      },
    })
      .limit(sessionSize - questions.length)
      .lean();

    questions.push(...incorrectQuestions);
  }

  // 3️⃣ Fallback to any (repeat allowed)
  if (questions.length < sessionSize) {
    const filler = await Question.find({
      topicId: objectTopicId,
      difficulty,
      _id: { $nin: questions.map((q) => q._id) },
    })
      .limit(sessionSize - questions.length)
      .lean();

    questions.push(...filler);
  }

  // ============================================
  // EDGE CASE — topic has 0 questions in DB
  // AND AI generation is still in progress or failed
  // Return meaningful error instead of empty session
  // ============================================
  if (questions.length === 0) {
    return {
      allowed: false,
      message:
        "Questions are being prepared for this topic. Please try again in a moment.",
    };
  }

  questions = questions.slice(0, sessionSize);
  questions = shuffleArray(questions);

  const sanitized = questions.map((q) => ({
    _id: q._id,
    topicId: q.topicId,
    difficulty: q.difficulty,
    text: q.text,
    options: q.options,
  }));

  return {
    allowed: true,
    levelExhausted,
    questions: sanitized,
  };
}

module.exports = { buildSession };