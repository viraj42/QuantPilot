require("dotenv").config();
const mongoose = require("mongoose");

const Section = require("../models/section.model");
const Topic = require("../models/topic.model");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://virajpadaval42_db_user:fp3gzkHcnbizQCit@cluster0.ud5uxvp.mongodb.net/QuantPilot?retryWrites=true&w=majority&appName=Cluster0";

/**
 * 🔒 FIXED SECTION CONFIG (ENGLISH)
 */
const SECTION_ID = "69996bae26333cb6b9df6ebf";
const SECTION_NAME = "English";

/**
 * 🔒 EXACT ORDER — ENGLISH (PLACEMENT OPTIMIZED)
 */
const ENGLISH_TOPICS = [
  "Error Detection",
  "Sentence Correction",
  "Sentence Structure ",
  "Tenses & Verb Forms",
  "Subject-Verb Agreement",
  "Prepositions & Conjunctions",
  "Articles & Determiners",
  "Parts of Speech"
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
        "❌ English section mismatch (id/name not found)"
      );
    }

    console.log(
      `✅ Locked section verified: ${section.name} (${section._id})`
    );

    /**
     * 🌱 Seed ENGLISH topics
     */
    for (let i = 0; i < ENGLISH_TOPICS.length; i++) {
      const topicName = ENGLISH_TOPICS[i];

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

    console.log("🎉 English topics seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  }
}

seed();