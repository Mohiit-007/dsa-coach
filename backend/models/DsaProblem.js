const mongoose = require("mongoose");

const DsaProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    topic: { type: String, required: true, index: true },
    tags: [String],
    link: { type: String, required: true },
    gfg_link: { type: String, default: "" },
    source: { type: String, default: "leetcode" },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DsaProblemSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.model("DsaProblem", DsaProblemSchema);

