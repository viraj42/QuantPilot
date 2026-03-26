const mongoose = require("mongoose");

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
      min: 1,
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
