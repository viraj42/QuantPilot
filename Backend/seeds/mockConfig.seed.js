
/**
 * seed.mock.js
 *
 * Seeds Company + MockConfig for 6 companies.
 */

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const Company = require("../models/company.model");
const MockConfig = require("../models/mockConfig.model");
const Section = require("../models/section.model");

const COMPANY_PATTERNS = [
  {
    name: "TCS NQT",
    logoUrl: null,
    description: "TCS National Qualifier Test — Tests Verbal, Reasoning, and Numerical ability",
    duration: 60,
    sections: [
      { sectionName: "English", questionCount: 24, mix: { easy: 10, medium: 10, hard: 4 } },
      { sectionName: "Logical Reasoning", questionCount: 30, mix: { easy: 10, medium: 15, hard: 5 } },
      { sectionName: "Quant", questionCount: 26, mix: { easy: 8, medium: 13, hard: 5 } },
    ],
  },
  {
    name: "Infosys IRT",
    logoUrl: null,
    description: "Infosys Instep Reasoning Test — Heavy on logical and quantitative reasoning",
    duration: 95,
    sections: [
      { sectionName: "Quant", questionCount: 15, mix: { easy: 5, medium: 5, hard:5  } },
      { sectionName: "English", questionCount: 40, mix: { easy: 15, medium: 20, hard: 5 } },
      { sectionName: "Logical Reasoning", questionCount: 25, mix: { easy: 10, medium: 7, hard: 8 } },
    ],
  },
  {
    name: "Wipro WILP",
    logoUrl: null,
    description: "Wipro National Talent Hunt — Aptitude, English, and Coding-based pattern",
    duration: 60,
    sections: [
      { sectionName: "English", questionCount: 20, mix: { easy: 8, medium: 10, hard: 2 } },
      { sectionName: "Quant", questionCount: 20, mix: { easy: 6, medium: 10, hard: 4 } },
      { sectionName: "Logical Reasoning", questionCount: 20, mix: { easy: 6, medium: 10, hard: 4 } },
    ],
  },
  {
    name: "Accenture",
    logoUrl: null,
    description: "Accenture Cognitive & Technical Assessment — Aptitude + Reasoning focused",
    duration: 90,
    sections: [
      { sectionName: "Quant", questionCount: 20, mix: { easy: 8, medium: 9, hard: 3 } },
      { sectionName: "Logical Reasoning", questionCount: 20, mix: { easy: 7, medium: 10, hard: 3 } },
      { sectionName: "English", questionCount: 25, mix: { easy: 10, medium: 12, hard: 3 } },
    ],
  },
  {
    name: "Capgemini",
    logoUrl: null,
    description: "Capgemini Game-based Aptitude — Focus on pseudo-code and quantitative reasoning",
    duration: 75,
    sections: [
      { sectionName: "Quant", questionCount: 16, mix: { easy: 6, medium: 8, hard: 2 } },
      { sectionName: "Logical Reasoning", questionCount: 16, mix: { easy: 6, medium: 8, hard: 2 } },
      { sectionName: "English", questionCount: 18, mix: { easy: 8, medium: 8, hard: 2 } },
    ],
  },
  {
    name: "Cognizant",
    logoUrl: null,
    description: "Cognizant GenC / GenC Next — Aptitude, reasoning, and verbal comprehension",
    duration: 60,
    sections: [
      { sectionName: "Quant", questionCount: 16, mix: { easy: 6, medium: 8, hard: 2 } },
      { sectionName: "Logical Reasoning", questionCount: 16, mix: { easy: 6, medium: 8, hard: 2 } },
      { sectionName: "English", questionCount: 18, mix: { easy: 7, medium: 9, hard: 2 } },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const sections = await Section.find().lean();
  const sectionNameMap = new Map(sections.map((s) => [s.name.toLowerCase(), s._id]));

  console.log("Available sections in DB:", sections.map((s) => s.name));

  let companiesCreated = 0;
  let configsCreated = 0;
  const warnings = [];

  for (const pattern of COMPANY_PATTERNS) {
    const company = await Company.findOneAndUpdate(
      { name: pattern.name },
      {
        name: pattern.name,
        logoUrl: pattern.logoUrl,
        description: pattern.description,
      },
      { upsert: true, new: true }
    );
    companiesCreated++;
    console.log(`✅ Company: ${company.name} (${company._id})`);

    const configSections = [];

    for (const s of pattern.sections) {
      const sectionId = sectionNameMap.get(s.sectionName.toLowerCase());

      if (!sectionId) {
        warnings.push(
          `⚠️  Section "${s.sectionName}" not found in DB for ${pattern.name} — SKIPPING this section`
        );
        continue;
      }

      const mixSum = (s.mix.easy || 0) + (s.mix.medium || 0) + (s.mix.hard || 0);
      if (mixSum !== s.questionCount) {
        warnings.push(
          `⚠️  ${pattern.name} > ${s.sectionName}: difficultyMix sum (${mixSum}) ≠ questionCount (${s.questionCount}) — auto-correcting`
        );
        s.mix.medium += s.questionCount - mixSum;
      }

      configSections.push({
        sectionId,
        questionCount: s.questionCount,
        difficultyMix: {
          easy: s.mix.easy || 0,
          medium: s.mix.medium || 0,
          hard: s.mix.hard || 0,
        },
      });
    }

    if (configSections.length === 0) {
      warnings.push(`❌ ${pattern.name}: no valid sections found — MockConfig NOT created`);
      continue;
    }

    await MockConfig.findOneAndUpdate(
      { companyId: company._id },
      {
        companyId: company._id,
        duration: pattern.duration,
        sections: configSections,
      },
      { upsert: true, new: true }
    );
    configsCreated++;

    console.log(
      `   MockConfig: ${pattern.duration}min, ${configSections.length} sections, ${configSections.reduce((sum, s) => sum + s.questionCount, 0)} total questions`
    );
  }

  console.log("\n── Seed Summary ──────────────────────────────────");
  console.log(`Companies upserted: ${companiesCreated}`);
  console.log(`MockConfigs upserted: ${configsCreated}`);

  if (warnings.length > 0) {
    console.log("\n── Warnings ──────────────────────────────────────");
    warnings.forEach((w) => console.log(w));
    console.log("\nYour DB sections:", sections.map((s) => s.name).join(", "));
  }

  await mongoose.disconnect();
  console.log("\nDone. MongoDB disconnected.");
}

seed().catch((err) => {
  console.error("Seed Error:", err);
  process.exit(1);
});
