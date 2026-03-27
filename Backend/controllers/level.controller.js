const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");
const Topic = require("../models/topic.model");
const Question = require("../models/question.model");
const LEVEL_CONFIG = require("../utils/levelConfig");
const { isLevelUnlocked } = require("../utils/unlockEvaluator");
// ✅ NEW IMPORT — only addition to this file
const { generateAndSaveQuestions } = require("../utils/aiQuestionGenerator");

// ============================================
// THRESHOLD for pre-generation trigger
// If unseen questions for user < this → fire AI
// ============================================
const PRE_GEN_THRESHOLD = 20;

exports.getLevelRoadmap = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const topicId = new mongoose.Types.ObjectId(req.params.topicId);

    // Validate topic
    const topic = await Topic.findById(topicId).select("name").lean();
    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    // Aggregate attempts grouped by difficulty
    const stats = await Attempt.aggregate([
      {
        $match: {
          userId,
          topicId,
        },
      },
      {
        $group: {
          _id: "$difficulty",
          attempts: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ["$isCorrect", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Convert aggregation to lookup map
    const difficultyStats = {};
    stats.forEach((s) => {
      difficultyStats[s._id] = {
        attempts: s.attempts,
        correct: s.correct,
      };
    });

    const levels = [];
    const maxLevel = Object.keys(LEVEL_CONFIG.levels).length;

    for (let level = 1; level <= maxLevel; level++) {
      const config = LEVEL_CONFIG.levels[level];
      const difficulty = config.difficulty;

      const attempts = difficultyStats[difficulty]?.attempts || 0;
      const correct = difficultyStats[difficulty]?.correct || 0;
      const accuracy = attempts ? correct / attempts : 0;

      const unlocked = await isLevelUnlocked(userId, topicId, level);

      // Completed condition
      const completed = attempts >= LEVEL_CONFIG.sessionSize;

      // Build unlock requirement text
      let unlockRequirement = null;

      if (level > 1) {
        const prevLevelConfig = LEVEL_CONFIG.levels[level - 1];

        if (
          prevLevelConfig &&
          prevLevelConfig.minAccuracyToUnlockNext !== null
        ) {
          const difficultyLabel =
            prevLevelConfig.difficulty.charAt(0).toUpperCase() +
            prevLevelConfig.difficulty.slice(1);

          const percent = Math.round(
            prevLevelConfig.minAccuracyToUnlockNext * 100
          );

          unlockRequirement = `${difficultyLabel} accuracy ≥ ${percent}%`;
        }
      }

      levels.push({
        level,
        difficulty,
        unlocked,
        completed,
        attempts,
        accuracy: Number(accuracy.toFixed(2)),
        unlockRequirement,
      });
    }

    // Topic progress (overall accuracy)
    const totalAttempts = stats.reduce((sum, s) => sum + s.attempts, 0);
    const totalCorrect = stats.reduce((sum, s) => sum + s.correct, 0);

    const overallProgress =
      totalAttempts > 0
        ? Math.round((totalCorrect / totalAttempts) * 100)
        : 0;

    // ============================================
    // ✅ SEND RESPONSE FIRST — user gets roadmap instantly
    // ============================================
    res.json({
      topic: {
        id: topic._id,
        name: topic.name,
        overallProgress,
      },
      levels,
    });

    // ============================================
    // ✅ BACKGROUND PRE-GENERATION — fires AFTER response sent
    //
    // Strategy:
    // 1. Find the current active level user is working on
    //    (first unlocked + not completed level)
    // 2. Check unseen count for THAT difficulty only
    // 3. If below threshold → generate 20 questions silently
    //
    // This targets token efficiency — only generates for
    // the difficulty the user will actually encounter next.
    // ============================================
    try {
      // Find current active level
      const currentLevel =
        levels.find((l) => l.unlocked && !l.completed) ||
        levels[levels.length - 1];

      const targetDifficulty = currentLevel.difficulty;

      // Get attempted question IDs for this difficulty
      const attemptedDocs = await Attempt.find({
        userId,
        topicId,
        difficulty: targetDifficulty,
      })
        .select("questionId")
        .lean();

      const attemptedIds = attemptedDocs.map((a) => a.questionId);

      // Count unseen questions for this user + difficulty
      const unseenCount = await Question.countDocuments({
        topicId,
        difficulty: targetDifficulty,
        _id: { $nin: attemptedIds },
      });

      if (unseenCount < PRE_GEN_THRESHOLD) {
        console.log(
          `[PreGen] Unseen ${unseenCount} < ${PRE_GEN_THRESHOLD} for "${topic.name}" [${targetDifficulty}] — triggering AI`
        );

        // Fire and forget — generateAndSaveQuestions has its own
        // internal lock so concurrent calls are safe
        generateAndSaveQuestions(
          topicId.toString(),
          topic.name,
          targetDifficulty
        ).catch((err) =>
          console.error("[PreGen] Background generation error:", err.message)
        );
      }
    } catch (bgErr) {
      // Background error must NEVER affect the response already sent
      console.error("[PreGen] Background check error:", bgErr.message);
    }
    // ============================================
    // END BACKGROUND BLOCK
    // ============================================
  } catch (err) {
    console.error("Level Roadmap Error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};