require("dotenv").config();
const mongoose = require("mongoose");

const Section = require("../models/section.model");
const Topic = require("../models/topic.model");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://virajpadaval42_db_user:fp3gzkHcnbizQCit@cluster0.ud5uxvp.mongodb.net/QuantPilot?retryWrites=true&w=majority&appName=Cluster0";

/**
 * 🔒 FIXED SECTION CONFIG (DO NOT CHANGE)
 */
const SECTION_ID = "69996ba326333cb6b9df6ebc";
const SECTION_NAME = "Logical Reasoning";

/**
 * 🔒 EXACT ORDER — LOGICAL REASONING
 */
const REASONING_TOPICS = [
  "Coding-Decoding",
  "Direction Sense",
  "Blood Relations",
  "Order & Ranking",
  "Series (Alphabet + Number Patterns)",
  "Syllogism",
  "Statement & Conclusion / Inference",
  "Seating Arrangement",
  "Puzzle",
];

async function seed() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI missing");

    await mongoose.connect(MONGO_URI);
    console.log("🟢 DB connected");

    /**
     * 🔎 STRICT FETCH BY _id + name (double validation)
     */
    const section = await Section.findOne({
      _id: SECTION_ID,
      name: SECTION_NAME,
    });

    if (!section) {
      throw new Error(
        "❌ Logical Reasoning section mismatch (id/name not found)"
      );
    }

    console.log(
      `✅ Locked section verified: ${section.name} (${section._id})`
    );

    /**
     * 🌱 Seed ONLY reasoning topics
     */
    for (let i = 0; i < REASONING_TOPICS.length; i++) {
      const topicName = REASONING_TOPICS[i];

      await Topic.updateOne(
        {
          sectionId: section._id,
          name: topicName,
        },
        {
          $setOnInsert: {
            sectionId: section._id,
            name: topicName,
            totalQuestions: 0,
          },
          $set: {
            order: i + 1,
          },
        },
        { upsert: true }
      );

      console.log(`✔ Seeded: ${topicName}`);
    }

    console.log("🎉 Logical Reasoning topics seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  }
}

seed();