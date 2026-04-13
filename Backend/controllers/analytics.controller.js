const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");
const Topic = require("../models/topic.model");
const Section = require("../models/section.model");

// ─────────────────────────────────────────────
const getISTDateString = (date) => {
  const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.toISOString().slice(0, 10);
};

// ============================================
// 1. PROFILE DASHBOARD
// ============================================
exports.getProfileDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const attemptsAgg = await Attempt.aggregate([
      { $match: { userId } },
      {
        $facet: {
          globalStats: [
            {
              $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                totalCorrect: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                uniqueQuestions: { $addToSet: "$questionId" },
              },
            },
            {
              $project: {
                totalAttempts: 1,
                totalCorrect: 1,
                totalUniqueSolved: { $size: "$uniqueQuestions" },
              },
            },
          ],

          sectionOverview: [
            {
              $lookup: {
                from: "topics",
                localField: "topicId",
                foreignField: "_id",
                as: "topic",
              },
            },
            { $unwind: "$topic" },
            {
              $lookup: {
                from: "sections",
                localField: "topic.sectionId",
                foreignField: "_id",
                as: "section",
              },
            },
            { $unwind: "$section" },
            {
              $group: {
                _id: "$section.name",
                uniqueQuestions: { $addToSet: "$questionId" },
                total: { $sum: 1 },
                correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
              },
            },
            {
              $project: {
                _id: 1,
                totalSolved: { $size: "$uniqueQuestions" },
                total: 1,
                correct: 1,
              },
            },
          ],

          difficultyProgress: [
            {
              $group: {
                _id: "$difficulty",
                total: { $sum: 1 },
                correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                uniqueSolved: { $addToSet: "$questionId" },
              },
            },
            {
              $project: {
                difficulty: "$_id",
                solved: { $size: "$uniqueSolved" },
                mastery: {
                  $cond: [
                    { $eq: ["$total", 0] },
                    0,
                    { $multiply: [{ $divide: ["$correct", "$total"] }, 100] },
                  ],
                },
              },
            },
          ],

          heatmap: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setDate(new Date().getDate() - 365)),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],

          streakData: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "Asia/Kolkata",
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const topicAgg = await Topic.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "topicId",
          as: "questions",
        },
      },
      {
        $lookup: {
          from: "attempts",
          let: { topicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$topicId", "$$topicId"] },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
            {
              $group: { _id: "$questionId" },
            },
          ],
          as: "uniqueAttempts",
        },
      },
      {
        $addFields: {
          totalQuestions: { $size: "$questions" },
          solved: { $size: "$uniqueAttempts" },
        },
      },
      {
        $project: {
          topicName: "$name",
          totalQuestions: 1,
          solved: 1,
          progressPercent: {
            $cond: [
              { $eq: ["$totalQuestions", 0] },
              0,
              { $multiply: [{ $divide: ["$solved", "$totalQuestions"] }, 100] },
            ],
          },
        },
      },
    ]);

    const data = attemptsAgg[0] || {};

    const totalAttempts = data.globalStats?.[0]?.totalAttempts || 0;
    const totalCorrect = data.globalStats?.[0]?.totalCorrect || 0;
    const totalUniqueSolved = data.globalStats?.[0]?.totalUniqueSolved || 0;

    const globalAccuracy = totalAttempts
      ? Number(((totalCorrect / totalAttempts) * 100).toFixed(2))
      : 0;

    const sectionOverview = (data.sectionOverview || []).map((s) => ({
      section: s._id,
      totalSolved: s.totalSolved,
      accuracy: s.total
        ? Number(((s.correct / s.total) * 100).toFixed(2))
        : 0,
    }));

    const difficultyProgress = (data.difficultyProgress || []).map((d) => ({
      difficulty: d.difficulty,
      solved: d.solved || 0,
      mastery: Number(d.mastery.toFixed(2)),
    }));

    ["easy", "medium", "hard"].forEach((level) => {
      if (!difficultyProgress.find((d) => d.difficulty === level)) {
        difficultyProgress.push({ difficulty: level, solved: 0, mastery: 0 });
      }
    });

    // Build a convenient lookup: { easy: N, medium: N, hard: N }
    const solvedByDifficulty = {};
    difficultyProgress.forEach((d) => {
      solvedByDifficulty[d.difficulty] = d.solved;
    });

    const heatmap = (data.heatmap || []).map((d) => ({
      date: d._id,
      solved: d.count,
    }));

    const topicProgress = topicAgg.map((t) => ({
      topicName: t.topicName,
      solved: t.solved,
      totalQuestions: t.totalQuestions,
      progressPercent: Number(t.progressPercent.toFixed(2)),
    }));

    let streak = 0;
    const dateSet = new Set((data.streakData || []).map((d) => d._id));
    const todayStr = getISTDateString(new Date());

    let currentDate = new Date();
    if (!dateSet.has(todayStr)) currentDate.setDate(currentDate.getDate() - 1);

    while (true) {
      const dateStr = getISTDateString(currentDate);
      if (dateSet.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else break;
    }

    return res.json({
      totalAttempts,
      totalUniqueSolved,
      globalAccuracy,
      sectionOverview,
      topicProgress,
      difficultyProgress,
      solvedByDifficulty,
      heatmap,
      streak,
    });
  } catch (error) {
    console.error("Profile Dashboard Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// ============================================
// 2. DASHBOARD OVERVIEW (CONSISTENT)
// ============================================
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // ───────── GLOBAL METRICS ─────────
    const globalAgg = await Attempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          totalCorrect: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          uniqueQuestions: { $addToSet: "$questionId" }, // ✅ FIX
        },
      },
      {
        $project: {
          totalAttempts: 1,
          totalCorrect: 1,
          totalUniqueSolved: { $size: "$uniqueQuestions" },
        },
      },
    ]);

    const totalAttempts = globalAgg[0]?.totalAttempts || 0;
    const totalCorrect = globalAgg[0]?.totalCorrect || 0;
    const totalUniqueSolved = globalAgg[0]?.totalUniqueSolved || 0;

    const accuracy = totalAttempts
      ? Number(((totalCorrect / totalAttempts) * 100).toFixed(1))
      : 0;

    // ───────── READINESS (difficulty-based) ─────────
    const difficultyAgg = await Attempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$difficulty",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]);

    const diffMap = {};
    difficultyAgg.forEach((d) => {
      diffMap[d._id] = d.total ? (d.correct / d.total) * 100 : 0;
    });

    const hardMastery = diffMap["hard"] || 0;

    const readiness = Math.min(
      100,
      Math.round(accuracy * 0.5 + hardMastery * 0.5)
    );

    // ───────── SECTION ANALYTICS (RESTORED CORRECTLY) ─────────
    const [allSections, sectionAgg] = await Promise.all([
      Section.find().select("name").lean(),

      Attempt.aggregate([
        { $match: { userId } },

        {
          $lookup: {
            from: "topics",
            localField: "topicId",
            foreignField: "_id",
            as: "topic",
          },
        },
        { $unwind: "$topic" },

        {
          $lookup: {
            from: "sections",
            localField: "topic.sectionId",
            foreignField: "_id",
            as: "section",
          },
        },
        { $unwind: "$section" },

        {
          $group: {
            _id: {
              section: "$section.name",
              difficulty: "$difficulty",
            },
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          },
        },
      ]),
    ]);

    const sectionMap = {};

    // Initialize all sections
    allSections.forEach((s) => {
      sectionMap[s.name] = {
        title: s.name,
        easy: 0,
        medium: 0,
        hard: 0,
        attempts: 0,
        correct: 0,
      };
    });

    // Merge real data
    sectionAgg.forEach((row) => {
      const name = row._id.section;
      const diff = row._id.difficulty;

      if (!sectionMap[name]) return;

      const mastery = row.total ? (row.correct / row.total) * 100 : 0;

      sectionMap[name][diff] = Number(mastery.toFixed(0));
      sectionMap[name].attempts += row.total;
      sectionMap[name].correct += row.correct;
    });

    const sectionCards = Object.values(sectionMap).map((sec) => {
      const overall = sec.attempts
        ? Number(((sec.correct / sec.attempts) * 100).toFixed(0))
        : 0;

      let status = "Not Started";
      if (overall >= 80) status = "Mastered";
      else if (overall > 0) status = "In Progress";

      return {
        title: sec.title,
        status,
        easy: sec.easy,
        med: sec.medium,
        hard: sec.hard,
        overall,
        attempts: sec.attempts,
      };
    });

    // ───────── WEEKLY ACTIVITY ─────────
const nowIST = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
);

// Start of today in IST
nowIST.setHours(23, 59, 59, 999);

const last7Days = new Date(nowIST);
last7Days.setDate(last7Days.getDate() - 6);
last7Days.setHours(0, 0, 0, 0);

const weeklyAgg = await Attempt.aggregate([
  {
  $match: {
    userId,
    createdAt: {
      $gte: last7Days,
      $lte: nowIST
    }
  },
  },
  {
    $group: {
      _id: {
  $dayOfWeek: {
    date: "$createdAt",
    timezone: "Asia/Kolkata"
  }
},
      count: { $sum: 1 }
    }
  }
]);

    const dayMap = {
      1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed",
      5: "Thu", 6: "Fri", 7: "Sat"
    };

    const weeklyMap = {};

weeklyAgg.forEach((x) => {
  weeklyMap[x._id] = x.count;
});

// Mongo: 1=Sun ... 7=Sat
const dailyMap = {};

// Build IST date string map
weeklyAgg.forEach((x) => {
  const day = x._id; // 1–7
  dailyMap[day] = x.count;
});

// Build rolling 7 days (today last)
const weekly = [];

for (let i = 6; i >= 0; i--) {
  const d = new Date(nowIST);
  d.setDate(d.getDate() - i);

  const dayOfWeek = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  ).getDay(); // 0=Sun

  const mongoDay = dayOfWeek === 0 ? 1 : dayOfWeek + 1;

  weekly.push(dailyMap[mongoDay] || 0);
}

    // ───────── RESPONSE ─────────
    return res.json({
      metrics: {
        accuracy,
        solved: totalUniqueSolved, // ✅ consistent everywhere
        readiness,
        rank: null,
      },
      sections: sectionCards,
      weeklyAttempts: weekly,
    });

  } catch (err) {
    console.error("Dashboard Overview Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ============================================
// 3. RECENT TOPICS
// ============================================
exports.getRecentTopics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const recent = await Attempt.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:          "$topicId",
          lastPracticed: { $first: "$createdAt" },
          attempts:     { $sum: 1 },
          correct:      { $sum: { $cond: ["$isCorrect", 1, 0] } },
          easyTotal:    { $sum: { $cond: [{ $eq: ["$difficulty", "easy"]   }, 1, 0] } },
          easyCorrect:  { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "easy"]   }, "$isCorrect"] }, 1, 0] } },
          medTotal:     { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
          medCorrect:   { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "medium"] }, "$isCorrect"] }, 1, 0] } },
          hardTotal:    { $sum: { $cond: [{ $eq: ["$difficulty", "hard"]   }, 1, 0] } },
          hardCorrect:  { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "hard"]   }, "$isCorrect"] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          accuracy: { $cond: [{ $eq: ["$attempts", 0] }, 0, { $multiply: [{ $divide: ["$correct",      "$attempts"]  }, 100] }] },
          easyPct:  { $cond: [{ $eq: ["$easyTotal", 0] }, 0, { $multiply: [{ $divide: ["$easyCorrect", "$easyTotal"] }, 100] }] },
          medPct:   { $cond: [{ $eq: ["$medTotal",  0] }, 0, { $multiply: [{ $divide: ["$medCorrect",  "$medTotal"]  }, 100] }] },
          hardPct:  { $cond: [{ $eq: ["$hardTotal", 0] }, 0, { $multiply: [{ $divide: ["$hardCorrect", "$hardTotal"] }, 100] }] },
        },
      },
      {
        $lookup: {
          from: "topics", localField: "_id", foreignField: "_id", as: "topic",
        },
      },
      { $unwind: "$topic" },
      {
        $project: {
          _id:          0,
          topicId:      "$_id",
          sectionId:    "$topic.sectionId",
          topicName:    "$topic.name",
          attempts:     1,
          lastPracticed: 1,
          overall:      { $round: ["$accuracy", 0] },
          easy:         { $round: ["$easyPct",  0] },
          med:          { $round: ["$medPct",   0] },
          hard:         { $round: ["$hardPct",  0] },
        },
      },
      { $sort:  { lastPracticed: -1 } },
      { $limit: 5 },
    ]);

    return res.json(recent);
  } catch (err) {
    console.error("Recent Topics Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// 4. WEAK TOPICS
// ============================================
exports.getWeakTopics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const weak = await Attempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id:         "$topicId",
          attempts:    { $sum: 1 },
          correct:     { $sum: { $cond: ["$isCorrect", 1, 0] } },
          easyTotal:   { $sum: { $cond: [{ $eq: ["$difficulty", "easy"]   }, 1, 0] } },
          easyCorrect: { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "easy"]   }, "$isCorrect"] }, 1, 0] } },
          medTotal:    { $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] } },
          medCorrect:  { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "medium"] }, "$isCorrect"] }, 1, 0] } },
          hardTotal:   { $sum: { $cond: [{ $eq: ["$difficulty", "hard"]   }, 1, 0] } },
          hardCorrect: { $sum: { $cond: [{ $and: [{ $eq: ["$difficulty", "hard"]   }, "$isCorrect"] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          progressPercent: { $cond: [{ $eq: ["$attempts",  0] }, 0, { $multiply: [{ $divide: ["$correct",      "$attempts"]  }, 100] }] },
          easyPct:         { $cond: [{ $eq: ["$easyTotal", 0] }, 0, { $multiply: [{ $divide: ["$easyCorrect", "$easyTotal"] }, 100] }] },
          medPct:          { $cond: [{ $eq: ["$medTotal",  0] }, 0, { $multiply: [{ $divide: ["$medCorrect",  "$medTotal"]  }, 100] }] },
          hardPct:         { $cond: [{ $eq: ["$hardTotal", 0] }, 0, { $multiply: [{ $divide: ["$hardCorrect", "$hardTotal"] }, 100] }] },
        },
      },
      { $match: { attempts: { $gte: 20 } } },
      { $sort:  { progressPercent: 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "topics", localField: "_id", foreignField: "_id", as: "topic",
        },
      },
      { $unwind: "$topic" },
      {
        $project: {
          _id:       0,
          topicId:   "$_id",
          sectionId: "$topic.sectionId",
          topicName: "$topic.name",
          attempts:  1,
          overall:   { $round: ["$progressPercent", 0] },
          easy:      { $round: ["$easyPct",         0] },
          med:       { $round: ["$medPct",          0] },
          hard:      { $round: ["$hardPct",         0] },
        },
      },
    ]);

    return res.json(weak);
  } catch (err) {
    console.error("Weak Topics Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// 5. PRACTICE HOME
// ============================================
exports.getPracticeHome = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const sections = await Section.aggregate([
      {
        $lookup: {
          from: "topics", localField: "_id", foreignField: "sectionId", as: "topics",
        },
      },
      {
        $addFields: {
          topicIds:   "$topics._id",
          topicCount: { $size: "$topics" },
        },
      },
      {
        $lookup: {
          from: "attempts",
          let:  { topicIds: "$topicIds" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId",   userId] },
                    { $in: ["$topicId", "$$topicIds"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id:     "$difficulty",
                attempts: { $sum: 1 },
                correct:  { $sum: { $cond: ["$isCorrect", 1, 0] } },
              },
            },
          ],
          as: "difficultyStats",
        },
      },
      {
        $addFields: {
          easy: {
            $ifNull: [{ $let: { vars: { item: { $first: { $filter: { input: "$difficultyStats", cond: { $eq: ["$$this._id", "easy"]   } } } } }, in: "$$item.attempts" } }, 0],
          },
          medium: {
            $ifNull: [{ $let: { vars: { item: { $first: { $filter: { input: "$difficultyStats", cond: { $eq: ["$$this._id", "medium"] } } } } }, in: "$$item.attempts" } }, 0],
          },
          hard: {
            $ifNull: [{ $let: { vars: { item: { $first: { $filter: { input: "$difficultyStats", cond: { $eq: ["$$this._id", "hard"]   } } } } }, in: "$$item.attempts" } }, 0],
          },
          attempts: { $sum: "$difficultyStats.attempts" },
          correct:  { $sum: "$difficultyStats.correct"  },
        },
      },
      {
        $addFields: {
          overall: {
            $cond: [
              { $eq: ["$attempts", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$correct", "$attempts"] }, 100] }, 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id:         0,
          sectionId:   "$_id",
          sectionName: "$name",
          topicCount:  1,
          attempts:    1,
          easy:        1,
          medium:      1,
          hard:        1,
          overall:     1,
        },
      },
      { $sort: { sectionName: 1 } },
    ]);

    res.json({ sections });
  } catch (err) {
    console.error("Practice Home Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// 6. SECTION TOPICS
// ============================================
exports.getSectionTopics = async (req, res) => {
  try {
    const userId    = new mongoose.Types.ObjectId(req.user.id);
    const sectionId = new mongoose.Types.ObjectId(req.params.sectionId);
    const sectionDoc = await Section.findById(sectionId).lean();

    if (!sectionDoc) {
      return res.status(404).json({ message: "Section not found" });
    }

    const topics = await Topic.aggregate([
      { $match: { sectionId } },
      {
        $lookup: {
          from: "attempts",
          let:  { topicId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$topicId", "$$topicId"] },
                    { $eq: ["$userId",  userId] },
                  ],
                },
              },
            },
          ],
          as: "attempts",
        },
      },
      {
        $addFields: {
          totalAttempts: { $size: "$attempts" },
          uniqueQuestionIds: {
            $reduce: {
              input:        "$attempts",
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.questionId", "$$value"] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this.questionId"]] },
                ],
              },
            },
          },
          correct: {
            $size: { $filter: { input: "$attempts", as: "a", cond: "$$a.isCorrect" } },
          },
          easyAttempts: {
            $filter: { input: "$attempts", as: "a", cond: { $eq: ["$$a.difficulty", "easy"]   } },
          },
          medAttempts: {
            $filter: { input: "$attempts", as: "a", cond: { $eq: ["$$a.difficulty", "medium"] } },
          },
          hardAttempts: {
            $filter: { input: "$attempts", as: "a", cond: { $eq: ["$$a.difficulty", "hard"]   } },
          },
        },
      },
      {
        $addFields: {
          solved: { $size: "$uniqueQuestionIds" },
          easy: {
            $multiply: [
              { $divide: [{ $size: { $filter: { input: "$easyAttempts", as: "e", cond: "$$e.isCorrect" } } }, { $max: [{ $size: "$easyAttempts" }, 1] }] },
              100,
            ],
          },
          med: {
            $multiply: [
              { $divide: [{ $size: { $filter: { input: "$medAttempts",  as: "m", cond: "$$m.isCorrect" } } }, { $max: [{ $size: "$medAttempts"  }, 1] }] },
              100,
            ],
          },
          hard: {
            $multiply: [
              { $divide: [{ $size: { $filter: { input: "$hardAttempts", as: "h", cond: "$$h.isCorrect" } } }, { $max: [{ $size: "$hardAttempts" }, 1] }] },
              100,
            ],
          },
        },
      },
      {
        $addFields: {
          overall: {
            $cond: [
              { $eq: ["$totalAttempts", 0] },
              0,
              { $multiply: [{ $divide: ["$correct", "$totalAttempts"] }, 100] },
            ],
          },
        },
      },
      {
        $project: {
          topicId:  "$_id",
          topicName: "$name",
          order:    1,
          attempts: "$totalAttempts",
          solved:   1,
          easy:     { $round: ["$easy",    0] },
          med:      { $round: ["$med",     0] },
          hard:     { $round: ["$hard",    0] },
          overall:  { $round: ["$overall", 0] },
        },
      },
      { $sort: { order: 1 } },
    ]);

    res.json({
      sectionName: sectionDoc.name,
      topics,
    });
  } catch (err) {
    console.error("Section Topics Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================
// 7. USER RANK
// ============================================
exports.getUserRank = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const userStats = await Attempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id:     "$difficulty",
          total:   { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]);

    let total = 0, correct = 0, hardTotal = 0, hardCorrect = 0;

    userStats.forEach((s) => {
      total   += s.total;
      correct += s.correct;
      if (s._id === "hard") {
        hardTotal   = s.total;
        hardCorrect = s.correct;
      }
    });

    const accuracy    = total     ? (correct     / total)     * 100 : 0;
    const hardMastery = hardTotal ? (hardCorrect / hardTotal) * 100 : 0;
    const myReadiness = Math.min(100, Math.round(accuracy * 0.5 + hardMastery * 0.5));

    const higherUsers = await Attempt.aggregate([
      {
        $group: {
          _id: { userId: "$userId", difficulty: "$difficulty" },
          total:   { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
      {
        $group: {
          _id:   "$_id.userId",
          stats: { $push: { difficulty: "$_id.difficulty", total: "$total", correct: "$correct" } },
        },
      },
      {
        $addFields: {
          totalAttempts: { $sum: "$stats.total"   },
          totalCorrect:  { $sum: "$stats.correct" },
          hardStat: {
            $first: {
              $filter: { input: "$stats", cond: { $eq: ["$$this.difficulty", "hard"] } },
            },
          },
        },
      },
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $eq: ["$totalAttempts", 0] },
              0,
              { $multiply: [{ $divide: ["$totalCorrect", "$totalAttempts"] }, 100] },
            ],
          },
          hardMastery: {
            $cond: [
              { $gt: ["$hardStat.total", 0] },
              { $multiply: [{ $divide: ["$hardStat.correct", "$hardStat.total"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          readiness: {
            $min: [
              100,
              { $round: [{ $add: [{ $multiply: ["$accuracy", 0.5] }, { $multiply: ["$hardMastery", 0.5] }] }, 0] },
            ],
          },
        },
      },
      { $match: { readiness: { $gt: myReadiness } } },
      { $count: "higherUsers" },
    ]);

    const higherCount = higherUsers[0]?.higherUsers || 0;

    return res.json({
      rank:      higherCount + 1,
      readiness: myReadiness,
    });
  } catch (error) {
    console.error("User Rank Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};