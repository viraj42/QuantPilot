const mongoose = require("mongoose");

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
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeTaken: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: false }
);

mockAttemptQuestionSchema.index({ mockAttemptId: 1 });

module.exports = mongoose.model(
  "MockAttemptQuestion",
  mockAttemptQuestionSchema
);
