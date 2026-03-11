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
  let clean = String(raw || "").trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  clean = clean.slice(start, end + 1);

  // Attempt 1 – raw parse
  try { return JSON.parse(clean); } catch {}

  // Attempt 2 – escape stray control characters outside quoted strings
  let fixed = clean.replace(
    /("(?:[^"\\]|\\.)*")|([\x00-\x1f])/g,
    (m, str, ctrl) => {
      if (str) return str;
      const map = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };
      return map[ctrl] ?? " ";
    }
  );
  try { return JSON.parse(fixed); } catch {}

  // Attempt 3 – quote bare keys
  fixed = fixed.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
  try { return JSON.parse(fixed); } catch {}

  // Attempt 4 – remove trailing comma before ] or }
  fixed = fixed.replace(/,(\s*[}\]])/g, "$1");
  try { return JSON.parse(fixed); } catch {}

  // Attempt 5 – truncated JSON: close any open arrays/objects
  const stack = [];
  for (const ch of fixed) {
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  const recovered = fixed + stack.reverse().join("");
  try { return JSON.parse(recovered); } catch (e) {
    throw new Error(`JSON recovery failed: ${e.message}`);
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
    "explanation": "Beginner-friendly explanation of how the USER'S current code works, step by step."
  },
  "is_optimal": true,
  "optimization_advice": "Beginner-friendly advice on how to improve the USER'S code if it is not optimal. If already optimal, return an empty string.",
  "optimized_solution": {
    "time_complexity": "O(?) for the optimal approach",
    "space_complexity": "O(?) for the optimal approach",
    "explanation": "Beginner-friendly explanation of the optimal approach.",
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
router.post("/analyze", protect, checkToolLimit("dailyAnalyzeUsage", "code analyses"), async (req, res) => {
  try {
    const { problemTitle, problemDescription, userCode, language } = req.body;

    if (!problemTitle || !userCode) {
      return res.status(400).json({ success: false, message: "Problem title and code are required" });
    }

    const prompt = buildPrompt(problemTitle, problemDescription, userCode, language);
    const SYSTEM = "You are a DSA expert. Respond ONLY with valid JSON. No markdown fences, no extra text.";

    let result;
    let raw;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt === 1) {
          raw = await callGroq(SYSTEM, prompt, 8000);
        } else if (attempt === 2) {
          raw = await callGroq(
            "Return ONLY valid minified JSON (strict JSON). All keys double-quoted. No markdown. No commentary.",
            prompt,
            8000
          );
        } else {
          const shortPrompt = `Analyze this DSA problem and return ONLY valid minified JSON.
TITLE: ${problemTitle}
CODE (${language}):
${userCode}

Return this exact structure (minified, no whitespace):
{"algorithm_pattern":"","difficulty":"","code_analysis":{"time_complexity":"","space_complexity":"","explanation":""},"is_optimal":true,"optimization_advice":"","optimized_solution":{"time_complexity":"","space_complexity":"","explanation":"","code":""},"hints":["","",""],"interview_followups":["","",""],"related_problems":[{"title":"","difficulty":"","topic":"","description":"","link":""}]}`;
          raw = await callGroq(
            "Return ONLY valid minified JSON. Fill in all fields. No markdown.",
            shortPrompt,
            8000
          );
        }
        result = parseAI(raw);
        break;
      } catch (e) {
        console.warn(`[ANALYZE] Attempt ${attempt} failed: ${e.message}`);
        if (attempt === 3) {
          console.error("[ANALYZE] All 3 attempts returned malformed JSON");
          return res.status(502).json({
            success: false,
            message: "Analysis failed due to malformed AI response. Please try again.",
          });
        }
      }
    }

    const historyEntry = await History.create({
      user: req.user.id,
      toolType: "analyze",
      codeInput: userCode,
      language,
      resultOutput: result,
      problemTitle,
      problemDescription,
    });

    const user = await User.findById(req.user.id);
    user.dailyUsage = (user.dailyUsage || 0) + 1;
    user.dailyAnalyzeUsage = (user.dailyAnalyzeUsage || 0) + 1;
    user.totalAnalyses += 1;
    user.lastActive = Date.now();

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
router.post("/debug", protect, checkToolLimit("dailyDebugUsage", "debug runs"), async (req, res) => {
  try {
    const { userCode, language, problemTitle } = req.body;
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

    // Save to history so it shows in Recent Activity
    await History.create({
      user: req.user.id,
      toolType: "debug",
      codeInput: userCode,
      language,
      resultOutput: debugResult,
      problemTitle: problemTitle || "Debug Session",
    });

    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.dailyUsage = (user.dailyUsage || 0) + 1;
        user.dailyDebugUsage = (user.dailyDebugUsage || 0) + 1;
        user.lastActive = Date.now();
        await user.save();
      }
    } catch {
      // Non-fatal
    }

    res.json({ success: true, data: debugResult });
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
    const userObjectId = require("mongoose").Types.ObjectId.createFromHexString(userId);

    const total = await History.countDocuments({ user: userId, toolType: "analyze" });
    const optimal = await History.countDocuments({ user: userId, toolType: "analyze", "resultOutput.is_optimal": true });
    const dsaSolved = await DsaStatus.countDocuments({ user: userId, solved: true });

    const mcqAgg = await McqAttempt.aggregate([
      { $match: { user: userObjectId } },
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

    const patternAgg = await History.aggregate([
      { $match: { user: userObjectId, toolType: "analyze" } },
      { $group: { _id: "$resultOutput.algorithm_pattern", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const langAgg = await History.aggregate([
      { $match: { user: userObjectId, toolType: "analyze" } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Recent activity: ALL tool types (analyze, debug, explain) ──
    const recentActivity = await History.find({
      user: userId,
      toolType: { $in: ["analyze", "debug", "explain"] },
    })
      .sort({ createdAt: -1 })
      .limit(7)
      .select("createdAt toolType resultOutput.is_optimal resultOutput.algorithm_pattern problemTitle language");

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