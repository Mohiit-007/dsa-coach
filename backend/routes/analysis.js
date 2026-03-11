const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const History = require("../models/History");
const User = require("../models/User");
const DsaStatus = require("../models/DsaStatus");
const McqAttempt = require("../models/McqAttempt");
const { protect, checkToolLimit } = require("../middleware/auth");

// Lazy init — reads .env after dotenv loads, won't crash on startup
let _groq = null;
const getGroq = () => {
  if (!_groq) {
    console.log("[GROQ] Initializing Groq client...");
    console.log("[GROQ] API Key exists:", !!process.env.GROQ_API_KEY);
    console.log("[GROQ] API Key length:", process.env.GROQ_API_KEY?.length || 0);
    
    if (!process.env.GROQ_API_KEY) {
      console.error("[GROQ] GROQ_API_KEY is missing in .env — get a free key at https://console.groq.com");
      throw new Error("GROQ_API_KEY is missing in .env — get a free key at https://console.groq.com");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("[GROQ] Groq client initialized successfully");
  }
  return _groq;
};

// Groq helper — calls llama-3.3-70b with a system + user prompt, returns raw text
const callGroq = async (system, user, maxTokens = 8000) => {
  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: user   },
    ],
  });
  return completion.choices[0]?.message?.content || "";
};

const parseAI = (raw) => {
  let clean = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Invalid AI response format");
  clean = clean.slice(start, end + 1);

  try {
    return JSON.parse(clean);
  } catch {
    // Attempt 1: escape control chars outside strings (common when model includes raw newlines)
    let fixed = clean.replace(/("(?:[^"\\]|\\.)*")|([\r\n\t])/g, (m, str, ctrl) => {
      if (str) return str;
      return ctrl === "\n" ? "\\n" : ctrl === "\r" ? "\\r" : ctrl === "\t" ? "\\t" : " ";
    });
    try {
      return JSON.parse(fixed);
    } catch {
      // Attempt 2: quote unquoted object keys (e.g. { foo: 1 } -> { "foo": 1 })
      fixed = fixed.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
      return JSON.parse(fixed);
    }
  }
};

const buildPrompt = (title, description, code, language) => `You are an expert Data Structures and Algorithms mentor and senior software engineer.

Explain everything as if the user is a BEGINNER:
- Use simple, friendly language
- Avoid heavy jargon or, if you must use a term, briefly define it in-place
- Prefer short sentences and concrete examples
- Focus on building intuition first, then the formal details

Analyze this coding problem and solution. Return ONLY valid JSON, no markdown, no extra text.
Important:
- The code may have syntax/type errors or be incomplete. Do NOT fail because of that.
- Still infer the intended algorithm and analyze it.
- Choose an algorithm pattern from this list when possible:
  Brute Force, Hash Map, Sliding Window, Two Pointers, Binary Search, Dynamic Programming, BFS / DFS, Greedy, Recursion, Backtracking

PROBLEM TITLE: ${title}
PROBLEM DESCRIPTION: ${description || "Not provided"}
USER CODE:
${code}
PROGRAMMING LANGUAGE: ${language}

Return this exact JSON structure:
{
  "algorithm_pattern": "One of: Brute Force | Hash Map | Sliding Window | Two Pointers | Binary Search | Dynamic Programming | BFS / DFS | Greedy | Recursion | Backtracking | Other",
  "difficulty": "Easy|Medium|Hard",
  "code_analysis": {
    "time_complexity": "O(?) for the USER'S current code",
    "space_complexity": "O(?) for the USER'S current code",
    "explanation": "Beginner-friendly explanation of how the USER'S current code works, step by step. Start with 2-3 sentences of plain-English intuition about the approach, then describe the algorithm in numbered steps or short paragraphs. Explicitly mention why the time and space complexities have those Big-O values."
  },
  "is_optimal": true,
  "optimization_advice": "Beginner-friendly advice on how to improve the USER'S code if it is not optimal. Explain what to change in plain English. If already optimal, return an empty string.",
  "optimized_solution": {
    "time_complexity": "O(?) for the optimal approach",
    "space_complexity": "O(?) for the optimal approach",
    "explanation": "Beginner-friendly explanation of the optimal approach. First explain the high-level idea in 2-3 simple sentences, then summarize how it works in steps. Clearly compare this optimal complexity with the USER'S current complexity so a beginner understands the improvement.",
    "code": "full optimized code here with \\n for newlines, written in the same language as the user's code"
  },
  "hints": ["hint 1 - vague", "hint 2 - moderate", "hint 3 - specific"],
  "interview_followups": ["question 1", "question 2", "question 3"],
  "related_problems": [
    {
      "title": "string",
      "difficulty": "Easy|Medium|Hard",
      "topic": "string",
      "description": "one short line",
      "link": "optional URL to the problem on LeetCode (if you know it) or empty string"
    }
  ]
}`;

// @route   POST /api/analysis/analyze
// Free plan: 10 analyses/day (separate from explain/debug limits)
router.post("/analyze", protect, checkToolLimit("dailyAnalyzeUsage", "code analyses"), async (req, res) => {
  try {
    const { problemTitle, problemDescription, userCode, language } = req.body;

    if (!problemTitle || !userCode) {
      return res.status(400).json({ success: false, message: "Problem title and code are required" });
    }

    // Call Groq API (retry once if JSON is malformed)
    const prompt = buildPrompt(problemTitle, problemDescription, userCode, language);
    let raw = await callGroq(
      "You are a DSA expert. Respond ONLY with valid JSON. No markdown fences, no extra text.",
      prompt,
      6500
    );

    let result;
    try {
      result = parseAI(raw);
    } catch (e) {
      raw = await callGroq(
        'Return ONLY valid minified JSON (strict JSON). All keys must be in double quotes. No markdown. No commentary.',
        prompt,
        6500
      );
      try {
        result = parseAI(raw);
      } catch (e2) {
        console.error("[ANALYZE] AI returned malformed JSON after retry:", e2?.message);
        return res.status(502).json({
          success: false,
          message: "Analysis failed due to malformed AI response. Please try again.",
        });
      }
    }

    // Save to unified history (replaces old Analysis model)
    const historyEntry = await History.create({
      user: req.user.id,
      toolType: "analyze",
      codeInput: userCode,
      language,
      resultOutput: result,
      problemTitle,
      problemDescription,
    });

    // Update user stats and per-tool usage counters
    const user = await User.findById(req.user.id);
    user.dailyUsage = (user.dailyUsage || 0) + 1;
    user.dailyAnalyzeUsage = (user.dailyAnalyzeUsage || 0) + 1;
    user.totalAnalyses += 1;
    user.lastActive = Date.now();

    // Update topic stats (per-algorithm pattern)
    if (result.algorithm_pattern) {
      const current = user.topicStats.get(result.algorithm_pattern) || 0;
      user.topicStats.set(result.algorithm_pattern, current + 1);
    }
    await user.save();

    res.status(201).json({ success: true, data: historyEntry });
  } catch (err) {
    console.error("Analysis error:", err.message);
    res.status(500).json({ success: false, message: "Analysis failed. Please try again." });
  }
});

// @route   POST /api/analysis/debug
// Simple debugging helper that finds likely bugs with line numbers
// Free plan: 10 debug runs/day (separate from analyze/explain limits)
router.post("/debug", protect, checkToolLimit("dailyDebugUsage", "debug runs"), async (req, res) => {
  try {
    const { userCode, language } = req.body;
    if (!userCode) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    const debugPrompt = `You are a senior engineer helping a beginner debug their code.

The user pasted this code (it may have syntax errors OR logical bugs):
LANGUAGE: ${language || "C++"}
CODE:
${userCode}

Your task:
- Carefully scan the code for problems.
- Focus on things that would actually break the program or produce wrong results.
- Use the given line numbers (assume the first line of the snippet is line 1).

Return ONLY valid JSON with this structure (no markdown, no comments):
{
  "summary": "short beginner-friendly overview of what is going wrong overall (2-3 sentences)",
  "issues": [
    {
      "line": 5,
      "type": "syntax|logic|style",
      "message": "short description of the bug in simple language",
      "suggestion": "how to fix it in 1-2 sentences"
    }
  ],
  "fixed_code": "full corrected code with \\n line breaks in the same language as the user's code"
}

Rules:
- Always use integer line numbers for the 'line' field.
- If the code is perfectly fine, return an empty 'issues' array and explain that in 'summary'.
- Keep messages short, concrete, and easy for a beginner to understand.`;

    let raw = await callGroq(
      "You are a DSA mentor. Respond ONLY with valid JSON. No markdown.",
      debugPrompt,
      4000
    );

    let parsed;
    try {
      parsed = parseAI(raw);
    } catch {
      raw = await callGroq(
        "Return ONLY valid minified JSON matching the requested schema. No markdown.",
        debugPrompt,
        4000
      );
      parsed = parseAI(raw);
    }

    // Ensure issues is always an array of objects with a numeric line
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues
          .map((i) => ({
            line: Number.isInteger(i.line) ? i.line : parseInt(i.line, 10) || 1,
            type: i.type || "logic",
            message: i.message || "",
            suggestion: i.suggestion || "",
          }))
          .filter((i) => i.message)
      : [];

    const debugResult = {
      summary: parsed.summary || "",
      issues,
      fixed_code: parsed.fixed_code || "",
    };
    
    // Update user stats and per-tool usage counters
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.dailyUsage = (user.dailyUsage || 0) + 1;
        user.dailyDebugUsage = (user.dailyDebugUsage || 0) + 1;
        user.lastActive = Date.now();
        await user.save();
      }
    } catch {
      // Non-fatal for the debugging response
    }

    res.json({
      success: true,
      data: debugResult,
    });
  } catch (err) {
    console.error("Debug error:", err.message);
    res.status(500).json({ success: false, message: `Debugging failed: ${err.message}` });
  }
});

// @route   GET /api/analysis/history
router.get("/history", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { user: req.user.id };
    if (req.query.language) filter.language = req.query.language;
    if (req.query.pattern) filter["result.algorithm_pattern"] = new RegExp(req.query.pattern, "i");
    if (req.query.optimal === "true") filter["result.is_optimal"] = true;
    if (req.query.optimal === "false") filter["result.is_optimal"] = false;

    const total = await Analysis.countDocuments(filter);
    const analyses = await Analysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({ success: true, data: analyses, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/analysis/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user.id });
    if (!analysis) return res.status(404).json({ success: false, message: "Analysis not found" });
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/analysis/:id/bookmark
router.put("/:id/bookmark", protect, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user.id });
    if (!analysis) return res.status(404).json({ success: false, message: "Not found" });
    analysis.isBookmarked = !analysis.isBookmarked;
    await analysis.save();
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/analysis/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: "Analysis deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/analysis/stats/overview
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const total = await Analysis.countDocuments({ user: userId });
    const optimal = await Analysis.countDocuments({ user: userId, "result.is_optimal": true });
    const dsaSolved = await DsaStatus.countDocuments({ user: userId, solved: true });

    const mcqAgg = await McqAttempt.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          avgAccuracy: { $avg: "$accuracy" },
        },
      },
    ]);
    const mcqAttempts = mcqAgg[0]?.attempts || 0;
    const mcqAccuracy = mcqAttempts ? Math.round(mcqAgg[0].avgAccuracy) : 0;

    const patternAgg = await Analysis.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: "$result.algorithm_pattern", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const langAgg = await Analysis.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentActivity = await Analysis.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(7)
      .select("createdAt result.is_optimal result.algorithm_pattern problemTitle");

    res.json({
      success: true,
      data: {
        total,
        optimal,
        suboptimal: total - optimal,
        accuracy: total > 0 ? Math.round((optimal / total) * 100) : 0,
        dsaSolved,
        mcqAttempts,
        mcqAccuracy,
        patterns: patternAgg,
        languages: langAgg,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;