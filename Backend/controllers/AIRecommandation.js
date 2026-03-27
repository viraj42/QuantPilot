const axios = require("axios");
const User = require("../models/user.model");
const Attempt = require("../models/attempt.model");
const mongoose=require("mongoose");
exports.getUserInsight = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();

    if (
      user.insight &&
      user.insight.lastGeneratedAt &&
      Date.now() - new Date(user.insight.lastGeneratedAt).getTime() < 24 * 60 * 60 * 1000
    ) {
      return res.json({ insight: user.insight.text, cached: true });
    }


    const stats = await Attempt.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$difficulty",
          total: { $sum: 1 },
          correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
        },
      },
    ]);

    let total = 0, correct = 0, hardTotal = 0, hardCorrect = 0;

    stats.forEach((s) => {
      total += s.total;
      correct += s.correct;
      if (s._id === "hard") {
        hardTotal = s.total;
        hardCorrect = s.correct;
      }
    });

    const accuracy = total ? (correct / total) * 100 : 0;
    const hardMastery = hardTotal ? (hardCorrect / hardTotal) * 100 : 0;

    const prompt = `
Generate one short actionable study insight (max 20 words).

Accuracy: ${accuracy.toFixed(1)}%
Hard mastery: ${hardMastery.toFixed(1)}%
Attempts: ${total}

Insight:
`;

const response = await axios({
  method: "post",
  url: "https://api.groq.com/openai/v1/chat/completions",
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
  data: {
    model:"llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a concise exam coach. Give short actionable advice.",
      },
      {
        role: "user",
        content: `Accuracy: ${accuracy.toFixed(1)}%, Hard: ${hardMastery.toFixed(1)}%, Attempts: ${total}. Give one improvement insight.`,
      },
    ],
    max_tokens: 25,
    temperature: 0.3,
  },
});

    const insightText = response.data.choices[0].message.content.trim();

    await User.findByIdAndUpdate(userId, {
      insight: {
        text: insightText,
        lastGeneratedAt: new Date(),
      },
    });
    console.log("Calling Insights");
    

    return res.json({
      insight: insightText,
      cached: false,
    });

  } catch (err) {
    console.error("Insight Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Server error" });
  }
};