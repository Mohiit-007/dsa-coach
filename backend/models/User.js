const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 50 },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    avatar: { type: String, default: "" },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    preferredLanguage: { type: String, default: "C++" },
    dailyUsage: { type: Number, default: 0 },
    usageReset: { type: Date, default: Date.now },
    totalAnalyses: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    streakLastSolved: { type: Date, default: null },
    lastActive: { type: Date, default: Date.now },
    topicStats: {
      type: Map,
      of: Number,
      default: {},
    },
    bio: { type: String, default: "", maxlength: 200 },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

module.exports = mongoose.model("User", UserSchema);
