const mongoose = require("mongoose");

const DsaStatusSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "DsaProblem", required: true, index: true },
    solved: { type: Boolean, default: false },
    revision: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DsaStatusSchema.index({ user: 1, problem: 1 }, { unique: true });

module.exports = mongoose.model("DsaStatus", DsaStatusSchema);

