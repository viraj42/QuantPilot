const mongoose = require("mongoose");
const Question = require("../models/question.model");
const Attempt = require("../models/attempt.model");
const LEVEL_CONFIG = require("./levelConfig");
const { isLevelUnlocked } = require("./unlockEvaluator");

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

  // Total questions in DB for this difficulty
  const totalQuestionsInDB = await Question.countDocuments({
    topicId: objectTopicId,
    difficulty,
  });

  // Attempted questions
  const attemptedDocs = await Attempt.find({
    userId: objectUserId,
    topicId: objectTopicId,
    difficulty,
  }).select("questionId");

  const attemptedIds = attemptedDocs.map(a => a.questionId);

  const uniqueAttemptedCount = new Set(
    attemptedIds.map(id => id.toString())
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

    const incorrectIds = incorrectAttempts.map(a => a.questionId);

    const incorrectQuestions = await Question.find({
      topicId: objectTopicId,
      difficulty,
      _id: {
        $in: incorrectIds,
        $nin: questions.map(q => q._id),
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
      _id: { $nin: questions.map(q => q._id) },
    })
      .limit(sessionSize - questions.length)
      .lean();

    questions.push(...filler);
  }

  questions = questions.slice(0, sessionSize);
  questions = shuffleArray(questions);

  const sanitized = questions.map(q => ({
    _id: q._id,
    topicId: q.topicId,
    difficulty: q.difficulty,
    text: q.text,
    options: q.options,
  }));

  return {
    allowed: true,
    levelExhausted, // 👈 frontend can show badge
    questions: sanitized,
  };
}

module.exports = { buildSession };