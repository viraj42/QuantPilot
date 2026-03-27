"use strict";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ==============================
// 🔧 🔥 EDIT THESE VALUES ONLY
// ==============================

// 👉 Path to your JSON file
const JSON_FILE_PATH = "../datasets/Percentagetemp.json";
// 👉 Existing Topic ObjectId from DB
const TOPIC_ID = "69996f910514d5ed27346f62";

// 👉 Mongo URI (or use env)
const MONGO_URI ="mongodb+srv://virajpadaval42_db_user:fp3gzkHcnbizQCit@cluster0.ud5uxvp.mongodb.net/QuantPilot?retryWrites=true&w=majority&appName=Cluster0"

// ==============================
// 📦 MODELS (adjust paths if needed)
// ==============================
const Question = require("../models/question.model.js");
const Topic = require("../models/topic.model.js");

// ==============================
// 🔍 HELPERS
// ==============================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const readJSONFile = (filePath) => {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`JSON file not found at: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Invalid JSON format.");
  }
};

// ==============================
// 🚀 MAIN SEED FUNCTION
// ==============================

const seedQuestions = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // ✅ Validate TopicId format
    if (!isValidObjectId(TOPIC_ID)) {
      throw new Error("Invalid TOPIC_ID format.");
    }

    // ✅ Ensure topic exists
    const topicExists = await Topic.findById(TOPIC_ID).lean();
    if (!topicExists) {
      throw new Error(`Topic not found for ID: ${TOPIC_ID}`);
    }

    console.log("📖 Reading JSON file...");
    const questions = readJSONFile(JSON_FILE_PATH);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("JSON must be a non-empty array.");
    }

    console.log(`🧪 Processing ${questions.length} questions...`);

    // ==============================
    // 🧹 SANITIZE + ATTACH TOPIC
    // ==============================

    const preparedDocs = questions.map((q, index) => {
      if (
        !q.text ||
        !Array.isArray(q.options) ||
        typeof q.correctAnswer !== "number" ||
        !q.difficulty
      ) {
        throw new Error(`Invalid question structure at index ${index}`);
      }

      return {
        topicId: TOPIC_ID,
        difficulty: q.difficulty,
        text: q.text.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctAnswer: q.correctAnswer,
      };
    });

    // ==============================
    // 🚀 INSERT
    // ==============================

    console.log("💾 Inserting questions...");
    const result = await Question.insertMany(preparedDocs, {
      ordered: false, // continues if some fail
    });

    console.log("🎉 Seeding completed successfully!");
    console.log(`✅ Inserted: ${result.length} questions`);
  } catch (err) {
    console.error("❌ Seeding failed:");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

// ==============================
// 🏁 RUN
// ==============================

seedQuestions();