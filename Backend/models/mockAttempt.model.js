const mongoose = require("mongoose");

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
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

mockAttemptSchema.index({ userId: 1 });
mockAttemptSchema.index({ userId: 1, companyId: 1 });
mockAttemptSchema.index({ startedAt: 1 });

module.exports = mongoose.model("MockAttempt", mockAttemptSchema);
