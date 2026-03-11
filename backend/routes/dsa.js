const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { protect } = require("../middleware/auth");
const DsaProblem = require("../models/DsaProblem");
const DsaStatus = require("../models/DsaStatus");
const User = require("../models/User");

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Sliding Window",
  "Backtracking",
  "Binary Search",
];

function topicSlug(topic) {
  return topic.toLowerCase().replace(/\s+/g, "-");
}

function hashStringToInt(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayNumber(d) {
  if (!d) return null;
  return Math.floor(d.getTime() / 86400000);
}

async function getStatusMap(userId, problemIds) {
  const statuses = await DsaStatus.find({ user: userId, problem: { $in: problemIds } })
    .select("problem solved revision")
    .lean();
  const map = new Map();
  statuses.forEach((s) => map.set(String(s.problem), { solved: !!s.solved, revision: !!s.revision }));
  return map;
}

// GET /api/dsa/topics
router.get("/topics", protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const counts = await DsaProblem.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: "$topic", total: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.total]));

    const solved = await DsaStatus.aggregate([
      { $match: { user: userId, solved: true } },
      {
        $lookup: {
          from: "dsaproblems",
          localField: "problem",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: "$p" },
      { $group: { _id: "$p.topic", solved: { $sum: 1 } } },
    ]);
    const solvedMap = new Map(solved.map((s) => [s._id, s.solved]));

    const data = TOPICS.map((t) => ({
      topic: t,
      slug: topicSlug(t),
      total: countMap.get(t) || 0,
      solved: solvedMap.get(t) || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dsa/all?difficulty=Easy|Medium|Hard&status=solved|unsolved|revision|all&search=...&topic=...
// Returns all problems (for accordion UI) with status included.
router.get("/all", protect, async (req, res) => {
  try {
    const { topic, difficulty, status = "all", search } = req.query;

    const filter = { is_active: true };
    if (topic) filter.topic = String(topic);
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: String(search), $options: "i" };

    const problems = await DsaProblem.find(filter)
      .select("title slug difficulty topic tags link gfg_link source order")
      .sort({ topic: 1, order: 1, difficulty: 1, title: 1 })
      .lean();

    const ids = problems.map((p) => p._id);
    const statusMap = await getStatusMap(req.user.id, ids);

    let data = problems.map((p) => ({
      ...p,
      status: statusMap.get(String(p._id)) || { solved: false, revision: false },
    }));

    if (status === "solved") data = data.filter((p) => p.status.solved);
    if (status === "unsolved") data = data.filter((p) => !p.status.solved);
    if (status === "revision") data = data.filter((p) => p.status.revision);

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dsa/problems?topic=Arrays&difficulty=Easy&status=solved|unsolved|revision|all&search=...
router.get("/problems", protect, async (req, res) => {
  try {
    const { topic, difficulty, status = "all", search } = req.query;

    const filter = { is_active: true };
    if (topic) filter.topic = topic;
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) filter.difficulty = difficulty;
    if (search) filter.title = { $regex: String(search), $options: "i" };

    // Status filter is applied after we fetch status map (fast enough for ~500 items).
    const problems = await DsaProblem.find(filter)
      .select("title slug difficulty topic tags link gfg_link source order")
      .sort({ topic: 1, order: 1, difficulty: 1, title: 1 })
      .lean();

    const ids = problems.map((p) => p._id);
    const statusMap = await getStatusMap(req.user.id, ids);

    let data = problems.map((p) => ({
      ...p,
      status: statusMap.get(String(p._id)) || { solved: false, revision: false },
    }));

    if (status === "solved") data = data.filter((p) => p.status.solved);
    if (status === "unsolved") data = data.filter((p) => !p.status.solved);
    if (status === "revision") data = data.filter((p) => p.status.revision);

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/dsa/problems/:id/status  { solved?: boolean, revision?: boolean }
router.put("/problems/:id/status", protect, async (req, res) => {
  try {
    const { solved, revision } = req.body || {};
    const problem = await DsaProblem.findById(req.params.id).select("_id").lean();
    if (!problem) return res.status(404).json({ success: false, message: "Problem not found" });

    const existing = await DsaStatus.findOne({ user: req.user.id, problem: problem._id });
    const prevSolved = existing?.solved === true;

    const update = {};
    if (typeof solved === "boolean") update.solved = solved;
    if (typeof revision === "boolean") update.revision = revision;

    const next = await DsaStatus.findOneAndUpdate(
      { user: req.user.id, problem: problem._id },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select("solved revision").lean();

    // Update user solved count + streak for first-time solve toggle
    if (!prevSolved && next.solved) {
      const user = await User.findById(req.user.id).select("problemsSolved streak streakLastSolved");
      if (user) {
        user.problemsSolved = (user.problemsSolved || 0) + 1;
        const today = new Date();
        const todayDay = dayNumber(today);
        const lastDay = dayNumber(user.streakLastSolved);

        if (lastDay == null) {
          user.streak = 1;
        } else if (lastDay === todayDay) {
          // already counted today, keep streak
        } else if (lastDay === todayDay - 1) {
          user.streak = (user.streak || 0) + 1;
        } else {
          user.streak = 1;
        }
        user.streakLastSolved = today;
        await user.save();
      }
    }
    if (prevSolved && !next.solved) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { problemsSolved: -1 } });
    }

    res.json({ success: true, data: next });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dsa/potd
router.get("/potd", protect, async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    const count = await DsaProblem.countDocuments({ is_active: true });
    if (count === 0) return res.json({ success: true, data: null });

    const idx = hashStringToInt(key) % count;
    const potd = await DsaProblem.findOne({ is_active: true })
      .skip(idx)
      .select("title slug difficulty topic tags link gfg_link source")
      .lean();

    if (!potd) return res.json({ success: true, data: null });
    const st = await DsaStatus.findOne({ user: req.user.id, problem: potd._id })
      .select("solved revision")
      .lean();

    res.json({
      success: true,
      data: {
        ...potd,
        status: { solved: !!st?.solved, revision: !!st?.revision },
        date: key,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

