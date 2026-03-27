const mongoose = require("mongoose");

// Added: frozenQuestions array to freeze paper at generation time
// Added: status field to distinguish generated vs submitted
// Added: duration from MockConfig (needed for server-side timer validation)
// Removed: score + percentage at schema level (always computed on result, never stored) 
// This matches your existing analytics philosophy — derive, never store

const mockAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    // Frozen at generation time — array of { questionId, sectionId }
    // This is the "paper" — immutable once created
    frozenQuestions: [
      {
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
      },
    ],
    duration: {
      type: Number,
      required: true, // seconds — copied from MockConfig at generation time
    },
    status: {
      type: String,
      enum: ["generated", "submitted"],
      default: "generated",
    },
    startedAt: {
      type: Date,
      default: null, // set when user actually starts (first question view)
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mockAttemptSchema.index({ userId: 1 });
mockAttemptSchema.index({ userId: 1, companyId: 1 });
mockAttemptSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("MockAttempt", mockAttemptSchema);