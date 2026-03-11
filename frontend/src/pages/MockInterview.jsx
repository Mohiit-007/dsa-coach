import { useEffect, useMemo, useState } from "react";
import { Play, RefreshCw, CheckCircle, XCircle, ListChecks, ChevronRight, BarChart2, Lightbulb, ExternalLink } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Sliding Window",
  "Two Pointers",
  "Stack & Queue",
  "Binary Search",
  "Greedy",
  "Recursion",
  "Backtracking",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFF_COLOR = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard: "text-red-400 bg-red-400/10 border-red-400/20",
};

function leetcodeSearchUrl(title) {
  const q = title ? encodeURIComponent(title) : "";
  return `https://leetcode.com/problemset/all/?search=${q}`;
}

export default function MockInterview() {
  const [phase, setPhase] = useState("setup"); // setup | quiz | result
  const [config, setConfig] = useState({ topic: "Arrays", difficulty: "Medium" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null); // { topic, difficulty, questions }
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: "A"|"B"|"C"|"D" }
  const [result, setResult] = useState(null); // computed + AI feedback
  const [reviewMode, setReviewMode] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const questions = quiz?.questions || [];
  const current = questions[active] || null;

  const stats = useMemo(() => {
    const total = questions.length || 10;
    const answered = questions.filter((q) => answers[q.id]).length;
    return { total, answered };
  }, [questions, answers]);

  useEffect(() => {
    api.get("/learn/mcq/last")
      .then((res) => setLastAttempt(res.data.data || null))
      .catch(() => {});
  }, []);

  const start = async () => {
    setLoading(true);
    setResult(null);
    setQuiz(null);
    setAnswers({});
    setActive(0);
    setReviewMode(false);
    try {
      const res = await api.post("/learn/mcq/generate", { topic: config.topic, difficulty: config.difficulty });
      const q = res.data.data;
      setQuiz(q);
      setPhase("quiz");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to generate MCQs");
    } finally {
      setLoading(false);
    }
  };

  const pick = (qid, choice) => {
    if (reviewMode) return;
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
  };

  const finish = async () => {
    if (stats.answered !== stats.total) {
      toast.error("Answer all questions before finishing");
      return;
    }
    setSubmitting(true);
    try {
      const keyed = new Map(questions.map((q) => [q.id, q]));
      let correct = 0;
      const wrong = [];
      const wrongTags = [];

      Object.entries(answers).forEach(([qid, choice]) => {
        const q = keyed.get(qid);
        if (!q) return;
        if (choice === q.answer) {
          correct += 1;
        } else {
          wrong.push({ id: qid, picked: choice, answer: q.answer });
          (q.concept_tags || []).forEach((t) => wrongTags.push(t));
        }
      });

      const total = stats.total;
      const scorePct = Math.round((correct / total) * 100);

      const fb = await api.post("/learn/mcq/result", {
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        score: scorePct,
        correct,
        total,
        wrong_tags: wrongTags,
      });

      setResult({
        correct,
        incorrect: total - correct,
        total,
        accuracy: scorePct,
        wrong,
        feedback: fb.data.data?.feedback || "",
        weak_concepts: fb.data.data?.weak_concepts || [],
        recommended_problems: fb.data.data?.recommended_problems || [],
      });
      setReviewMode(true);
      setPhase("result");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to compute results");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setQuiz(null);
    setAnswers({});
    setActive(0);
    setResult(null);
    setReviewMode(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-up">
      <div className="flex items-start justify-between mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            DSA <span className="text-cyan-400">MCQ Practice</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            Practice DSA concepts with 10 topic-based MCQs (no coding required)
          </p>
        </div>
        {phase !== "setup" && (
          <button onClick={reset} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> New Quiz
          </button>
        )}
      </div>

      {phase === "setup" && (
        <div className="max-w-3xl mx-auto space-y-3">
          {lastAttempt && (
            <div className="card p-4 sm:p-5 flex items-center justify-between gap-3">
              <div>
                <div
                  className={`text-[11px] font-mono tracking-wider uppercase mb-1 ${
                    isLight ? "text-slate-500" : "text-gray-500"
                  }`}
                >
                  Last MCQ Quiz
                </div>
                <div
                  className={`text-sm font-semibold ${
                    isLight ? "text-slate-900" : "text-gray-200"
                  }`}
                >
                  {lastAttempt.topic} • {lastAttempt.difficulty}
                </div>
                <div
                  className={`text-xs font-mono mt-1 ${
                    isLight ? "text-slate-600" : "text-gray-500"
                  }`}
                >
                  Score:{" "}
                  <span className="text-cyan-500 font-bold">
                    {lastAttempt.correct}
                  </span>
                  /{lastAttempt.total} • Accuracy{" "}
                  <span className="text-cyan-500 font-bold">
                    {lastAttempt.accuracy}%
                  </span>
                </div>
              </div>
              <div
                className={`text-xs font-mono text-right ${
                  isLight ? "text-slate-500" : "text-gray-600"
                }`}
              >
                {new Date(lastAttempt.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          )}

          <div className="card p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-4xl sm:text-5xl mb-3">🧠</div>
              <h2 className="text-xl sm:text-2xl font-black mb-2">Choose Topic & Difficulty</h2>
              <p className="text-gray-500 font-mono text-xs sm:text-sm">
                We’ll generate 10 MCQs and show your score + weak concepts + recommended problems
              </p>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-3">
                  Topic
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TOPICS.map((t) => {
                    const active = config.topic === t;
                    const base =
                      "py-2 px-3 rounded-xl border text-xs font-semibold transition-all text-center";
                    const cls = active
                      ? isLight
                        ? "bg-cyan-100 border-cyan-300 text-cyan-700"
                        : "bg-cyan-400/15 border-cyan-400/30 text-cyan-400"
                      : isLight
                        ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        : "glass text-gray-400 hover:text-white";
                    return (
                      <button
                        key={t}
                        onClick={() => setConfig((c) => ({ ...c, topic: t }))}
                        className={`${base} ${cls}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-3">
                  Difficulty
                </label>
                <div className="flex gap-2 sm:gap-3">
                  {DIFFICULTIES.map((d) => {
                    const active = config.difficulty === d;
                    const base =
                      "flex-1 py-2.5 sm:py-3 rounded-xl border text-sm font-bold transition-all";
                    const cls = active
                      ? isLight
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : DIFF_COLOR[d] + " border-current"
                      : isLight
                        ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        : "glass text-gray-400 hover:text-white border-white/10";
                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setConfig((c) => ({ ...c, difficulty: d }))
                        }
                        className={`${base} ${cls}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={start}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Generating
                    Quiz...
                  </>
                ) : (
                  <>
                    <Play size={18} /> Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "quiz" && current && (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
          {/* Top question numbers row */}
          <div className="card p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-cyan-400" />
                <span className="text-xs font-bold font-mono text-cyan-400 tracking-wider">QUESTIONS</span>
                <span className="text-[10px] text-gray-500 font-mono ml-2">{stats.answered}/{stats.total} answered</span>
              </div>
              <button onClick={finish} disabled={submitting} className="btn-primary text-sm py-2 px-3">
                {submitting ? "Finishing..." : "Finish Quiz"}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {questions.map((q, i) => {
                const done = !!answers[q.id];
                const isActive = i === active;
                const isCorrect = done && answers[q.id] === q.answer;

                let cls;
                if (!reviewMode) {
                  // During quiz: just active vs answered, no correctness colors
                  if (isLight) {
                    cls = isActive
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : done
                        ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                        : "border-slate-300 bg-white text-slate-600";
                  } else {
                    cls = isActive
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : done
                        ? "border-cyan-400/25 bg-cyan-400/5 text-cyan-200"
                        : "border-white/10 bg-white/[0.02] text-gray-400";
                  }
                } else {
                  // In review mode: show green/red for correctness
                  if (isLight) {
                    cls = isActive
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : done
                        ? isCorrect
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-300 bg-white text-slate-500";
                  } else {
                    cls = isActive
                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-300"
                      : done
                        ? isCorrect
                          ? "border-green-400/25 bg-green-400/10 text-green-300"
                          : "border-red-400/25 bg-red-400/10 text-red-300"
                        : "border-white/10 bg-white/[0.02] text-gray-400";
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setActive(i)}
                    className={`h-9 w-12 flex-shrink-0 rounded-xl border font-mono text-xs font-bold transition-all ${
                      isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.04]"
                    } ${cls}`}
                    title={done ? "Answered" : "Not answered"}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question + options */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="text-xs text-gray-500 font-mono tracking-wider uppercase">
                  {quiz.topic} • {quiz.difficulty} • Question {active + 1}/{stats.total}
                </div>
                <div className="text-base sm:text-xl font-black mt-1 leading-snug">
                  {current.question}
                </div>
              </div>
              <span className={`badge border flex-shrink-0 ${DIFF_COLOR[quiz.difficulty]}`}>
                {quiz.difficulty}
              </span>
            </div>

            <div className="space-y-3">
              {(["A", "B", "C", "D"]).map((k) => {
                const selected = answers[current.id] === k;
                const isAnswer = k === current.answer;
                const isWrongPicked = reviewMode && selected && !isAnswer;
                const isCorrectPicked = reviewMode && selected && isAnswer;
                const showCorrect = reviewMode && isAnswer;

                const base =
                  "w-full text-left rounded-2xl border px-4 py-4 transition-all";
                const normal = selected
                  ? isLight
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-cyan-400/30 bg-cyan-400/10"
                  : isLight
                    ? "border-slate-300 bg-white hover:bg-slate-50"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]";
                const correctCls = isLight
                  ? "border-green-500 bg-green-50"
                  : "border-green-400/30 bg-green-400/10";
                const wrongCls = isLight
                  ? "border-red-500 bg-red-50"
                  : "border-red-400/30 bg-red-400/10";

                const stateCls = reviewMode
                  ? isWrongPicked
                    ? wrongCls
                    : showCorrect
                      ? correctCls
                      : "border-white/[0.08] bg-white/[0.02]"
                  : normal;

                return (
                  <button
                    key={k}
                    onClick={() => pick(current.id, k)}
                    disabled={reviewMode}
                    className={`${base} ${stateCls} ${reviewMode ? "cursor-default" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black font-mono flex-shrink-0 ${
                          reviewMode
                            ? isWrongPicked
                              ? isLight
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-red-400/30 bg-red-400/15 text-red-300"
                              : showCorrect
                                ? isLight
                                  ? "border-green-500 bg-green-50 text-green-700"
                                  : "border-green-400/30 bg-green-400/15 text-green-300"
                                : isLight
                                  ? "border-slate-300 bg-slate-50 text-slate-600"
                                  : "border-white/10 bg-white/[0.03] text-gray-500"
                            : selected
                              ? isLight
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                : "border-cyan-400/30 bg-cyan-400/15 text-cyan-300"
                              : isLight
                                ? "border-slate-300 bg-slate-50 text-slate-600"
                                : "border-white/10 bg-white/[0.03] text-gray-500"
                        }`}
                      >
                        {k}
                      </div>
                      <div
                        className={`flex-1 text-sm sm:text-base leading-relaxed ${
                          isLight ? "text-slate-800" : "text-gray-200"
                        }`}
                      >
                        {current.options?.[k]}
                      </div>
                      {reviewMode && (
                        <div className="flex-shrink-0 text-xs font-mono">
                          {isCorrectPicked && (
                            <span className={isLight ? "text-green-700" : "text-green-300"}>
                              Your answer ✓
                            </span>
                          )}
                          {isWrongPicked && (
                            <span className={isLight ? "text-red-700" : "text-red-300"}>
                              Your answer ✕
                            </span>
                          )}
                          {showCorrect && !selected && (
                            <span className={isLight ? "text-green-700" : "text-green-300"}>
                              Correct
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setActive((i) => Math.max(0, i - 1))}
                className="btn-secondary flex-1 py-3"
                disabled={active === 0}
              >
                Previous
              </button>
              <button
                onClick={() => setActive((i) => Math.min(stats.total - 1, i + 1))}
                className="btn-secondary flex-1 py-3"
                disabled={active === stats.total - 1}
              >
                Next
              </button>
            </div>

            {current.concept_tags?.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 font-mono">
                <Lightbulb size={14} className="text-amber-400" />
                {current.concept_tags.slice(0, 4).join(" • ")}
              </div>
            )}

            {reviewMode && current.explanation && (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div
                  className={`text-xs font-bold font-mono tracking-wider mb-2 ${
                    isLight ? "text-slate-600" : "text-gray-400"
                  }`}
                >
                  EXPLANATION
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    isLight ? "text-slate-800" : "text-gray-300"
                  }`}
                >
                  {current.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fade-up">
          <div className="card p-6 sm:p-8 border text-center bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
            <div
              className={`text-xs font-mono tracking-wider uppercase ${
                isLight ? "text-slate-600" : "text-gray-500"
              }`}
            >
              Result Dashboard
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black">
              {result.correct} / {result.total}
            </div>
            <div
              className={`mt-2 text-sm font-mono ${
                isLight ? "text-slate-600" : "text-gray-400"
              }`}
            >
              Accuracy:{" "}
              <span className="text-cyan-500 font-black">
                {result.accuracy}%
              </span>{" "}
              • Incorrect: {result.incorrect}
            </div>
          </div>

          {result.feedback && (
            <div className="card p-4 sm:p-5">
              <div className="section-header">
                <BarChart2 size={14} className="text-cyan-400" />
                <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">
                  PERFORMANCE FEEDBACK
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <p
                  className={`text-sm leading-relaxed ${
                    isLight ? "text-slate-700" : "text-gray-300"
                  }`}
                >
                  {result.feedback}
                </p>
              </div>
            </div>
          )}

          {result.weak_concepts?.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="text-sm font-bold text-amber-400 font-mono mb-3">
                🧩 WEAK CONCEPTS TO REVIEW
              </div>
              <div className="flex flex-wrap gap-2">
                {result.weak_concepts.map((c, i) => (
                  <span
                    key={i}
                    className={`badge text-xs border ${
                      isLight
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-amber-400/10 border-amber-400/20 text-amber-300"
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.recommended_problems?.length > 0 && (
            <div className="card">
              <div className="section-header">
                <ChevronRight size={14} className="text-blue-400" />
                <span className="font-bold text-sm font-mono text-blue-400 tracking-wider">
                  SUGGESTED PRACTICE PROBLEMS
                </span>
              </div>
              <div className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
                {result.recommended_problems.map((p, i) => {
                  const href = p.link || leetcodeSearchUrl(p.title);
                  const diff = p.difficulty || "Medium";
                  const diffCls = (() => {
                    if (diff === "Easy") {
                      return isLight
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-emerald-400/10 border-emerald-400/20 text-emerald-300";
                    }
                    if (diff === "Hard") {
                      return isLight
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-red-400/10 border-red-400/20 text-red-300";
                    }
                    return isLight
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-amber-400/10 border-amber-400/20 text-amber-300";
                  })();
                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-xl border transition-all p-4 block ${
                        isLight
                          ? "bg-white border-slate-200 hover:bg-slate-50"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                      title="Open on LeetCode"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className={`font-semibold truncate flex items-center gap-1 ${
                              isLight ? "text-slate-900" : "text-gray-200"
                            }`}
                          >
                            <span className="truncate">{p.title}</span>
                            <ExternalLink
                              size={13}
                              className={
                                isLight
                                  ? "text-slate-400 flex-shrink-0"
                                  : "text-gray-500 flex-shrink-0"
                              }
                            />
                          </div>
                          {p.description && (
                            <div
                              className={`text-xs font-mono mt-1 line-clamp-2 ${
                                isLight ? "text-slate-600" : "text-gray-500"
                              }`}
                            >
                              {p.description}
                            </div>
                          )}
                        </div>
                        <span
                          className={`badge border flex-shrink-0 text-[10px] ${diffCls}`}
                        >
                          {diff}
                        </span>
                      </div>
                      {p.topic && (
                        <div className="mt-3">
                          <span
                            className={`badge text-xs border ${
                              isLight
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-blue-400/10 border-blue-400/20 text-blue-300"
                            }`}
                          >
                            {p.topic}
                          </span>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={reset} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Play size={15} /> Take Another Quiz
            </button>
            <button
              onClick={() => { setReviewMode(true); setPhase("quiz"); }}
              className="btn-secondary flex items-center gap-2 justify-center"
            >
              <RefreshCw size={15} /> Review Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}