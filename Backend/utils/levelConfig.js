const LEVEL_CONFIG = {
  sessionSize: 10,
  unseenRatio: 0.7,
  minAttemptsForUnlock: 10,

  levels: {
    1: {
      difficulty: "easy",
      minAccuracyToUnlockNext: null,
    },
    2: {
      difficulty: "easy",
      minAccuracyToUnlockNext: 0.5,
    },
    3: {
      difficulty: "medium",
      minAccuracyToUnlockNext: 0.75,
    },
    4: {
      difficulty: "medium",
      minAccuracyToUnlockNext: 0.5,
    },
    5: {
      difficulty: "hard",
      minAccuracyToUnlockNext: 0.7,
    },
  },
};

module.exports = LEVEL_CONFIG;