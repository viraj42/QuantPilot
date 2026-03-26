const mongoose = require("mongoose");
const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    isGuess: {
      type: Boolean,
      required: true,
      default: false
    },
    timeTaken: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

attemptSchema.index({ userId: 1, topicId: 1 });
attemptSchema.index({ userId: 1, questionId: 1 });
attemptSchema.index({ userId: 1, topicId: 1, difficulty: 1 });
attemptSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Attempt", attemptSchema);
