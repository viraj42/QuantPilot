const Topic = require("../models/topic.model");
const Section = require("../models/section.model");

// CREATE TOPIC
module.exports.createTopic = async (req, res) => {
  try {
    const { name, sectionId } = req.body;

    if (!name || !sectionId) {
      return res.status(400).json({ message: "Name and sectionId required" });
    }

    const sectionExists = await Section.findById(sectionId);
    if (!sectionExists) {
      return res.status(400).json({ message: "Invalid sectionId" });
    }

    const existing = await Topic.findOne({ name, sectionId });
    if (existing) {
      return res.status(400).json({ message: "Topic already exists in section" });
    }

    const topic = await Topic.create({
      name,
      sectionId,
      totalQuestions: 0,
    });

    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET TOPICS BY SECTION
module.exports.getTopicsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const topics = await Topic.find({ sectionId }).sort({ order: 1 });

    res.status(200).json(topics);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
