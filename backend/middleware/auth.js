const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Shared free-plan per-tool daily limit
const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT) || 10;

// Helper: reset all daily counters if a new day has started
const resetDailyIfNeeded = async (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.usageReset || user.usageReset < today) {
    user.dailyUsage = 0;
    user.dailyAnalyzeUsage = 0;
    user.dailyExplainUsage = 0;
    user.dailyDebugUsage = 0;
    user.usageReset = today;
    await user.save();
  }
};

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token is invalid or expired" });
  }
};

// Generic per-tool usage limiter: 10/day for each tool on the free plan
const checkToolLimit = (field, label) => {
  return async (req, res, next) => {
    const user = req.user;
    if (user.plan === "pro") return next();

    await resetDailyIfNeeded(user);

    const current = user[field] || 0;
    if (current >= FREE_LIMIT) {
      return res.status(429).json({
        success: false,
        message: `Free plan limit reached (${FREE_LIMIT} ${label}/day). Upgrade to Pro for unlimited access.`,
        limitReached: true,
      });
    }
    next();
  };
};

// Backwards-compatible alias for any legacy usage checks (if still used)
const checkUsageLimit = checkToolLimit("dailyUsage", "analyses");

module.exports = {
  protect: exports.protect,
  checkUsageLimit,
  checkToolLimit,
};
