const mongoose = require("mongoose");

const DaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    concept: { type: String, required: true },
    problems: [{ type: String }],
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const LearningPathSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    topics: [{ type: String }],
    duration: { type: Number, required: true },
    goal: { type: String, default: "" },
    progress: { type: Number, default: 0 },
    days: { type: [DaySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningPath", LearningPathSchema);