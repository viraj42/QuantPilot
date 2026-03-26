const Section = require("../models/section.model");

// CREATE SECTION
module.exports.createSection = async (req, res) => {
  try {
    const { name, order } = req.body;

    if (!name || order === undefined) {
      return res.status(400).json({ message: "Name and order required" });
    }

    const existing = await Section.findOne({ name });

    if (existing) {
      return res.status(400).json({ message: "Section already exists" });
    }

    const section = await Section.create({ name, order });

    res.status(201).json(section);
  } catch (err) {
    console.error(err); // ⭐ add this for debugging
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL SECTIONS
module.exports.getSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ order: 1 });
    res.status(200).json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
