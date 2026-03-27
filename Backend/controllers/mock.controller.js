const mongoose = require("mongoose");
const Company = require("../models/company.model");
const MockConfig = require("../models/mockConfig.model");
const MockAttempt = require("../models/mockAttempt.model");
const MockAttemptQuestion = require("../models/mockAttemptQuestion.model");
const Question = require("../models/question.model");
const { buildMockPaper } = require("../utils/MockpaperBuilder");
const Section = require("../models/section.model");
// ============================================================
// 1. GET ALL COMPANIES
// Public — no auth needed. Frontend uses this to show company list.
// ============================================================
exports.getCompanies = async (req, res) => {
  try {
    // Only return companies that have a MockConfig seeded
    const configs = await MockConfig.find()
      .populate("companyId", "name logoUrl description")
      .lean();

    const companies = configs
      .filter((c) => c.companyId) // guard against orphaned configs
      .map((c) => ({
        companyId: c.companyId._id,
        name: c.companyId.name,
        logoUrl: c.companyId.logoUrl,
        description: c.companyId.description,
        duration: c.duration, // minutes
        totalQuestions: c.sections.reduce((sum, s) => sum + s.questionCount, 0),
        sections: c.sections.length,
      }));

    return res.json({ companies });
  } catch (err) {
    console.error("GetCompanies Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// 2. GENERATE MOCK
// Creates a MockAttempt with frozen questions.
// Paper is frozen here — not at start time.
// Same user can call this multiple times → gets a fresh paper each time.
// ============================================================
exports.generateMock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.body;

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid companyId" });
    }

    // Fetch MockConfig with sections
    const config = await MockConfig.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).lean();

    if (!config) {
      return res.status(404).json({ message: "No mock config found for this company" });
    }

    // Build the frozen paper (random question selection)
    const frozenQuestions = await buildMockPaper(config.sections);

    if (frozenQuestions.length === 0) {
      return res.status(503).json({
        message: "Not enough questions in database to generate this mock. Please try again later.",
      });
    }

    // Create MockAttempt — status: "generated", startedAt: null (set on first start)
    const mockAttempt = await MockAttempt.create({
      userId: new mongoose.Types.ObjectId(userId),
      companyId: new mongoose.Types.ObjectId(companyId),
      frozenQuestions,
      duration: config.duration * 60, // convert minutes → seconds
      status: "generated",
      startedAt: null,
      submittedAt: null,
    });

    return res.status(201).json({
      mockAttemptId: mockAttempt._id,
      totalQuestions: frozenQuestions.length,
      duration: config.duration, // minutes — for frontend display
    });
  } catch (err) {
    console.error("GenerateMock Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.startMock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mockAttemptId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mockAttemptId)) {
      return res.status(400).json({ message: "Invalid mockAttemptId" });
    }

    const attempt = await MockAttempt.findOne({
      _id: mockAttemptId,
      userId,
    }).lean();

    if (!attempt) {
      return res.status(404).json({ message: "Mock attempt not found" });
    }

    if (attempt.status === "submitted") {
      return res.status(400).json({ message: "This mock has already been submitted" });
    }

    // Set startedAt only once
    if (!attempt.startedAt) {
      const now = new Date();
      await MockAttempt.updateOne(
        { _id: attempt._id },
        { $set: { startedAt: now } }
      );
      attempt.startedAt = now;
    }

        const sectionIds = [...new Set(attempt.frozenQuestions.map(fq => fq.sectionId.toString()))];

    const sectionsFromDB = await Section.find({
      _id: { $in: sectionIds }
    })
    .select("_id name")
    .lean();

    const sectionMap = new Map(
      sectionsFromDB.map(s => [s._id.toString(), s.name])
    );

    // Compute remaining time
    const elapsed = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const remainingSeconds = Math.max(0, attempt.duration - elapsed);

    if (remainingSeconds === 0) {
      return res.status(400).json({
        message: "Time limit exceeded. Please submit your test.",
        expired: true,
      });
    }

    // Fetch questions
    const questionIds = attempt.frozenQuestions.map((fq) => fq.questionId);

    const questions = await Question.find({ _id: { $in: questionIds } })
      .select("_id text options difficulty topicId")
      .lean();

    // Map for quick lookup
    const questionMap = new Map(
      questions.map((q) => [q._id.toString(), q])
    );

    // ✅ STEP 1: Preserve frozen order + attach sectionId
    const orderedQuestions = attempt.frozenQuestions
      .map((fq) => {
        const q = questionMap.get(fq.questionId.toString());
        if (!q) return null;

        return {
          ...q,
          sectionId: fq.sectionId,
        };
      })
      .filter(Boolean);

    // ✅ STEP 2: Group AFTER ordering (CRITICAL FIX)
    const grouped = {};

    for (const q of orderedQuestions) {
      const sectionId = q.sectionId.toString();

      if (!grouped[sectionId]) {
        grouped[sectionId] = {
          _id: sectionId,
          name: sectionMap.get(sectionId) || "Unknown", // can map real names later
          questions: [],
        };
      }

      grouped[sectionId].questions.push(q);
    }

    const sections = Object.values(grouped);
    let logObj={
      mockAttemptId: attempt._id,
      startedAt: attempt.startedAt,
      remainingSeconds,
      duration: attempt.duration,
      totalQuestions: orderedQuestions.length,
      sections, // ✅ correct structure for frontend
    }
    console.log(logObj)

    // ✅ Final response
    return res.json({
      mockAttemptId: attempt._id,
      startedAt: attempt.startedAt,
      remainingSeconds,
      duration: attempt.duration,
      totalQuestions: orderedQuestions.length,
      sections, // ✅ correct structure for frontend
    });
  } catch (err) {
    console.error("StartMock Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// 4. SUBMIT MOCK
// Server-side timer validation — rejects if time exceeded.
// Accepts partial answers (skipped questions counted as wrong).
// Writes to MockAttemptQuestion — never touches Attempt collection.
// ============================================================
exports.submitMock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mockAttemptId } = req.params;
    const { answers } = req.body;
    // answers: [{ questionId, selectedAnswer (number | null), timeTaken }]

    if (!mongoose.Types.ObjectId.isValid(mockAttemptId)) {
      return res.status(400).json({ message: "Invalid mockAttemptId" });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "answers must be an array" });
    }

    const attempt = await MockAttempt.findOne({
      _id: mockAttemptId,
      userId,
    }).lean();

    if (!attempt) {
      return res.status(404).json({ message: "Mock attempt not found" });
    }

    if (attempt.status === "submitted") {
      return res.status(400).json({ message: "Already submitted" });
    }

    if (!attempt.startedAt) {
      return res.status(400).json({ message: "Test was never started" });
    }

    // ── SERVER-SIDE TIMER VALIDATION ─────────────────────────────
    // Core engineering decision: frontend timer is display-only
    // Backend is the source of truth for time
    const elapsed = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const GRACE_PERIOD_SECONDS = 30; // allow 30s network buffer
    if (elapsed > attempt.duration + GRACE_PERIOD_SECONDS) {
      return res.status(400).json({
        message: "Submission rejected: time limit exceeded",
        elapsed,
        duration: attempt.duration,
      });
    }

    // ── BUILD ANSWER MAP ──────────────────────────────────────────
    const answerMap = new Map();
    for (const ans of answers) {
      if (!ans.questionId || !mongoose.Types.ObjectId.isValid(ans.questionId)) continue;
      answerMap.set(ans.questionId.toString(), {
        selectedAnswer: typeof ans.selectedAnswer === "number" ? ans.selectedAnswer : null,
        timeTaken: typeof ans.timeTaken === "number" ? ans.timeTaken : 0,
      });
    }

    // ── FETCH CORRECT ANSWERS ─────────────────────────────────────
    const questionIds = attempt.frozenQuestions.map((fq) => fq.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } })
      .select("_id correctAnswer options")
      .lean();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // Build sectionId lookup
    const sectionMapFrozen = {};
    for (const fq of attempt.frozenQuestions) {
      sectionMapFrozen[fq.questionId.toString()] = fq.sectionId;
    }

    // ── COMPUTE RESULTS ───────────────────────────────────────────
    const attemptQuestionDocs = [];

    for (const fq of attempt.frozenQuestions) {
      const qIdStr = fq.questionId.toString();
      const question = questionMap.get(qIdStr);
      if (!question) continue;

      const submitted = answerMap.get(qIdStr);
      const selectedAnswer = submitted?.selectedAnswer ?? null;
      const timeTaken = submitted?.timeTaken ?? 0;

      const isCorrect =
        selectedAnswer !== null &&
        selectedAnswer >= 0 &&
        selectedAnswer < question.options.length &&
        selectedAnswer === question.correctAnswer;

      attemptQuestionDocs.push({
        mockAttemptId: attempt._id,
        questionId: fq.questionId,
        sectionId: fq.sectionId,
        selectedAnswer,
        isCorrect,
        timeTaken,
      });
    }

    // ── ATOMIC WRITE ──────────────────────────────────────────────
    const submittedAt = new Date();

    await Promise.all([
      MockAttemptQuestion.insertMany(attemptQuestionDocs, { ordered: false }),
      MockAttempt.updateOne(
        { _id: attempt._id },
        { $set: { status: "submitted", submittedAt } }
      ),
    ]);

    // ── QUICK SUMMARY (same as result but lighter — no populate) ──
    const totalQuestions = attemptQuestionDocs.length;
    const correct = attemptQuestionDocs.filter((q) => q.isCorrect).length;
    const attempted = attemptQuestionDocs.filter((q) => q.selectedAnswer !== null).length;
    const accuracy = totalQuestions > 0 ? Number(((correct / totalQuestions) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      mockAttemptId: attempt._id,
      totalQuestions,
      attempted,
      correct,
      accuracy,
      timeTaken: elapsed,
      submittedAt,
    });
  } catch (err) {
    console.error("SubmitMock Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// 5. GET MOCK RESULT
// Full result with section-wise analytics.
// Always computed from MockAttemptQuestion — never stored.
// ============================================================
exports.getMockResult = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mockAttemptId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mockAttemptId)) {
      return res.status(400).json({ message: "Invalid mockAttemptId" });
    }

    const attempt = await MockAttempt.findOne({
      _id: mockAttemptId,
      userId,
    })
      .populate("companyId", "name logoUrl")
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: "Mock attempt not found" });
    }

    if (attempt.status !== "submitted") {
      return res.status(400).json({ message: "Mock not yet submitted" });
    }

    // Fetch all MockAttemptQuestions with question + section details
    const attemptQuestions = await MockAttemptQuestion.find({
      mockAttemptId: attempt._id,
    })
      .populate({
        path: "questionId",
        select: "text options correctAnswer difficulty",
      })
      .populate("sectionId", "name")
      .lean();

    if (!attemptQuestions.length) {
      return res.status(404).json({ message: "No result data found" });
    }

    // ── OVERALL STATS ─────────────────────────────────────────────
    const totalQuestions = attemptQuestions.length;
    let totalCorrect = 0;
    let totalAttempted = 0;
    let totalTime = 0;

    // ── SECTION-WISE STATS ────────────────────────────────────────
    const sectionStatsMap = {};

    for (const aq of attemptQuestions) {
      const sectionId = aq.sectionId._id.toString();
      const sectionName = aq.sectionId.name;

      if (!sectionStatsMap[sectionId]) {
        sectionStatsMap[sectionId] = {
          sectionId,
          sectionName,
          total: 0,
          correct: 0,
          attempted: 0,
          timeTaken: 0,
        };
      }

      sectionStatsMap[sectionId].total++;
      sectionStatsMap[sectionId].timeTaken += aq.timeTaken || 0;

      if (aq.selectedAnswer !== null) {
        sectionStatsMap[sectionId].attempted++;
        totalAttempted++;
      }
      if (aq.isCorrect) {
        sectionStatsMap[sectionId].correct++;
        totalCorrect++;
      }

      totalTime += aq.timeTaken || 0;
    }

    const sectionStats = Object.values(sectionStatsMap).map((s) => ({
      sectionId: s.sectionId,
      sectionName: s.sectionName,
      total: s.total,
      attempted: s.attempted,
      correct: s.correct,
      accuracy: s.attempted > 0
        ? Number(((s.correct / s.attempted) * 100).toFixed(2))
        : 0,
      score: `${s.correct}/${s.total}`,
    }));

    const overallAccuracy = totalAttempted > 0
      ? Number(((totalCorrect / totalAttempted) * 100).toFixed(2))
      : 0;

    // ── DETAILED REVIEW LIST ──────────────────────────────────────
    const review = attemptQuestions.map((aq) => ({
      questionId: aq.questionId._id,
      question: aq.questionId.text,
      options: aq.questionId.options,
      correctAnswer: aq.questionId.correctAnswer,
      selectedAnswer: aq.selectedAnswer,
      isCorrect: aq.isCorrect,
      difficulty: aq.questionId.difficulty,
      sectionName: aq.sectionId.name,
      timeTaken: aq.timeTaken,
    }));

    const durationTaken = attempt.submittedAt && attempt.startedAt
      ? Math.floor(
          (new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000
        )
      : null;

    return res.json({
      company: attempt.companyId,
      submittedAt: attempt.submittedAt,
      durationAllowed: attempt.duration, // seconds
      durationTaken, // seconds
      overall: {
        totalQuestions,
        attempted: totalAttempted,
        correct: totalCorrect,
        accuracy: overallAccuracy,
        score: `${totalCorrect}/${totalQuestions}`,
      },
      sectionStats,
      review,
    });
  } catch (err) {
    console.error("GetMockResult Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================================
// 6. GET USER MOCK HISTORY
// List of all completed mocks for a user — lightweight, no review
// ============================================================
exports.getMockHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const attempts = await MockAttempt.find({
      userId,
      status: "submitted",
    })
      .populate("companyId", "name logoUrl")
      .sort({ submittedAt: -1 })
      .lean();

    if (!attempts.length) {
      return res.json({ history: [] });
    }

    const attemptIds = attempts.map((a) => a._id);

    // Aggregate scores per mockAttemptId in one query
    const scoreAgg = await MockAttemptQuestion.aggregate([
      { $match: { mockAttemptId: { $in: attemptIds } } },
      {
        $group: {
          _id: "$mockAttemptId",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          attempted: {
            $sum: {
              $cond: [{ $ne: ["$selectedAnswer", null] }, 1, 0],
            },
          },
        },
      },
    ]);

    const scoreMap = new Map(scoreAgg.map((s) => [s._id.toString(), s]));

    const history = attempts.map((a) => {
      const s = scoreMap.get(a._id.toString()) || { total: 0, correct: 0, attempted: 0 };
      const accuracy = s.attempted > 0
        ? Number(((s.correct / s.attempted) * 100).toFixed(2))
        : 0;
      const durationTaken = a.submittedAt && a.startedAt
        ? Math.floor((new Date(a.submittedAt) - new Date(a.startedAt)) / 1000)
        : null;

      return {
        mockAttemptId: a._id,
        company: a.companyId,
        submittedAt: a.submittedAt,
        durationAllowed: a.duration,
        durationTaken,
        score: `${s.correct}/${s.total}`,
        accuracy,
      };
    });

    return res.json({ history });
  } catch (err) {
    console.error("GetMockHistory Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};