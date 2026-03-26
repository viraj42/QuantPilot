const mongoose = require("mongoose");
const Question = require("../models/question.model");
const Attempt = require("../models/attempt.model");
const Topic = require("../models/topic.model");
const { buildSession } = require("../utils/sessionBuilder");
const { isLevelUnlocked } = require("../utils/unlockEvaluator");

module.exports.startSession = async (req, res) => {
  try {
    const { topicId, level } = req.body;
    const userId = req.user.id;

    if (
      !topicId ||
      !mongoose.Types.ObjectId.isValid(topicId) ||
      typeof level !== "number" ||
      !Number.isInteger(level) ||
      level < 1 ||
      level > 5
    ) {
      return res.status(400).json({
        message: "Invalid topicId or level",
      });
    }

    const topic = await Topic.findById(topicId).lean();
    if (!topic) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    const result = await buildSession(userId, topicId, level);

    if (!result.allowed) {
      return res.status(403).json({
        message: result.message || "Level locked",
      });
    }

    return res.status(200).json({
      topicId,
      level,
      totalQuestions: result.questions.length,
      questions: result.questions,
    });

  } catch (error) {
    console.error("StartSession Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const { Types } = require("mongoose");

module.exports.submitSession = async (req, res) => {
  try {
    const { topicId, level, answers } = req.body;
    const userId = req.user.id;

    if (
      !topicId ||
      !Types.ObjectId.isValid(topicId) ||
      typeof level !== "number" ||
      !Number.isInteger(level) ||
      level < 1 ||
      level > 5 ||
      !Array.isArray(answers) ||
      answers.length !== 10
    ) {
      return res.status(400).json({
        message: "Invalid topic, level, or answers format",
      });
    }

    const topicObjectId = new Types.ObjectId(topicId);

    // Extract questionIds once
    const questionIds = new Array(10);
    for (let i = 0; i < 10; i++) {
      questionIds[i] = answers[i].questionId;
    }

    const uniqueIds = new Set(questionIds);
    if (uniqueIds.size !== 10) {
      return res.status(400).json({
        message: "Duplicate questions in submission",
      });
    }

    for (const id of questionIds) {
      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid questionId in answers",
        });
      }
    }

    // Parallel DB checks
    const [topicExists, unlocked, questions] = await Promise.all([
      Topic.exists({ _id: topicObjectId }),
      isLevelUnlocked(userId, topicId, level),
      Question.find({
        _id: { $in: questionIds },
        topicId: topicObjectId,
      }).lean(),
    ]);

    if (!topicExists) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    if (!unlocked) {
      return res.status(403).json({
        message: "Level is locked",
      });
    }

    if (questions.length !== 10) {
      return res.status(400).json({
        message: "Some questions are invalid or do not belong to topic",
      });
    }

    // Faster lookup using Map
    const questionMap = new Map();
    for (const q of questions) {
      questionMap.set(q._id.toString(), q);
    }

    const sessionId = new Types.ObjectId();

    const attemptDocs = new Array(10);

    let correctCount = 0;
    let guessedCount = 0;
    let totalTime = 0;

    for (let i = 0; i < 10; i++) {
      const ans = answers[i];
      const question = questionMap.get(ans.questionId);

      if (!question) {
        return res.status(400).json({
          message: "Invalid question submission detected",
        });
      }

      if (
        typeof ans.selectedOption !== "number" ||
        ans.selectedOption < 0 ||
        ans.selectedOption >= question.options.length
      ) {
        return res.status(400).json({
          message: "Invalid selected option",
        });
      }

      const isCorrect = ans.selectedOption === question.correctAnswer;

      if (isCorrect) correctCount++;
      if (ans.isGuess === true) guessedCount++;

      if (typeof ans.timeTaken === "number") {
        totalTime += ans.timeTaken;
      }

      attemptDocs[i] = {
        userId,
        topicId: topicObjectId,
        sessionId,
        questionId: ans.questionId,
        difficulty: question.difficulty,
        isCorrect,
        isGuess: ans.isGuess === true,
        timeTaken: ans.timeTaken || 0,
      };
    }

    // Atomic insert
    await Attempt.insertMany(attemptDocs, { ordered: false });

    const attempted = 10;
    const accuracy = correctCount / attempted;
    const strongCount = attempted - guessedCount;
    const avgTime = totalTime / attempted;

    let nextLevelUnlocked = false;

    if (level < 5) {
      nextLevelUnlocked = await isLevelUnlocked(
        userId,
        topicId,
        level + 1
      );
    }

    return res.status(200).json({
      sessionId,
      attempted,
      correct: correctCount,
      accuracy,
      averageTime: avgTime,
      confidenceSnapshot: {
        guessed: guessedCount,
        strong: strongCount,
      },
      nextLevelUnlocked,
    });

  } catch (error) {
    console.error("SubmitSession Error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};