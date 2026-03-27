const mongoose = require("mongoose");

// Added: selectedAnswer — required to compute isCorrect on result
// Added: isCorrect — stored at submit time (avoid recomputing on every result fetch)
// This is acceptable to store since it's derived at a single point (submit), not ongoing

const mockAttemptQuestionSchema = new mongoose.Schema(
  {
    mockAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockAttempt",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    selectedAnswer: {
      type: Number,
      default: null, // null = skipped/unattempted
      min: 0,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    timeTaken: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: false }
);

mockAttemptQuestionSchema.index({ mockAttemptId: 1 });
mockAttemptQuestionSchema.index({ mockAttemptId: 1, sectionId: 1 }); // for section-wise analytics

module.exports = mongoose.model("MockAttemptQuestion", mockAttemptQuestionSchema);