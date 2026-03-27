const mongoose = require("mongoose");

// Company is just a lookup table — name + metadata
// Seeded by admin via seed script
// No user-facing creation endpoint needed

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Optional: logo URL, description for frontend display
    logoUrl: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

companySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Company", companySchema);