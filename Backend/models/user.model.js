const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
      enum: ["student","admin"],
    },
    insight: {
    text: String,
    lastGeneratedAt: Date,
  },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
