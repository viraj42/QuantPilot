const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");
const Topic = require("../models/topic.model");
const LEVEL_CONFIG = require("../utils/levelConfig");
const { isLevelUnlocked } = require("../utils/unlockEvaluator");

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
        const difficulty =
        prevLevelConfig.difficulty.charAt(0).toUpperCase() +
        prevLevelConfig.difficulty.slice(1);

        const percent =
        Math.round(prevLevelConfig.minAccuracyToUnlockNext * 100);

        unlockRequirement = `${difficulty} accuracy ≥ ${percent}%`;
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

    res.json({
      topic: {
        id: topic._id,
        name: topic.name,
        overallProgress,
      },
      levels,
    });
  } catch (err) {
    console.error("Level Roadmap Error:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};