const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");

// ============================================
// 1. SESSION SUMMARY
// ============================================
module.exports.getSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const attempts = await Attempt.find({ userId, sessionId });

    if (!attempts.length) {
      return res.status(404).json({ message: "No attempts found for this session" });
    }

    const totalQuestions = attempts.length;

    let correctCount = 0;
    let guessedCount = 0;
    let strongCount = 0;
    let totalTime = 0;

    attempts.forEach((attempt) => {
      if (attempt.isCorrect) {
        correctCount++;
        if (!attempt.isGuess) strongCount++;
      }
      if (attempt.isGuess) guessedCount++;
      totalTime += attempt.timeTaken || 0;
    });

    const accuracy = Number(((correctCount / totalQuestions) * 100).toFixed(2));
    const avgTime = Number((totalTime / totalQuestions).toFixed(2));

    return res.json({
      totalQuestions,
      correct: correctCount,
      accuracy,
      averageTime: avgTime,
      confidenceSnapshot: {
        guessed: guessedCount,
        strong: strongCount,
      },
    });
  } catch (error) {
    console.error("Session Summary Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// 2. ATTEMPT REVIEW
// ============================================
module.exports.getAttemptReview = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { filter } = req.query;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const query = { userId, sessionId };

    if (filter === "incorrect") {
      query.isCorrect = false;
    }

    const attempts = await Attempt.find(query)
      .select("questionId sessionId selectedOption isCorrect timeTaken createdAt")
      .populate({
        path: "questionId",
        select: "text options correctAnswer difficulty",
      })
      .sort({ createdAt: 1 })
      .lean();

    if (!attempts.length) {
      return res.status(404).json({ message: "No review data found" });
    }

    const review = [];
    const accuracyVsTime = [];

    let correct = 0;
    let totalTime = 0;

    for (const attempt of attempts) {
      const time = attempt.timeTaken || 0;
      const isCorrect = attempt.isCorrect;

      if (isCorrect) correct++;
      totalTime += time;

      review.push({
        // ─── FIX BUG 9 — typo was attempt.sesessionId ───
        sessionId: attempt.sessionId,
        questionId: attempt.questionId._id,
        question: attempt.questionId.text,
        options: attempt.questionId.options,
        userAnswer: attempt.selectedOption,
        correctAnswer: attempt.questionId.correctAnswer,
        isCorrect,
        difficulty: attempt.questionId.difficulty,
        timeTaken: time,
      });

      accuracyVsTime.push({
        time,
        correct: isCorrect ? 1 : 0,
      });
    }

    const totalQuestions = attempts.length;
    const accuracy = Number(((correct / totalQuestions) * 100).toFixed(2));
    const averageTime = Number((totalTime / totalQuestions).toFixed(2));

    return res.json({
      review,
      analytics: {
        totalQuestions,
        correct,
        accuracy,
        averageTime,
        accuracyVsTime,
      },
    });
  } catch (error) {
    console.error("Attempt Review Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};