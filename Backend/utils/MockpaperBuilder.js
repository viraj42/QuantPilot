const mongoose = require("mongoose");
const Question = require("../models/question.model");

/**
 * buildMockPaper
 *
 * Reads MockConfig sections and picks questions randomly from DB.
 * Returns frozen array of { questionId, sectionId } — this is the "paper".
 *
 * Design decisions:
 * - Questions are distributed EVENLY across all topics within a section.
 *   e.g. 15 Quant questions across 5 topics → 3 per topic (not 15 from one topic).
 * - Base allocation = floor(count / numTopics). Remainder is distributed one-by-one
 *   to topics that have spare questions, prioritising topics with more available stock.
 * - If a topic has fewer questions than its allocation, it contributes what it has and
 *   the shortfall is redistributed to other topics (graceful degradation).
 * - $sample is used per-topic so randomness is preserved within each topic pool.
 * - No user-specific logic — same config, different random draw per user.
 * - Zero changes to the return shape: [{ questionId, sectionId }]
 *   → mock controller and frontend are completely unaffected.
 *
 * @param {Array} sections - from MockConfig.sections
 * @returns {Array} frozenQuestions — [{ questionId, sectionId }]
 */
async function buildMockPaper(sections) {
  const frozenQuestions = [];

  for (const section of sections) {
    const { sectionId, difficultyMix } = section;

    for (const [difficulty, count] of Object.entries(difficultyMix)) {
      if (!count || count === 0) continue;

      // ── STEP 1: Find all distinct topics in this section that have
      //            at least 1 question of this difficulty ──────────────
      const topicPool = await Question.aggregate([
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
          $match: {
            "topic.sectionId": new mongoose.Types.ObjectId(sectionId),
            difficulty,
          },
        },
        // Count available questions per topic
        {
          $group: {
            _id: "$topic._id",
            available: { $sum: 1 },
          },
        },
        // Sort descending so topics with more questions get first pick on remainder
        { $sort: { available: -1 } },
      ]);

      if (topicPool.length === 0) {
        console.warn(
          `[MockPaper] Section ${sectionId} [${difficulty}]: no topics found — skipping`
        );
        continue;
      }

      // ── STEP 2: Compute per-topic allocation ──────────────────────
      // Base = floor(count / numTopics), remainder distributed one-by-one
      const numTopics  = topicPool.length;
      const basePerTopic = Math.floor(count / numTopics);
      let   remainder    = count % numTopics;

      // Initial allocation — capped by what each topic actually has
      const allocations = topicPool.map((t) => {
        const desired = basePerTopic + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return {
          topicId:   t._id,
          available: t.available,
          allocated: Math.min(desired, t.available),
        };
      });

      // ── STEP 3: Redistribute shortfall ───────────────────────────
      // If any topic couldn't fill its allocation, add the shortfall back
      // to a pool and give it to topics that still have spare questions.
      let shortfall = allocations.reduce(
        (acc, a) => acc + (Math.min(basePerTopic + 1, a.available) - a.allocated),
        0
      );
      // More precise: total desired vs total allocated
      const totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0);
      shortfall = count - totalAllocated;

      if (shortfall > 0) {
        for (const a of allocations) {
          if (shortfall <= 0) break;
          const spare = a.available - a.allocated;
          if (spare > 0) {
            const extra = Math.min(spare, shortfall);
            a.allocated += extra;
            shortfall   -= extra;
          }
        }
      }

      if (shortfall > 0) {
        console.warn(
          `[MockPaper] Section ${sectionId} [${difficulty}]: requested ${count}, ` +
          `DB only has ${count - shortfall} — paper will be short`
        );
      }

      // ── STEP 4: Sample per topic ──────────────────────────────────
      for (const a of allocations) {
        if (a.allocated === 0) continue;

        const picked = await Question.aggregate([
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
            $match: {
              "topic.sectionId": new mongoose.Types.ObjectId(sectionId),
              "topic._id":       new mongoose.Types.ObjectId(a.topicId),
              difficulty,
            },
          },
          { $sample: { size: a.allocated } },
          { $project: { _id: 1 } },
        ]);

        for (const q of picked) {
          frozenQuestions.push({
            questionId: q._id,
            sectionId:  new mongoose.Types.ObjectId(sectionId),
          });
        }

        if (picked.length < a.allocated) {
          console.warn(
            `[MockPaper] Topic ${a.topicId} [${difficulty}]: allocated ${a.allocated}, sampled ${picked.length}`
          );
        }
      }
    }
  }

  return frozenQuestions;
}

module.exports = { buildMockPaper };