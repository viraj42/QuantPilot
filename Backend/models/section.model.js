const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },

  },
  { timestamps: true }
);

sectionSchema.index({ order: 1 });
module.exports = mongoose.model("Section", sectionSchema);
