const mongoose = require("mongoose");

// MockConfig is the "template" for a company's exam pattern
// One config per company — seeded by admin
// difficultyMix values must sum to questionCount per section
// Example for TCS NQT Quant section (30 questions): easy:10, medium:15, hard:5

const mockConfigSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1, // in minutes — converted to seconds in controller
    },
    sections: [
      {
        sectionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Section",
          required: true,
        },
        questionCount: {
          type: Number,
          required: true,
          min: 1,
        },
        difficultyMix: {
          easy: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          hard: { type: Number, default: 0 },
        },
      },
    ],
  },
  { timestamps: true }
);

mockConfigSchema.index({ companyId: 1 }, { unique: true });

module.exports = mongoose.model("MockConfig", mockConfigSchema);