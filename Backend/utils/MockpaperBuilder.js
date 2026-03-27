const mongoose = require("mongoose");
const Question = require("../models/question.model");

/**
 * buildMockPaper
 *
 * Reads MockConfig sections and picks questions randomly from DB.
 * Returns frozen array of { questionId, sectionId } — this is the "paper".
 *
 * Design decisions:
 * - Random selection per difficulty bucket per section
 * - If DB doesn't have enough questions of a difficulty, fills with whatever is available
 *   (graceful degradation — better than refusing to generate)
 * - No user-specific logic here — same config generates same-style paper for everyone
 *   (different random draw per user)
 *
 * @param {Array} sections - from MockConfig.sections (populated or raw)
 * @returns {Array} frozenQuestions — [{ questionId, sectionId }]
 */
async function buildMockPaper(sections) {
  const frozenQuestions = [];

  for (const section of sections) {
    const { sectionId, difficultyMix } = section;

    // For each difficulty bucket, pick random questions from that section's topics
    for (const [difficulty, count] of Object.entries(difficultyMix)) {
      if (!count || count === 0) continue;

      // Aggregate: find all questions of this difficulty across all topics in this section
      // Uses $lookup to join topics → filter by sectionId
      const questions = await Question.aggregate([
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
        { $sample: { size: count } }, // random selection
        { $project: { _id: 1 } },
      ]);

      for (const q of questions) {
        frozenQuestions.push({
          questionId: q._id,
          sectionId: new mongoose.Types.ObjectId(sectionId),
        });
      }

      // If we got fewer questions than requested, log it (don't throw)
      if (questions.length < count) {
        console.warn(
          `[MockPaper] Section ${sectionId} [${difficulty}]: requested ${count}, got ${questions.length} — DB may need more questions`
        );
      }
    }
  }

  return frozenQuestions;
}

module.exports = { buildMockPaper };