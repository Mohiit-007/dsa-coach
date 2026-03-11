const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { protect } = require("../middleware/auth");
const Analysis = require("../models/Analysis");
const History = require("../models/History");
const McqAttempt = require("../models/McqAttempt");
const LearningPath = require("../models/LearningPath");
const PDFDocument = require("pdfkit");

// Lazy init — reads .env after dotenv loads, won't crash on startup
let _groq = null;
const getGroq = () => {
  if (!_groq) {
    console.log("[GROQ] Initializing Groq client (learn route)...");
    console.log("[GROQ] API Key exists:", !!process.env.GROQ_API_KEY);
    console.log("[GROQ] API Key length:", process.env.GROQ_API_KEY?.length || 0);
    
    if (!process.env.GROQ_API_KEY) {
      console.error("[GROQ] GROQ_API_KEY is missing in .env — get a free key at https://console.groq.com");
      throw new Error("GROQ_API_KEY is missing in .env — get a free key at https://console.groq.com");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("[GROQ] Groq client initialized successfully (learn route)");
  }
  return _groq;
};

// Groq helper
const callGroq = async (system, user, maxTokens = 4000) => {
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
  let clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  clean = clean.slice(start, end + 1);
  try { return JSON.parse(clean); }
  catch {
    const fixed = clean.replace(/("(?:[^"\\]|\\.)*")|([\r\n\t])/g, (m, s, c) => {
      if (s) return s;
      return c === "\n" ? "\\n" : c === "\r" ? "\\r" : c === "\t" ? "\\t" : " ";
    });
    return JSON.parse(fixed);
  }
};

// ─── TOPIC STRENGTH ANALYSIS ─────────────────────────────────────
// GET /api/learn/topic-strength
router.get("/topic-strength", protect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user.id })
      .select("result.algorithm_pattern result.is_optimal result.code_analysis.time_complexity language createdAt");

    if (analyses.length === 0) {
      return res.json({ success: true, data: { topics: [], summary: "No analyses yet. Start solving problems!" } });
    }

    const patternMap = {};
    analyses.forEach(a => {
      const p = a.result?.algorithm_pattern;
      if (!p) return;
      if (!patternMap[p]) patternMap[p] = { total: 0, optimal: 0, recent: [] };
      patternMap[p].total++;
      if (a.result?.is_optimal) patternMap[p].optimal++;
      patternMap[p].recent.push(a.createdAt);
    });

    const topics = Object.entries(patternMap).map(([name, stats]) => {
      const accuracy = Math.round((stats.optimal / stats.total) * 100);
      const strength = accuracy >= 80 ? "strong" : accuracy >= 50 ? "moderate" : "weak";
      return { name, total: stats.total, optimal: stats.optimal, accuracy, strength };
    }).sort((a, b) => b.total - a.total);

    const strong = topics.filter(t => t.strength === "strong").map(t => t.name);
    const weak = topics.filter(t => t.strength === "weak").map(t => t.name);

    res.json({ success: true, data: { topics, strong, weak, total: analyses.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── LEARNING PATH GENERATOR + PERSISTENCE ───────────────────────
// POST /api/learn/learning-path  -> generate a new plan and save it
router.post("/learning-path", protect, async (req, res) => {
  try {
    const { weakTopics, goal, daysAvailable } = req.body;

    const analyses = await Analysis.find({ user: req.user.id })
      .sort({ createdAt: -1 }).limit(50)
      .select("result.algorithm_pattern result.is_optimal");

    const patternStats = {};
    analyses.forEach(a => {
      const p = a.result?.algorithm_pattern;
      if (!p) return;
      if (!patternStats[p]) patternStats[p] = { total: 0, optimal: 0 };
      patternStats[p].total++;
      if (a.result?.is_optimal) patternStats[p].optimal++;
    });

    const totalDays = Math.min(parseInt(daysAvailable) || 14, 30);

    const prompt = `You are a DSA learning coach. Generate a personalized ${totalDays}-day learning path.

User's weak topics: ${weakTopics?.join(", ") || "Dynamic Programming, Graphs, Trees"}
Goal: ${goal || "Master medium/hard problems"}
Pattern history: ${JSON.stringify(patternStats)}

Return ONLY valid JSON (no markdown):
{
  "title": "string",
  "overview": "string",
  "duration_days": ${totalDays},
  "daily_plans": [
    {
      "day": 1,
      "topic": "string",
      "focus": "string",
      "problems": ["Problem 1", "Problem 2", "Problem 3"],
      "key_concept": "string",
      "difficulty": "Easy|Medium|Hard",
      "estimated_hours": 2
    }
  ],
  "milestones": [
    { "day": ${Math.floor(totalDays / 2)}, "goal": "string" },
    { "day": ${totalDays}, "goal": "string" }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Generate exactly ${totalDays} daily_plans entries.`;

    const raw = await callGroq(
      "You are a DSA expert. Respond ONLY with valid JSON. No markdown.",
      prompt,
      6000
    );
    const result = parseAI(raw);

    // Map AI result to LearningPath document
    const topicsSet = new Set();
    const mappedDays = (result.daily_plans || []).map((d) => {
      if (d.topic) topicsSet.add(d.topic);
      return {
        day: d.day,
        topic: d.topic || "Mixed DSA",
        difficulty: d.difficulty === "Hard" || d.difficulty === "Medium" ? d.difficulty : "Easy",
        concept: d.key_concept || d.focus || "",
        problems: Array.isArray(d.problems) ? d.problems : [],
        completed: false,
      };
    });

    const doc = await LearningPath.create({
      userId: req.user.id,
      title: result.title || "Personalized Learning Path",
      topics: Array.from(topicsSet),
      duration: result.duration_days || mappedDays.length || totalDays,
      goal: goal || "",
      progress: 0,
      days: mappedDays,
    });

    res.json({
      success: true,
      data: {
        _id: doc._id,
        title: doc.title,
        topics: doc.topics,
        duration: doc.duration,
        goal: doc.goal,
        progress: doc.progress,
        days: doc.days,
        createdAt: doc.createdAt,
        aiMeta: result, // keep rich text for UI if needed
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learn/learning-paths -> list all user's learning paths (most recent first)
router.get("/learning-paths", protect, async (req, res) => {
  try {
    const paths = await LearningPath.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select("title topics duration goal progress createdAt");
    res.json({ success: true, data: paths });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learn/learning-path/:id -> fetch single path with days
router.get("/learning-path/:id", protect, async (req, res) => {
  try {
    const lp = await LearningPath.findOne({ _id: req.params.id, userId: req.user.id });
    if (!lp) return res.status(404).json({ success: false, message: "Learning path not found" });
    res.json({ success: true, data: lp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/learn/learning-path/:id/day/:day -> toggle / update completion
router.patch("/learning-path/:id/day/:day", protect, async (req, res) => {
  try {
    const { completed } = req.body;
    const lp = await LearningPath.findOne({ _id: req.params.id, userId: req.user.id });
    if (!lp) return res.status(404).json({ success: false, message: "Learning path not found" });

    const dayNum = parseInt(req.params.day, 10);
    const target = lp.days.find((d) => d.day === dayNum);
    if (!target) return res.status(404).json({ success: false, message: "Day not found" });

    target.completed = typeof completed === "boolean" ? completed : !target.completed;

    const total = lp.days.length || 1;
    const done = lp.days.filter((d) => d.completed).length;
    lp.progress = Math.round((done / total) * 100);

    await lp.save();
    res.json({ success: true, data: lp });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/learn/learning-path/:id -> delete a path
router.delete("/learning-path/:id", protect, async (req, res) => {
  try {
    const deleted = await LearningPath.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ success: false, message: "Learning path not found" });
    res.json({ success: true, message: "Learning path deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learn/learning-path/:id/pdf -> download learning path as PDF
router.get("/learning-path/:id/pdf", protect, async (req, res) => {
  try {
    const lp = await LearningPath.findOne({ _id: req.params.id, userId: req.user.id });
    if (!lp) return res.status(404).json({ success: false, message: "Learning path not found" });

    const filename = `dsa-learning-path-${lp._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .fillColor("#0f172a")
      .text(lp.title || "DSA Mastery Path", { align: "left" })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor("#334155")
      .text(`Duration: ${lp.duration} days`, { continued: true })
      .text(`   ·   Created: ${lp.createdAt.toDateString()}`)
      .moveDown(0.5);

    if (lp.goal) {
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .text(`Goal: ${lp.goal}`)
        .moveDown(0.5);
    }

    if (lp.topics?.length) {
      doc
        .fontSize(11)
        .fillColor("#0f172a")
        .text(`Topics: ${lp.topics.join(", ")}`)
        .moveDown(1);
    }

    // Progress
    doc
      .fontSize(11)
      .fillColor("#0f172a")
      .text(`Progress: ${lp.progress || 0}%`)
      .moveDown(1);

    // Days
    doc
      .moveDown(0.5)
      .fontSize(14)
      .fillColor("#0f172a")
      .text("Daily Plan", { underline: true })
      .moveDown(0.5);

    const daysSorted = [...lp.days].sort((a, b) => a.day - b.day);
    daysSorted.forEach((d) => {
      // Day header
      doc
        .fontSize(12)
        .fillColor("#0f172a")
        .text(`Day ${d.day}: ${d.topic} (${d.difficulty || "Easy"})`);

      // Completion status on its own line (if completed)
      if (d.completed) {
        doc
          .fontSize(10)
          .fillColor("#16a34a")
          .text("✓ Completed");
      }

      // Key concept
      if (d.concept) {
        doc
          .fontSize(10)
          .fillColor("#334155")
          .text(`Key concept: ${d.concept}`);
      }

      // Problems list
      if (Array.isArray(d.problems) && d.problems.length) {
        doc
          .moveDown(0.1)
          .fontSize(10)
          .fillColor("#0f172a")
          .text("Problems:");

        d.problems.forEach((p) => {
          doc
            .fontSize(10)
            .fillColor("#334155")
            .text(`• ${p}`, { indent: 15 });
        });
      }

      doc.moveDown(0.6);
    });

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// ─── MOCK INTERVIEW - GENERATE PROBLEM ─────────────────────────
// POST /api/learn/mock-interview/generate
router.post("/mock-interview/generate", protect, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    const prompt = `You are a senior FAANG interviewer. Generate a realistic coding interview problem.
Topic: ${topic || "Arrays"}
Difficulty: ${difficulty || "Medium"}

Return ONLY valid JSON:
{
  "problem_title": "string",
  "difficulty": "Easy|Medium|Hard",
  "topic": "string",
  "problem_statement": "Full description with context",
  "examples": [
    { "input": "string", "output": "string", "explanation": "string" },
    { "input": "string", "output": "string", "explanation": "string" }
  ],
  "constraints": ["1 <= n <= 10^4", "constraint 2"],
  "hints": ["vague hint", "specific hint"],
  "follow_up": "string",
  "time_limit_minutes": 25,
  "starter_code": {
    "cpp": "class Solution {\\npublic:\\n    // your code here\\n};",
    "python": "class Solution:\\n    def solve(self):\\n        pass",
    "java": "class Solution {\\n    // your code here\\n}"
  }
}`;

    const raw = await callGroq(
      "You are a FAANG interviewer. Respond ONLY with valid JSON.",
      prompt,
      3000
    );
    const result = parseAI(raw);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MOCK INTERVIEW - GENERATE SET (5) ─────────────────────────
// POST /api/learn/mock-interview/generate-set
router.post("/mock-interview/generate-set", protect, async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const t = topic || "Arrays";
    const d = difficulty || "Medium";

    const prompt = `You are a senior FAANG interviewer. Generate 5 realistic coding interview problems.
All problems must match:
- Topic: ${t}
- Difficulty: ${d}

Return ONLY valid JSON:
{
  "problems": [
    {
      "problem_title": "string",
      "difficulty": "Easy|Medium|Hard",
      "topic": "string",
      "problem_statement": "Full description with context",
      "examples": [
        { "input": "string", "output": "string", "explanation": "string" }
      ],
      "constraints": ["1 <= n <= 10^4"],
      "hints": ["vague hint", "specific hint"],
      "follow_up": "string",
      "time_limit_minutes": 25,
      "starter_code": {
        "cpp": "class Solution {\\npublic:\\n    // your code here\\n};",
        "python": "class Solution:\\n    def solve(self):\\n        pass",
        "java": "class Solution {\\n    // your code here\\n}"
      }
    }
  ]
}

Important:
- Return exactly 5 problems in the array.
- Make them diverse (not the same prompt rewritten).
- Keep statements and examples concise enough to fit a single page.`;

    const raw = await callGroq(
      "You are a FAANG interviewer. Respond ONLY with valid JSON. No markdown.",
      prompt,
      7500
    );
    const parsed = parseAI(raw);
    const probs = Array.isArray(parsed?.problems) ? parsed.problems : [];
    if (probs.length !== 5) {
      return res.status(500).json({ success: false, message: "AI did not return exactly 5 problems" });
    }
    res.json({ success: true, data: { problems: probs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MOCK INTERVIEW - EVALUATE SOLUTION ────────────────────────
// POST /api/learn/mock-interview/evaluate
router.post("/mock-interview/evaluate", protect, async (req, res) => {
  try {
    const { problem, userCode, language, timeTaken } = req.body;
    if (!problem || !userCode) return res.status(400).json({ success: false, message: "Missing fields" });

    const prompt = `You are a senior FAANG interviewer evaluating a candidate's solution.

Problem: ${problem.problem_title}
${problem.problem_statement}

Candidate Code (${language}):
${userCode}

Time taken: ${timeTaken || 0} / ${problem.time_limit_minutes} minutes

Evaluate strictly and return ONLY valid JSON:
{
  "score": 85,
  "grade": "B+",
  "verdict": "Accepted|Partial|Rejected",
  "passed_interview": true,
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "feedback": {
    "correctness": "string",
    "efficiency": "string",
    "code_quality": "string",
    "communication": "string"
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "optimal_approach": "brief description",
  "next_steps": ["suggestion 1", "suggestion 2"]
}`;

    const raw = await callGroq(
      "You are a FAANG interviewer. Respond ONLY with valid JSON.",
      prompt,
      2000
    );
    const result = parseAI(raw);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DSA MCQ PRACTICE ────────────────────────────────────────────
// POST /api/learn/mcq/generate
router.post("/mcq/generate", protect, async (req, res) => {
  try {
    const { topic, difficulty } = req.body || {};
    const t = String(topic || "Arrays");
    const d = String(difficulty || "Medium");

    const prompt = `You are a senior DSA instructor and FAANG interviewer. Generate exactly 10 high-quality multiple-choice questions (MCQs) for practicing DSA concepts.

Topic: ${t}
Difficulty: ${d}

Difficulty guidelines (very important):
- Easy:
  - Focus on core definitions, basic properties, and simple Big-O questions
  - Example Arrays easy questions: "What does Two Sum ask you to return?", "What does 'sorted array' mean?", "What is the time complexity of scanning an array once?"
  - Avoid language-specific API trivia (no questions like "what does indexOf do in JS")
- Medium:
  - Focus on understanding of standard interview problems and patterns
  - Ask about when to use Hash Map vs Two Pointers vs Sliding Window, what an optimal approach for famous problems is (e.g., Two Sum, Two Sum II, 3Sum, Maximum Subarray, Product of Array Except Self, Find Duplicate Number, etc.)
  - Include explanations about why a naive O(n^2) solution can be improved and how
- Hard:
  - Focus on time/space complexity tradeoffs, edge cases, and tricky invariants
  - Ask about worst-case behavior, constraints, and how patterns like prefix sums, binary search, DP, or graph traversals change complexity
  - Questions should feel like theory around real LeetCode-style problems, not pure formulas

Return ONLY valid JSON:
{
  "topic": "${t}",
  "difficulty": "${d}",
  "questions": [
    {
      "id": "q1",
      "question": "string (clear, interview-style, single idea)",
      "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
      "answer": "A|B|C|D",
      "explanation": "1-2 sentences explaining why it's correct",
      "concept_tags": ["tag1", "tag2"]
    }
  ]
}

Rules:
- Exactly 10 questions
- Exactly 4 options (A-D)
- Exactly one correct answer
- Questions MUST be about DSA problem solving, patterns, or complexity — NOT about specific programming language methods or syntax
- Prefer classic LeetCode-style problems in your wording (e.g., arrays: Two Sum, 3Sum, subarrays, prefix sums; graphs: BFS/DFS; DP: knapsack, LIS, etc.)
- Keep questions concise and unambiguous`;

    let raw = await callGroq(
      "You are a DSA teacher. Respond ONLY with valid JSON. No markdown.",
      prompt,
      6500
    );

    let parsed;
    try {
      parsed = parseAI(raw);
    } catch {
      raw = await callGroq(
        "Return ONLY valid minified JSON. No markdown. No extra text.",
        prompt,
        6500
      );
      parsed = parseAI(raw);
    }

    const qs = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (qs.length !== 10) {
      return res.status(500).json({ success: false, message: "AI did not return exactly 10 MCQs" });
    }

    // Light normalization: ensure ids exist
    const questions = qs.map((q, i) => ({
      id: q.id || `q${i + 1}`,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation || "",
      concept_tags: Array.isArray(q.concept_tags) ? q.concept_tags : [],
    }));

    res.json({ success: true, data: { topic: t, difficulty: d, questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/learn/mcq/last  -> latest MCQ attempt summary for current user
router.get("/mcq/last", protect, async (req, res) => {
  try {
    const last = await McqAttempt.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!last) {
      return res.json({ success: true, data: null });
    }
    res.json({
      success: true,
      data: {
        topic: last.topic,
        difficulty: last.difficulty,
        total: last.total,
        correct: last.correct,
        accuracy: last.accuracy,
        createdAt: last.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/learn/mcq/result
router.post("/mcq/result", protect, async (req, res) => {
  try {
    const { topic, difficulty, score, correct, total, wrong_tags } = req.body || {};
    const t = String(topic || "Arrays");
    const d = String(difficulty || "Medium");
    const sc = Number(score || 0);
    const corr = Number(correct || 0);
    const tot = Number(total || 10);
    const tags = Array.isArray(wrong_tags) ? wrong_tags.slice(0, 12) : [];

    // Save attempt for dashboard accuracy tracking
    try {
      await McqAttempt.create({
        user: req.user.id,
        topic: t,
        difficulty: d,
        total: tot,
        correct: corr,
        accuracy: sc,
        wrong_tags: tags,
      });
    } catch {
      // non-fatal
    }

    const prompt = `You are a DSA coach. Given quiz results, produce short actionable feedback, weak concept identification, and recommended coding problems.

Topic: ${t}
Difficulty: ${d}
ScorePercent: ${sc}
Correct: ${corr}
Total: ${tot}
WrongConceptTags: ${JSON.stringify(tags)}

Return ONLY valid JSON:
{
  "feedback": "string (2-4 sentences, beginner-friendly)",
  "weak_concepts": ["string", "string"],
  "recommended_problems": [
    { "title": "string", "difficulty": "Easy|Medium|Hard", "topic": "string", "description": "one short line" }
  ]
}

Rules:
- weak_concepts should be derived from WrongConceptTags; if empty, infer 2-3 likely next concepts for the topic
- recommended_problems: 4 to 6 items, relevant to the topic and weak concepts`;

    let raw = await callGroq(
      "You are a DSA teacher. Respond ONLY with valid JSON. No markdown.",
      prompt,
      3500
    );
    let parsed;
    try {
      parsed = parseAI(raw);
    } catch {
      raw = await callGroq(
        "Return ONLY valid minified JSON. No markdown. No extra text.",
        prompt,
        3500
      );
      parsed = parseAI(raw);
    }

    res.json({
      success: true,
      data: {
        feedback: parsed.feedback || "",
        weak_concepts: Array.isArray(parsed.weak_concepts) ? parsed.weak_concepts : [],
        recommended_problems: Array.isArray(parsed.recommended_problems) ? parsed.recommended_problems : [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── AI CODE EXPLANATION ────────────────────────────────────────
// POST /api/learn/explain
router.post("/explain", protect, async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });

    const prompt = `You are a beginner-friendly coding mentor.

Explain this ${language} code step-by-step for a beginner learning DSA.
Important:
- The code may have syntax/type errors or be incomplete. Do NOT fail because of that.
- Still infer the intended algorithm and explain it.
- Always include time/space complexity for the intended algorithm.
- Also include the optimal time/space complexity and what would make it optimal (if the code is already optimal, say so).
- Include a small execution walkthrough using a simple example input (you can choose an example if not obvious).
- Also provide an optional "flow" list that reads like a simple flowchart.

Code:
${code}

Return ONLY valid JSON:
{
  "summary": "one-line summary",
  "steps": [
    { "line_range": "1-3", "explanation": "what these lines do" }
  ],
  "key_variables": [
    { "name": "varName", "purpose": "what it stores/tracks" }
  ],
  "algorithm_used": "string",
  "beginner_tip": "helpful tip for beginners",
  "time_complexity": "O(?)",
  "space_complexity": "O(?)",
  "is_optimal": true,
  "optimal_time_complexity": "O(?)",
  "optimal_space_complexity": "O(?)",
  "optimal_approach": "1-3 sentences describing the optimal approach and why it is optimal",
  "walkthrough": {
    "input": "example input in a short readable form",
    "steps": ["step 1", "step 2", "step 3"],
    "output": "example output"
  },
  "flow": ["Start", "Step", "Decision", "End"]
}`;

    let raw = await callGroq(
      "You are a DSA teacher. Respond ONLY with valid JSON. No markdown fences. No extra text.",
      prompt,
      2600
    );

    let result;
    try {
      result = parseAI(raw);
    } catch (e) {
      // Retry once with stricter formatting instructions to avoid breaking the UI,
      // especially when the input code is malformed.
      raw = await callGroq(
        "Return ONLY valid minified JSON. Do not use markdown. Do not add commentary.",
        prompt,
        2600
      );
      result = parseAI(raw);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;