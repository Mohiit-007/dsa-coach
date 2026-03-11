const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

exports.checkUsageLimit = async (req, res, next) => {
  const user = req.user;
  if (user.plan === "pro") return next();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.usageReset || user.usageReset < today) {
    user.dailyUsage = 0;
    user.usageReset = today;
    await user.save();
  }

  const FREE_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT) || 10;
  if (user.dailyUsage >= FREE_LIMIT) {
    return res.status(429).json({
      success: false,
      message: `Free plan limit reached (${FREE_LIMIT} analyses/day). Upgrade to Pro for unlimited access.`,
      limitReached: true,
    });
  }
  next();
};

module.exports = { protect: exports.protect, checkUsageLimit: exports.checkUsageLimit };
