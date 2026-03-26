const mongoose = require("mongoose");
const Attempt = require("../models/attempt.model");
const Topic = require("../models/topic.model");
const Section = require("../models/section.model");

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
                totalCorrect: {
                  $sum: { $cond: ["$isCorrect", 1, 0] }
                }
              }
            }
          ],

          sectionOverview: [
            {
              $lookup: {
                from: "topics",
                localField: "topicId",
                foreignField: "_id",
                as: "topic"
              }
            },
            { $unwind: "$topic" },
            {
              $lookup: {
                from: "sections",
                localField: "topic.sectionId",
                foreignField: "_id",
                as: "section"
              }
            },
            { $unwind: "$section" },
            {
              $group: {
                _id: "$section.name",
                total: { $sum: 1 },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] }
                }
              }
            }
          ],

          difficultyProgress: [
            {
              $group: {
                _id: "$difficulty",
                total: { $sum: 1 },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] }
                }
              }
            },
            {
              $project: {
                difficulty: "$_id",
                mastery: {
                  $cond: [
                    { $eq: ["$total", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$correct", "$total"] },
                        100
                      ]
                    }
                  ]
                }
              }
            }
          ],

          heatmap: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(
                    new Date().setDate(new Date().getDate() - 365)
                  )
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],

          // ✅ ADDED (timezone safe grouping)
          streakData: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                    timezone: "Asia/Kolkata"
                  }
                }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const topicAgg = await Topic.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "topicId",
          as: "questions"
        }
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
                    { $eq: ["$userId", userId] }
                  ]
                }
              }
            }
          ],
          as: "attempts"
        }
      },
      {
        $addFields: {
          totalQuestions: { $size: "$questions" },
          solved: { $size: "$attempts" }
        }
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
              {
                $multiply: [
                  { $divide: ["$solved", "$totalQuestions"] },
                  100
                ]
              }
            ]
          }
        }
      }
    ]);

    const data = attemptsAgg[0] || {};

    const totalAttempts = data.globalStats?.[0]?.totalAttempts || 0;
    const totalCorrect = data.globalStats?.[0]?.totalCorrect || 0;

    const globalAccuracy = totalAttempts
      ? Number(((totalCorrect / totalAttempts) * 100).toFixed(2))
      : 0;

    const sectionOverview = (data.sectionOverview || []).map(s => ({
      section: s._id,
      totalSolved: s.total,
      accuracy: s.total
        ? Number(((s.correct / s.total) * 100).toFixed(2))
        : 0
    }));

    const difficultyProgress = (data.difficultyProgress || []).map(d => ({
      difficulty: d.difficulty,
      mastery: Number(d.mastery.toFixed(2))
    }));

    ["easy", "medium", "hard"].forEach(level => {
      if (!difficultyProgress.find(d => d.difficulty === level)) {
        difficultyProgress.push({ difficulty: level, mastery: 0 });
      }
    });

    const heatmap = (data.heatmap || []).map(d => ({
      date: d._id,
      solved: d.count
    }));

    const topicProgress = topicAgg.map(t => ({
      topicName: t.topicName,
      solved: t.solved,
      totalQuestions: t.totalQuestions,
      progressPercent: Number(t.progressPercent.toFixed(2))
    }));

    // ✅ FINAL STREAK (IST SAFE)
    let streak = 0;
    const dateSet = new Set((data.streakData || []).map(d => d._id));

    const getISTDateString = (date) => {
      const ist = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      return ist.toISOString().slice(0, 10);
    };

    let currentDate = new Date();

    while (true) {
      const dateStr = getISTDateString(currentDate);

      if (dateSet.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    const todayStr = getISTDateString(new Date());
    if (!dateSet.has(todayStr)) {
      streak = 0;
    }

    return res.json({
      totalAttempts,
      globalAccuracy,
      sectionOverview,
      topicProgress,
      difficultyProgress,
      heatmap,
      streak // ✅ CORRECT NOW
    });

  } catch (error) {
    console.error("Profile Dashboard Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
//dashboard page
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const globalAgg = await Attempt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSolved: { $sum: 1 },
          totalCorrect: {
            $sum: { $cond: ["$isCorrect", 1, 0] }
          }
        }
      }
    ]);

    const totalSolved = globalAgg[0]?.totalSolved || 0;
    const totalCorrect = globalAgg[0]?.totalCorrect || 0;

    const accuracy = totalSolved
      ? Number(((totalCorrect / totalSolved) * 100).toFixed(1))
      : 0;

    const sectionAgg = await Attempt.aggregate([
      { $match: { userId } },

      {
        $lookup: {
          from: "topics",
          localField: "topicId",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: "$topic" },

      {
        $lookup: {
          from: "sections",
          localField: "topic.sectionId",
          foreignField: "_id",
          as: "section"
        }
      },
      { $unwind: "$section" },

      {
        $group: {
          _id: {
            section: "$section.name",
            difficulty: "$difficulty"
          },
          total: { $sum: 1 },
          correct: {
            $sum: { $cond: ["$isCorrect", 1, 0] }
          }
        }
      }
    ]);

    /* ---- normalize section data ---- */
    const sectionMap = {};

    sectionAgg.forEach(row => {
      const name = row._id.section;
      const diff = row._id.difficulty;

      if (!sectionMap[name]) {
        sectionMap[name] = {
          title: name,
          easy: 0,
          medium: 0,
          hard: 0,
          attempts: 0,
          correct: 0
        };
      }

      const mastery = row.total
        ? (row.correct / row.total) * 100
        : 0;

      sectionMap[name][diff] = Number(mastery.toFixed(0));
      sectionMap[name].attempts += row.total;
      sectionMap[name].correct += row.correct;
    });

    const sectionCards = Object.values(sectionMap).map(sec => {
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
        attempts: sec.attempts
      };
    });


    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);

    const weeklyAgg = await Attempt.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dayOfWeek: "$createdAt"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const dayMap = {
      1: "Sun",
      2: "Mon",
      3: "Tue",
      4: "Wed",
      5: "Thu",
      6: "Fri",
      7: "Sat"
    };

    const weekly = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => {
      const found = weeklyAgg.find(
        x => dayMap[x._id] === d
      );
      return found?.count || 0;
    });


    return res.json({
      metrics: {
        accuracy,
        solved: totalSolved,
        readiness: Math.min(100, Math.round(accuracy * 1.05)), // heuristic
        rank: null // placeholder if leaderboard added later
      },
      sections: sectionCards,
      weeklyAttempts: weekly
    });

  } catch (err) {
    console.error("Dashboard Overview Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

///recent topics

exports.getRecentTopics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const recent = await Attempt.aggregate([
      { $match: { userId } },

      // sort once for recency
      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$topicId",
          lastPracticed: { $first: "$createdAt" },

          attempts: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },

          easyTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] }
          },
          easyCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "easy"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          },

          medTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] }
          },
          medCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "medium"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          },

          hardTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] }
          },
          hardCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "hard"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          }
        }
      },

      // compute percentages once
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $eq: ["$attempts", 0] },
              0,
              { $multiply: [{ $divide: ["$correct", "$attempts"] }, 100] }
            ]
          },

          easyPct: {
            $cond: [
              { $eq: ["$easyTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$easyCorrect", "$easyTotal"] }, 100] }
            ]
          },

          medPct: {
            $cond: [
              { $eq: ["$medTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$medCorrect", "$medTotal"] }, 100] }
            ]
          },

          hardPct: {
            $cond: [
              { $eq: ["$hardTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$hardCorrect", "$hardTotal"] }, 100] }
            ]
          }
        }
      },

      // join topic name late (cheaper)
      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: "$topic" },

      {
        $project: {
          _id: 0,
          topicId: "$_id",
          sectionId: "$topic.sectionId", 
          topicName: "$topic.name",
          attempts: 1,
          lastPracticed: 1,

          overall: { $round: ["$accuracy", 0] },
          easy: { $round: ["$easyPct", 0] },
          med: { $round: ["$medPct", 0] },
          hard: { $round: ["$hardPct", 0] }
        }
      },

      { $sort: { lastPracticed: -1 } },
      { $limit: 5 }
    ]);

    return res.json(recent);
  } catch (err) {
    console.error("Recent Topics Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

//get weak topics

exports.getWeakTopics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const weak = await Attempt.aggregate([
      { $match: { userId } },

      {
        $group: {
          _id: "$topicId",

          attempts: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },

          easyTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0] }
          },
          easyCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "easy"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          },

          medTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0] }
          },
          medCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "medium"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          },

          hardTotal: {
            $sum: { $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0] }
          },
          hardCorrect: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$difficulty", "hard"] }, "$isCorrect"] },
                1,
                0
              ]
            }
          }
        }
      },

      {
        $addFields: {
          progressPercent: {
            $cond: [
              { $eq: ["$attempts", 0] },
              0,
              { $multiply: [{ $divide: ["$correct", "$attempts"] }, 100] }
            ]
          },

          easyPct: {
            $cond: [
              { $eq: ["$easyTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$easyCorrect", "$easyTotal"] }, 100] }
            ]
          },

          medPct: {
            $cond: [
              { $eq: ["$medTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$medCorrect", "$medTotal"] }, 100] }
            ]
          },

          hardPct: {
            $cond: [
              { $eq: ["$hardTotal", 0] },
              0,
              { $multiply: [{ $divide: ["$hardCorrect", "$hardTotal"] }, 100] }
            ]
          }
        }
      },

      { $sort: { progressPercent: 1 } },
      { $limit: 5 },

      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "_id",
          as: "topic"
        }
      },
      { $unwind: "$topic" },

      {
        $project: {
          _id: 0,
          topicId: "$_id",
           sectionId: "$topic.sectionId",
          topicName: "$topic.name",
          attempts: 1,

          overall: { $round: ["$progressPercent", 0] },
          easy: { $round: ["$easyPct", 0] },
          med: { $round: ["$medPct", 0] },
          hard: { $round: ["$hardPct", 0] }
        }
      }
    ]);

    return res.json(weak);
  } catch (err) {
    console.error("Weak Topics Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getPracticeHome = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const sections = await Section.aggregate([

      {
        $lookup: {
          from: "topics",
          localField: "_id",
          foreignField: "sectionId",
          as: "topics"
        }
      },

      {
        $addFields: {
          topicIds: "$topics._id",
          topicCount: { $size: "$topics" }
        }
      },

      {
        $lookup: {
          from: "attempts",
          let: { topicIds: "$topicIds" },
          pipeline: [
            {
              $match: {
                userId: userId
              }
            },
            {
              $match: {
                $expr: {
                  $in: ["$topicId", "$$topicIds"]
                }
              }
            },

            {
              $lookup: {
                from: "questions",
                localField: "questionId",
                foreignField: "_id",
                as: "question"
              }
            },

            { $unwind: "$question" },

            {
              $group: {
                _id: "$question.difficulty",
                attempts: { $sum: 1 },
                correct: {
                  $sum: { $cond: ["$isCorrect", 1, 0] }
                }
              }
            }
          ],
          as: "difficultyStats"
        }
      },

      {
        $addFields: {

          easy: {
            $ifNull: [
              {
                $let: {
                  vars: {
                    item: {
                      $first: {
                        $filter: {
                          input: "$difficultyStats",
                          cond: { $eq: ["$$this._id", "easy"] }
                        }
                      }
                    }
                  },
                  in: "$$item.attempts"
                }
              },
              0
            ]
          },

          medium: {
            $ifNull: [
              {
                $let: {
                  vars: {
                    item: {
                      $first: {
                        $filter: {
                          input: "$difficultyStats",
                          cond: { $eq: ["$$this._id", "medium"] }
                        }
                      }
                    }
                  },
                  in: "$$item.attempts"
                }
              },
              0
            ]
          },

          hard: {
            $ifNull: [
              {
                $let: {
                  vars: {
                    item: {
                      $first: {
                        $filter: {
                          input: "$difficultyStats",
                          cond: { $eq: ["$$this._id", "hard"] }
                        }
                      }
                    }
                  },
                  in: "$$item.attempts"
                }
              },
              0
            ]
          },

          attempts: {
            $sum: "$difficultyStats.attempts"
          },

          correct: {
            $sum: "$difficultyStats.correct"
          }
        }
      },

      {
        $addFields: {
          overall: {
            $cond: [
              { $eq: ["$attempts", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$correct", "$attempts"] },
                      100
                    ]
                  },
                  0
                ]
              }
            ]
          }
        }
      },

      {
        $project: {
          _id: 0,
          sectionId: "$_id",
          sectionName: "$name",
          topicCount: 1,
          attempts: 1,
          easy: 1,
          medium: 1,
          hard: 1,
          overall: 1
        }
      },

      { $sort: { sectionName: 1 } }

    ]);

    res.json({ sections });

  } catch (err) {
    console.error("Practice Home Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


//page 2 from practice

exports.getSectionTopics = async (req, res) => {

  try {

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sectionId = new mongoose.Types.ObjectId(req.params.sectionId);
    const sectionName=await Section.findById(sectionId);
    
    const topics = await Topic.aggregate([
      {
        $match: { sectionId }
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
                    { $eq: ["$userId", userId] }
                  ]
                }
              }
            }
          ],
          as: "attempts"
        }
      },

      {
        $addFields: {

          attempts: { $size: "$attempts" },

          correct: {
            $size: {
              $filter: {
                input: "$attempts",
                as: "a",
                cond: "$$a.isCorrect"
              }
            }
          },

          easyAttempts: {
            $filter: {
              input: "$attempts",
              as: "a",
              cond: { $eq: ["$$a.difficulty", "easy"] }
            }
          },

          medAttempts: {
            $filter: {
              input: "$attempts",
              as: "a",
              cond: { $eq: ["$$a.difficulty", "medium"] }
            }
          },

          hardAttempts: {
            $filter: {
              input: "$attempts",
              as: "a",
              cond: { $eq: ["$$a.difficulty", "hard"] }
            }
          }
        }
      },

      {
        $addFields: {

          easy: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: "$easyAttempts",
                        as: "e",
                        cond: "$$e.isCorrect"
                      }
                    }
                  },
                  { $max: [{ $size: "$easyAttempts" }, 1] }
                ]
              },
              100
            ]
          },

          med: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: "$medAttempts",
                        as: "m",
                        cond: "$$m.isCorrect"
                      }
                    }
                  },
                  { $max: [{ $size: "$medAttempts" }, 1] }
                ]
              },
              100
            ]
          },

          hard: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: "$hardAttempts",
                        as: "h",
                        cond: "$$h.isCorrect"
                      }
                    }
                  },
                  { $max: [{ $size: "$hardAttempts" }, 1] }
                ]
              },
              100
            ]
          }
        }
      },

      {
        $addFields: {

          overall: {
            $cond: [
              { $eq: ["$attempts", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$correct", "$attempts"] },
                  100
                ]
              }
            ]
          }
        }
      },

      {
        $project: {
          topicId: "$_id",
          topicName: "$name",
          order: 1,
          attempts: 1,

          easy: { $round: ["$easy", 0] },
          med: { $round: ["$med", 0] },
          hard: { $round: ["$hard", 0] },
          overall: { $round: ["$overall", 0] }
        }
      },

      {
         $sort: { order: 1 }
    }

    ]);

    res.json({
  sectionName: sectionName.name,
  topics
});

  } catch (err) {

    console.error("Section Topics Error:", err);
    res.status(500).json({ message: "Server error" });

  }
};