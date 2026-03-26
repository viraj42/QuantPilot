const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return val.length >= 2;
        },
        message: "At least two options required",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ topicId: 1, difficulty: 1 });

module.exports = mongoose.model("Question", questionSchema);
