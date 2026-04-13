require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");

const Question = require("../models/question.model");

const MONGO_URI = process.env.MONGO_URI || "YOUR_URI";

// 🎯 TARGET TOPIC ID (Permutation & Combination)
const TOPIC_ID = new mongoose.Types.ObjectId("69da51dcd1b008228f1638ea");

// 🛑 SAFETY SWITCH
const EXECUTE_DELETE = false;

async function cleanDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 DB connected");

    /**
     * 🔍 STEP 1: Preview affected documents
     */
    const med = await Question.countDocuments({
      topicId: TOPIC_ID,
      difficulty:"medium"
    });

    const hard = await Question.countDocuments({
      topicId: TOPIC_ID,
      difficulty:"hard"
    });
    const easy = await Question.countDocuments({
      topicId: TOPIC_ID,
      difficulty:"easy"
    });
    let count=easy+med+hard;
    

    console.log(`⚠️ Questions to be easy: ${easy}`);
    console.log(`⚠️ Questions to be medium: ${med}`);
    console.log(`⚠️ Questions to be hard: ${hard}`);
    console.log(`🎯 Topic ID: ${TOPIC_ID}`);

    if (count === 0) {
      console.log("✅ No questions found for this topic. Exiting.");
      return process.exit(0);
    }

    /**
     * 🔐 DRY RUN MODE
     */
    if (!EXECUTE_DELETE) {
      console.log("🧪 DRY RUN ENABLED — No data deleted");
      console.log("👉 Set EXECUTE_DELETE = true to proceed");
      return process.exit(0);
    }

    /**
     * ❌ STEP 2: DELETE
     */
    const result = await Question.deleteMany({
      topicId: TOPIC_ID,
    });

    console.log(`🔥 Deleted ${result.deletedCount} questions`);
    console.log("✅ Cleanup completed");

    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
}

cleanDB();