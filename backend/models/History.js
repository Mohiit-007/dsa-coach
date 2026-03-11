const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toolType: { 
      type: String, 
      required: true, 
      enum: ["analyze", "explain", "debug"],
      index: true
    },
    codeInput: { type: String, required: true },
    language: { type: String, required: true, default: "C++" },
    resultOutput: { type: mongoose.Schema.Types.Mixed, required: true },
    // Optional fields for analyze tool
    problemTitle: { type: String, default: "" },
    problemDescription: { type: String, default: "" },
    // Common fields
    isBookmarked: { type: Boolean, default: false },
    tags: [String],
  },
  { timestamps: true }
);

// Indexes for efficient queries
HistorySchema.index({ user: 1, createdAt: -1 });
HistorySchema.index({ user: 1, toolType: 1, createdAt: -1 });
HistorySchema.index({ user: 1, language: 1, createdAt: -1 });

module.exports = mongoose.model("History", HistorySchema);
