const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

topicSchema.index({ sectionId: 1 });
topicSchema.index({ sectionId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Topic", topicSchema);
