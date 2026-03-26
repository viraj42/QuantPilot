const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");
const LEVEL_CONFIG = require("./levelConfig");

async function isLevelUnlocked(userId, topicId, level) {

  if (level === 1) return true;

  // ensure previous level itself is unlocked
  const prevUnlocked = await isLevelUnlocked(userId, topicId, level - 1);
  if (!prevUnlocked) return false;

  const previousLevel = level - 1;
  const previousConfig = LEVEL_CONFIG.levels[previousLevel];

  if (!previousConfig) return false;

  const aggregation = await Attempt.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        topicId: new mongoose.Types.ObjectId(topicId),
        difficulty: previousConfig.difficulty,
      },
    },
    {
      $group: {
        _id: null,
        attempted: { $sum: 1 },
        correct: {
          $sum: {
            $cond: [{ $eq: ["$isCorrect", true] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (aggregation.length === 0) return false;

  const { attempted, correct } = aggregation[0];

  if (attempted < LEVEL_CONFIG.minAttemptsForUnlock) {
    return false;
  }

  const accuracy = correct / attempted;

  if (previousConfig.minAccuracyToUnlockNext === null) {
    return true;
  }

  return accuracy >= previousConfig.minAccuracyToUnlockNext;
}

module.exports = { isLevelUnlocked };