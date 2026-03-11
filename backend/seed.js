// Run with: node backend/seed.js
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, ".env") });

// Fallback if .env missing
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/leetcode-ai";

const mongoose = require("mongoose");
const DsaProblem = require("./models/DsaProblem");
const DsaStatus = require("./models/DsaStatus");

const STRIVER_JSON_PATH = path.join(__dirname, "..", "data", "striver_456_questions.json");

function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDifficulty(d) {
  const x = String(d || "").toLowerCase();
  if (x === "easy") return "Easy";
  if (x === "medium") return "Medium";
  if (x === "hard") return "Hard";
  return "Medium";
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const raw = fs.readFileSync(STRIVER_JSON_PATH, "utf-8");
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length) {
      throw new Error("striver_456_questions.json is empty or not an array");
    }

    const seen = new Set();
    const docs = [];

    for (const [index, q] of list.entries()) {
      if (!q || !q.title || !q.topic || !q.link) continue;
      const key = `${q.title}::${q.topic}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const diff = normalizeDifficulty(q.difficulty);
      // The sheet can contain duplicate titles across different steps,
      // but our DB requires unique slugs. Make it stable + unique.
      const base = q.slug || slugify(q.title);
      const stableId = q.id || index + 1;
      const slug = `${base}-${stableId}`;

      const leetLink = q.link;
      const gfgSearch = `https://www.geeksforgeeks.org/?s=${encodeURIComponent(q.title)}`;

      docs.push({
        title: q.title,
        slug,
        difficulty: diff,
        topic: q.topic,
        tags: [],
        link: leetLink,
        gfg_link: gfgSearch,
        source: "mixed",
        order: q.id || index + 1,
        is_active: true,
      });
    }

    await DsaStatus.deleteMany({});
    await DsaProblem.deleteMany({});
    console.log("🗑️  Cleared existing DSA problems & statuses");

    const inserted = await DsaProblem.insertMany(docs, { ordered: false });
    console.log(`✅ Seeded ${inserted.length} Striver A2Z problems`);

    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
