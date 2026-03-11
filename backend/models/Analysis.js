const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problemTitle: { type: String, required: true, trim: true },
    problemDescription: { type: String, default: "" },
    userCode: { type: String, required: true },
    language: { type: String, required: true, default: "C++" },
    result: {
      algorithm_pattern: String,
      code_analysis: {
        time_complexity: String,
        space_complexity: String,
        explanation: String,
      },
      is_optimal: Boolean,
      optimization_advice: String,
      optimized_solution: {
        time_complexity: String,
        space_complexity: String,
        explanation: String,
        code: String,
      },
      hints: [String],
      interview_followups: [String],
      difficulty: String,
      related_problems: [
        {
          title: String,
          difficulty: String,
          topic: String,
          description: String,
          link: String,
        },
      ],
    },
    isBookmarked: { type: Boolean, default: false },
    tags: [String],
  },
  { timestamps: true }
);

AnalysisSchema.index({ user: 1, createdAt: -1 });
AnalysisSchema.index({ user: 1, "result.algorithm_pattern": 1 });

module.exports = mongoose.model("Analysis", AnalysisSchema);
