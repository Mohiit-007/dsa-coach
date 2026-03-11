const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const History = require("../models/History");

// @route   POST /api/history/save
// @desc    Save a history entry for any tool
router.post("/save", protect, async (req, res) => {
  try {
    console.log(`[BACKEND] History save request: ${req.body.toolType} from user ${req.user.id}`);
    console.log(`[BACKEND] Request body keys:`, Object.keys(req.body));
    
    const { toolType, codeInput, language, resultOutput, problemTitle, problemDescription } = req.body;
    
    // Validate required fields
    if (!toolType || !["analyze", "explain", "debug"].includes(toolType)) {
      return res.status(400).json({ success: false, message: "Valid toolType is required" });
    }
    
    if (!codeInput) {
      return res.status(400).json({ success: false, message: "Code input is required" });
    }
    
    if (!resultOutput) {
      return res.status(400).json({ success: false, message: "Result output is required" });
    }

    // Create history entry
    const historyEntry = await History.create({
      user: req.user.id,
      toolType,
      codeInput,
      language: language || "C++",
      resultOutput,
      problemTitle: problemTitle || "",
      problemDescription: problemDescription || "",
    });

    console.log(`[BACKEND] History entry created with ID: ${historyEntry._id}`);
    res.status(201).json({ success: true, data: historyEntry });
  } catch (err) {
    console.error("[BACKEND] History save error:", err.message);
    res.status(500).json({ success: false, message: `Failed to save history: ${err.message}` });
  }
});

// @route   GET /api/history
// @desc    Get user's history with filtering and pagination
router.get("/", protect, async (req, res) => {
  try {
    console.log(`[BACKEND] === History Fetch Request ===`);
    console.log(`[BACKEND] User ID: ${req.user.id}`);
    console.log(`[BACKEND] Query params:`, req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { user: req.user.id };
    
    if (req.query.toolType) {
      const toolTypes = Array.isArray(req.query.toolType) 
        ? req.query.toolType 
        : [req.query.toolType];
      if (toolTypes.every(type => ["analyze", "explain", "debug"].includes(type))) {
        filter.toolType = { $in: toolTypes };
      }
    }
    
    if (req.query.language) {
      filter.language = req.query.language;
    }
    
    if (req.query.search) {
      filter.$or = [
        { codeInput: { $regex: req.query.search, $options: "i" } },
        { problemTitle: { $regex: req.query.search, $options: "i" } },
        { problemDescription: { $regex: req.query.search, $options: "i" } }
      ];
    }

    console.log(`[BACKEND] Filter:`, filter);
    console.log(`[BACKEND] Skip: ${skip}, Limit: ${limit}`);

    const total = await History.countDocuments(filter);
    const history = await History.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`[BACKEND] ✅ Found ${history.length} entries`);
    console.log(`[BACKEND] Total count: ${total}`);

    res.json({ 
      success: true, 
      data: history, 
      total, 
      page, 
      pages: Math.ceil(total / limit) 
    });
  } catch (err) {
    console.error("[BACKEND] ❌ History fetch error:", err.message);
    res.status(500).json({ success: false, message: `Failed to fetch history: ${err.message}` });
  }
});

// @route   GET /api/history/:id
// @desc    Get a specific history entry
router.get("/:id", protect, async (req, res) => {
  try {
    const history = await History.findOne({ _id: req.params.id, user: req.user.id });
    if (!history) {
      return res.status(404).json({ success: false, message: "History entry not found" });
    }
    res.json({ success: true, data: history });
  } catch (err) {
    console.error("History fetch error:", err.message);
    res.status(500).json({ success: false, message: `Failed to fetch history: ${err.message}` });
  }
});

// @route   DELETE /api/history/:id
// @desc    Delete a history entry
router.delete("/:id", protect, async (req, res) => {
  try {
    const history = await History.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!history) {
      return res.status(404).json({ success: false, message: "History entry not found" });
    }
    res.json({ success: true, message: "History entry deleted successfully" });
  } catch (err) {
    console.error("History delete error:", err.message);
    res.status(500).json({ success: false, message: `Failed to delete history: ${err.message}` });
  }
});

// @route   PATCH /api/history/:id/bookmark
// @desc    Toggle bookmark on a history entry
router.patch("/:id/bookmark", protect, async (req, res) => {
  try {
    const history = await History.findOne({ _id: req.params.id, user: req.user.id });
    if (!history) {
      return res.status(404).json({ success: false, message: "History entry not found" });
    }
    
    history.isBookmarked = !history.isBookmarked;
    await history.save();
    
    res.json({ success: true, data: history });
  } catch (err) {
    console.error("History bookmark error:", err.message);
    res.status(500).json({ success: false, message: `Failed to update bookmark: ${err.message}` });
  }
});

// @route   GET /api/history/stats
// @desc    Get user's history statistics
router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await History.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: "$toolType",
          count: { $sum: 1 },
          lastUsed: { $max: "$createdAt" }
        }
      }
    ]);

    const totalEntries = await History.countDocuments({ user: req.user.id });
    const bookmarkedCount = await History.countDocuments({ user: req.user.id, isBookmarked: true });

    res.json({
      success: true,
      data: {
        totalEntries,
        bookmarkedCount,
        toolStats: stats
      }
    });
  } catch (err) {
    console.error("History stats error:", err.message);
    res.status(500).json({ success: false, message: `Failed to fetch stats: ${err.message}` });
  }
});

module.exports = router;
