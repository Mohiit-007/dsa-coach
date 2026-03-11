const mongoose = require("mongoose");

const McqAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true, index: true },
    total: { type: Number, required: true },
    correct: { type: Number, required: true },
    accuracy: { type: Number, required: true }, // percent 0-100
    wrong_tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

McqAttemptSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("McqAttempt", McqAttemptSchema);

