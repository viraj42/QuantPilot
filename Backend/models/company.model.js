const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

companySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Company", companySchema);
