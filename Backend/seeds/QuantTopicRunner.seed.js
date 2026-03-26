require("dotenv").config();
const mongoose = require("mongoose");

const Section = require("../models/section.model");
const Topic = require("../models/topic.model");

const MONGO_URI = "mongodb+srv://virajpadaval42_db_user:fp3gzkHcnbizQCit@cluster0.ud5uxvp.mongodb.net/QuantPilot?retryWrites=true&w=majority&appName=Cluster0";

/**
 * 🔒 EXACT ORDER — DO NOT MODIFY
 */
const TOPICS = [
  "Number System",
  "Percentages",
  "Ratio & Proportion",
  "Averages",
  "Profit & Loss",
  "Simple & Compound Interest",
  "Mixtures & Alligation",
  "Time & Work",
  "Time Speed Distance",
  "Algebra Basics",
  "Logarithms",
  "Permutation & Combination",
  "Probability",
  "Geometry",
  "Data Interpretation",
];

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(MONGO_URI);
    console.log("🟢 DB connected");

    // 🔎 find existing Quant section
    const section = await Section.findOne({ name: "Quant" });

    if (!section) {
      throw new Error("Quant section not found in Section collection");
    }

    console.log("✅ Quant section found");

    // 🌱 seed topics in order
    for (let i = 0; i < TOPICS.length; i++) {
      const topicName = TOPICS[i];

        await Topic.updateOne(
        { sectionId: section._id, name: topicName },
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

    console.log("🎉 Quant topics seeding completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder failed:", err.message);
    process.exit(1);
  }
}

seed();