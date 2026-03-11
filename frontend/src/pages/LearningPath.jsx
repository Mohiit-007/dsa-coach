import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Map, Zap, ChevronDown, ChevronUp, CheckCircle, Calendar, Target, BookOpen, ArrowRight, RefreshCw, Download, LayoutGrid } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const WEAK_TOPIC_OPTIONS = [
  "Dynamic Programming", "Graphs", "Trees", "Backtracking",
  "Sliding Window", "Binary Search", "Heaps", "Tries",
  "Greedy", "Bit Manipulation", "Two Pointers", "Recursion",
];

const DIFF_COLORS = { Easy: "text-green-400 bg-green-400/8 border-green-400/20", Medium: "text-amber-400 bg-amber-400/8 border-amber-400/20", Hard: "text-red-400 bg-red-400/8 border-red-400/20" };

export default function LearningPath() {
  const [config, setConfig] = useState({ weakTopics: [], goal: "", daysAvailable: 14 });
  const [path, setPath] = useState(null);
  const [activePathId, setActivePathId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [completed, setCompleted] = useState({});
  const [calendarView, setCalendarView] = useState(false);
  const exportRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const shapeFromApi = (apiDoc) => {
    if (!apiDoc) return { view: null, completedMap: {} };
    const meta = apiDoc.aiMeta || {};
    const aiDays = Array.isArray(meta.daily_plans) ? meta.daily_plans : [];
    const dbDays = Array.isArray(apiDoc.days) ? apiDoc.days : [];
    const baseDays = aiDays.length ? aiDays : dbDays;

    const mergedDays = baseDays.map((d, idx) => {
      const db = dbDays[idx] || {};
      const dayNumber = db.day ?? d.day ?? idx + 1;
      const completedFlag = typeof db.completed === "boolean" ? db.completed : false;
      return {
        day: dayNumber,
        topic: d.topic || db.topic || "Mixed DSA",
        focus: d.focus || "",
        key_concept: d.key_concept || db.concept || "",
        problems: Array.isArray(db.problems) && db.problems.length ? db.problems : d.problems || [],
        difficulty: db.difficulty || d.difficulty || "Easy",
        estimated_hours: d.estimated_hours || 2,
        completed: completedFlag,
      };
    });

    const completedMap = {};
    mergedDays.forEach((d) => {
      if (d.completed) completedMap[d.day] = true;
    });

    const totalDays = mergedDays.length || apiDoc.duration || meta.duration_days || 0;
    const doneDays = Object.values(completedMap).filter(Boolean).length;
    const progress = typeof apiDoc.progress === "number"
      ? apiDoc.progress
      : totalDays > 0
        ? Math.round((doneDays / totalDays) * 100)
        : 0;

    const view = {
      id: apiDoc._id,
      title: meta.title || apiDoc.title || "Personalized Learning Path",
      overview: meta.overview || "",
      duration_days: apiDoc.duration || meta.duration_days || mergedDays.length,
      daily_plans: mergedDays,
      milestones: meta.milestones || [],
      tips: meta.tips || [],
      createdAt: apiDoc.createdAt,
      progress,
    };

    return { view, completedMap };
  };

  const toggleTopic = (t) => setConfig(c => ({
    ...c,
    weakTopics: c.weakTopics.includes(t) ? c.weakTopics.filter(x => x !== t) : [...c.weakTopics, t],
  }));

  const generate = async () => {
    if (config.weakTopics.length === 0) { toast.error("Select at least one weak topic"); return; }
    setLoading(true);
    setPath(null);
    try {
      const res = await api.post("/learn/learning-path", config);
      const apiDoc = res.data.data;
      const shaped = shapeFromApi(apiDoc);
      setPath(shaped.view);
      setCompleted(shaped.completedMap);
      setActivePathId(apiDoc._id);
      setExpanded(shaped.view.daily_plans?.[0]?.day || 1);
      toast.success("Learning path generated! 🗺️");
    } catch {
      toast.error("Failed to generate path");
    } finally {
      setLoading(false);
    }
  };

  const fetchExisting = async (id, opts = { autoExport: false }) => {
    setLoading(true);
    try {
      const res = await api.get(`/learn/learning-path/${id}`);
      const shaped = shapeFromApi(res.data.data);
      setPath(shaped.view);
      setCompleted(shaped.completedMap);
      setActivePathId(id);
      setExpanded(shaped.view.daily_plans?.[0]?.day || 1);
      if (opts.autoExport) {
        setTimeout(() => handleDownload(), 400);
      }
    } catch {
      toast.error("Failed to load learning path");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("id");
    const shouldExport = searchParams.get("export") === "1";
    if (id) {
      fetchExisting(id, { autoExport: shouldExport });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleComplete = async (day) => {
    const prev = !!completed[day];
    setCompleted((c) => ({ ...c, [day]: !prev }));

    if (!activePathId) {
      return;
    }

    try {
      const res = await api.patch(`/learn/learning-path/${activePathId}/day/${day}`, {
        completed: !prev,
      });
      const shaped = shapeFromApi(res.data.data);
      setPath(shaped.view);
      setCompleted(shaped.completedMap);
    } catch {
      toast.error("Failed to update progress");
      setCompleted((c) => ({ ...c, [day]: prev }));
    }
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = path?.progress ?? (path ? Math.round((completedCount / (path.daily_plans?.length || 1)) * 100) : 0);

  const handleDownload = async () => {
    if (!activePathId) {
      toast.error("Save or load a learning path first");
      return;
    }
    try {
      const res = await api.get(`/learn/learning-path/${activePathId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dsa-learning-path-${activePathId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const startDate = path?.createdAt ? new Date(path.createdAt) : new Date();
  const dateForDay = (day) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (day - 1));
    return d;
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-start justify-between mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            Learning <span className="text-cyan-400">Path</span>
          </h1>
          <p
            className={`font-mono text-xs sm:text-sm ${
              isLight ? "text-slate-600" : "text-gray-500"
            }`}
          >
            AI generates a personalized day-by-day study plan
          </p>
        </div>
        {path && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarView((v) => !v)}
              className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <LayoutGrid size={14} />
              {calendarView ? "List View" : "Calendar View"}
            </button>
            <button
              onClick={() => handleDownload()}
              className="hidden sm:flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-xl border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Download size={14} /> Download Plan
            </button>
            <button onClick={() => { setPath(null); setActivePathId(null); setCompleted({}); }} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} /> <span className="hidden sm:inline">New Plan</span>
            </button>
          </div>
        )}
      </div>

      {/* Config form */}
      {!path && (
        <div className="card p-5 sm:p-7 max-w-2xl mx-auto">
            <div className="text-center mb-6 sm:mb-7">
            <div className="text-4xl sm:text-5xl mb-3">🗺️</div>
            <h2 className="text-xl sm:text-2xl font-black mb-1">Build Your Plan</h2>
            <p className="text-gray-500 font-mono text-xs sm:text-sm">Tell us where you struggle and we'll build a roadmap</p>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {/* Weak topics */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-3">
                Weak Topics{" "}
                <span className="text-cyan-400">
                  ({config.weakTopics.length} selected)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WEAK_TOPIC_OPTIONS.map((t) => {
                  const active = config.weakTopics.includes(t);
                  const base =
                    "py-2 px-2 sm:px-3 rounded-xl border text-xs font-semibold transition-all text-center";
                  let cls;
                  if (active) {
                    cls = isLight
                      ? "bg-cyan-50 border-cyan-200 text-cyan-700"
                      : "bg-cyan-400/15 border-cyan-400/30 text-cyan-400";
                  } else {
                    cls = isLight
                      ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      : "glass text-gray-400 hover:text-white border-white/10";
                  }
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      className={`${base} ${cls}`}
                    >
                      {active && <span className="mr-1">✓</span>}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Your Goal</label>
              <input value={config.goal} onChange={e => setConfig(c => ({ ...c, goal: e.target.value }))}
                placeholder="e.g. Crack FAANG interviews in 3 months"
                className="input-field" />
            </div>

            {/* Days */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-3">
                Duration: <span className="text-cyan-400">{config.daysAvailable} days</span>
              </label>
              {(() => {
                const pct = ((config.daysAvailable - 7) / (30 - 7)) * 100;
                return (
                  <input
                    type="range"
                    min={7}
                    max={30}
                    value={config.daysAvailable}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        daysAvailable: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full range-days"
                    style={{
                      background: `linear-gradient(90deg, #22d3ee ${pct}%, #e5e7eb ${pct}%)`,
                    }}
                  />
                );
              })()}
              <div
                className={`flex justify-between text-xs font-mono mt-1 ${
                  isLight ? "text-slate-500" : "text-gray-600"
                }`}
              >
                <span>7 days</span>
                <span>30 days</span>
              </div>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Generating Plan...</>
              ) : (
                <><Map size={16} /> Generate My Learning Path</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading existing */}
      {loading && !path && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Generated / loaded path */}
      {path && (
        <div className="space-y-4 sm:space-y-5 animate-fade-up" ref={exportRef}>
          {/* Header card */}
          <div className="card p-4 sm:p-6 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl sm:text-2xl font-black mb-1">{path.title}</h2>
                <p
                  className={`font-mono text-xs sm:text-sm max-w-lg ${
                    isLight ? "text-slate-600" : "text-gray-400"
                  }`}
                >
                  {path.overview}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-cyan-400">{path.duration_days}</div>
                  <div className="text-xs text-gray-500 font-mono">days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green-400">{completedCount}</div>
                  <div className="text-xs text-gray-500 font-mono">done</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 sm:mt-5">
              <div
                className={`flex justify-between text-xs font-mono mb-2 ${
                  isLight ? "text-slate-600" : "text-gray-500"
                }`}
              >
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div
                className={`w-full rounded-full h-2 ${
                  isLight ? "bg-slate-200" : "bg-white/[0.06]"
                }`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isLight
                      ? "bg-cyan-400"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          {path.milestones?.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={14} className="text-amber-400" />
                <span className="font-bold text-sm font-mono text-amber-400 tracking-wider">
                  MILESTONES
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {path.milestones.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl px-3 sm:px-4 py-3 flex-1 min-w-[160px] sm:min-w-[200px] ${
                      isLight
                        ? "bg-amber-50 border border-amber-100"
                        : "bg-amber-400/5 border border-amber-400/15"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black font-mono text-xs sm:text-sm flex-shrink-0 ${
                        isLight
                          ? "bg-amber-100 text-amber-600"
                          : "bg-amber-400/15 text-amber-400"
                      }`}
                    >
                      D{m.day}
                    </div>
                    <p
                      className={`text-xs sm:text-sm ${
                        isLight ? "text-slate-700" : "text-gray-300"
                      }`}
                    >
                      {m.goal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily plans */}
            <div className="card">
            <div className="section-header">
              <Calendar size={14} className="text-cyan-400" />
              <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">DAILY PLAN</span>
              <span className="ml-auto text-xs text-gray-500 font-mono">{path.daily_plans?.length} days</span>
            </div>
            {!calendarView && (
              <div
                className={`divide-y ${
                  isLight ? "divide-slate-200" : "divide-white/[0.04]"
                }`}
              >
              {path.daily_plans?.map((day, i) => {
                const isExpanded = expanded === day.day;
                const isDone = completed[day.day] ?? day.completed;
                return (
                  <div key={i} className="transition-all">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : day.day)}
                      className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-colors text-left ${
                        isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black font-mono text-xs sm:text-sm flex-shrink-0 ${
                          isDone ? "bg-green-400/15 text-green-400" : "bg-cyan-400/10 text-cyan-400"
                        }`}
                      >
                        {isDone ? <CheckCircle size={16} /> : `D${day.day}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{day.topic}</span>
                          <span className={`badge text-[10px] border ${DIFF_COLORS[day.difficulty]}`}>{day.difficulty}</span>
                          <span className="text-xs text-gray-500 font-mono">~{day.estimated_hours}h</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">{day.focus}</div>
                      </div>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-up">
                        <div className="ml-12 sm:ml-14 space-y-3 sm:space-y-4">
                          <div
                            className={`rounded-xl p-3 sm:p-4 border ${
                              isLight
                                ? "bg-cyan-50 border-cyan-100"
                                : "bg-cyan-400/5 border-cyan-400/15"
                            }`}
                          >
                            <div className="text-xs font-bold text-cyan-400 font-mono mb-1">
                              🎯 KEY CONCEPT
                            </div>
                            <p
                              className={`text-sm ${
                                isLight ? "text-slate-700" : "text-gray-300"
                              }`}
                            >
                              {day.key_concept}
                            </p>
                          </div>

                          {day.problems?.length > 0 && (
                            <div>
                              <div
                                className={`text-xs font-bold font-mono mb-2 ${
                                  isLight ? "text-slate-600" : "text-gray-400"
                                }`}
                              >
                                📝 PROBLEMS TO SOLVE
                              </div>
                              <div className="space-y-1.5">
                                {day.problems.map((p, pi) => (
                                  <div
                                    key={pi}
                                    className={`flex items-center gap-2 text-sm ${
                                      isLight ? "text-slate-700" : "text-gray-300"
                                    }`}
                                  >
                                    <ArrowRight size={12} className="text-cyan-400 flex-shrink-0" />
                                    {p}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => toggleComplete(day.day)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                              isDone
                                ? isLight
                                  ? "bg-green-50 border border-green-300 text-green-700"
                                  : "bg-green-500/10 border border-green-400/40 text-green-300"
                                : isLight
                                  ? "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                  : "glass border-white/10 text-gray-400 hover:text-white"
                            }`}
                          >
                            <CheckCircle size={14} />{" "}
                            {isDone ? "Completed ✓" : "Mark as Done"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}

            {calendarView && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {path.daily_plans?.map((day) => {
                  const date = dateForDay(day.day);
                  const label = date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const isDone = completed[day.day] ?? day.completed;
                  return (
                    <div
                      key={day.day}
                      className={`rounded-xl p-3 border text-xs space-y-1 ${
                        isDone
                          ? isLight
                            ? "bg-green-50 border-green-200"
                            : "bg-green-500/10 border-green-500/40"
                          : isLight
                            ? "bg-white border-slate-200"
                            : "bg-dark-800 border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-semibold text-[11px]">{label}</span>
                        <span className="text-[10px] text-gray-500 font-mono">D{day.day}</span>
                      </div>
                      <div className="font-semibold truncate">{day.topic}</div>
                      <div className="text-[11px] text-gray-500 font-mono truncate">
                        {day.difficulty} · ~{day.estimated_hours}h
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tips */}
          {path.tips?.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={14} className="text-purple-400" />
                <span className="font-bold text-sm font-mono text-purple-400 tracking-wider">
                  PRO TIPS
                </span>
              </div>
              <div className="space-y-2">
                {path.tips.map((tip, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 text-sm rounded-xl p-3 border ${
                      isLight
                        ? "bg-purple-50 border-purple-100 text-slate-700"
                        : "bg-purple-400/5 border-purple-400/10 text-gray-300"
                    }`}
                  >
                    <span className="text-purple-500 font-bold font-mono flex-shrink-0">
                      {i + 1}.
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}