import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2, TrendingUp, Target, Zap, ArrowRight,
  Trophy, Play, Map, BarChart2, BookOpen, CheckCircle, XCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios";
import toast from "react-hot-toast";

const QUICK_ACTIONS = [
  { to: "/analyzer",       icon: Code2,    label: "Analyze Code",    color: "text-cyan-400",   bg: "bg-cyan-400/10",   desc: "AI complexity analysis" },
  { to: "/mock-interview", icon: Play,     label: "Mock Interview",  color: "text-green-400",  bg: "bg-green-400/10",  desc: "FAANG-style problems"   },
  { to: "/learning-path",  icon: Map,      label: "Learning Path",   color: "text-amber-400",  bg: "bg-amber-400/10",  desc: "Personalized roadmap"   },
  { to: "/topic-strength", icon: BarChart2,label: "Topic Strength",  color: "text-purple-400", bg: "bg-purple-400/10", desc: "See your weaknesses"    },
  { to: "/explainer",      icon: BookOpen, label: "Code Explainer",  color: "text-blue-400",   bg: "bg-blue-400/10",   desc: "Step-by-step breakdown" },
  { to: "/history",        icon: Trophy,   label: "View History",    color: "text-rose-400",   bg: "bg-rose-400/10",   desc: "All past analyses"      },
];

const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-white/10 rounded-xl p-3 text-xs font-mono shadow-xl">
      <div className="text-white font-bold mb-1">{payload[0].payload.name}</div>
      <div className="text-cyan-400">{payload[0].value} solved</div>
    </div>
  );
};

export default function Dashboard() {
  const { user, analysisStats, refreshAnalysisStats } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [potd, setPotd] = useState(null);
  const [potdBusy, setPotdBusy] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Initial load + subscribe to shared analysisStats in AuthContext
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!analysisStats) {
          const fresh = await refreshAnalysisStats();
          if (!cancelled) setStats(fresh);
        } else {
          setStats(analysisStats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [analysisStats, refreshAnalysisStats]);

  useEffect(() => {
    api.get("/dsa/potd")
      .then(res => setPotd(res.data.data))
      .catch(() => {});
  }, []);

  const updatePotdStatus = async (patch) => {
    if (!potd?._id) return;
    try {
      setPotdBusy(true);
      const res = await api.put(`/dsa/problems/${potd._id}/status`, patch);
      setPotd((p) => p ? ({ ...p, status: { solved: !!res.data.data.solved, revision: !!res.data.data.revision } }) : p);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setPotdBusy(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "there";
  // Per-tool limits on the free plan
  const TOOL_LIMIT = 10;
  const analyzeUsed = user?.dailyAnalyzeUsage || 0;
  const explainUsed = user?.dailyExplainUsage || 0;
  const debugUsed = user?.dailyDebugUsage || 0;
  const analyzeLeft = Math.max(0, TOOL_LIMIT - analyzeUsed);
  const explainLeft = Math.max(0, TOOL_LIMIT - explainUsed);
  const debugLeft = Math.max(0, TOOL_LIMIT - debugUsed);
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const STAT_CARDS = [
    // Prefer live user.totalAnalyses so it updates immediately after running Analyze
    { label: "Total Analyses", value: user?.totalAnalyses ?? stats?.total ?? 0, icon: Code2, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
    { label: "Optimal Solutions", value: stats?.optimal ?? 0, icon: Target, color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
    { label: "Accuracy Rate", value: `${stats?.accuracy ?? 0}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    // Prefer live user.problemsSolved so it updates immediately when practice status changes
    { label: "DSA Problems Solved", value: user?.problemsSolved ?? stats?.dsaSolved ?? 0, icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 sm:mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {greeting}, <span className="text-cyan-400">{firstName}</span> 👋
          </h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            {stats?.total
              ? `You've analyzed ${stats.total} problems • ${stats.accuracy}% optimal rate`
              : "Start by analyzing your first problem below"}
          </p>
        </div>
        <Link to="/analyzer" className="btn-primary flex items-center gap-2 text-sm">
          <Code2 size={15} /> New Analysis
        </Link>
      </div>

      {/* ── Free-plan per-tool usage ── */}
      {user?.plan === "free" && (
        <div className="card p-4 sm:p-5 mb-6 bg-gradient-to-r from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="font-semibold text-sm">Daily AI Usage (Free)</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                10 runs per tool: Analyze, Explain, Debug
              </div>
            </div>
            <span className="badge bg-amber-400/10 border border-amber-400/20 text-amber-400">
              Free Plan
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 mb-3">
            <div className="glass rounded-lg px-3 py-2 border border-white/10">
              <div className="text-[10px] font-mono text-gray-500 mb-0.5">Analyze</div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-mono text-cyan-300 font-bold">{analyzeLeft}/10 left</span>
              </div>
            </div>
            <div className="glass rounded-lg px-3 py-2 border border-white/10">
              <div className="text-[10px] font-mono text-gray-500 mb-0.5">Explain</div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-mono text-blue-300 font-bold">{explainLeft}/10 left</span>
              </div>
            </div>
            <div className="glass rounded-lg px-3 py-2 border border-white/10">
              <div className="text-[10px] font-mono text-gray-500 mb-0.5">Debug</div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-mono text-amber-300 font-bold">{debugLeft}/10 left</span>
              </div>
            </div>
          </div>
          <Link to="/pricing" className="inline-flex items-center text-xs text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            Upgrade to Pro →
          </Link>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`card p-4 sm:p-5 border ${s.border} hover:shadow-lg transition-all duration-200`}>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={15} className={s.color} />
            </div>
            {loading ? (
              <div className="h-7 w-14 bg-white/[0.05] rounded-lg animate-pulse mb-1" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-0.5`}>{s.value}</div>
            )}
            <div className="text-[10px] sm:text-xs text-gray-500 font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── MCQ performance ── */}
      {!loading && stats?.mcqAttempts > 0 && (
        <div className="card p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-cyan-400" />
              <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">MCQ PERFORMANCE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2 rounded-xl text-sm text-gray-300">
                <span className="text-cyan-400 font-bold">{stats.mcqAccuracy}%</span>
                <span className="text-gray-500"> avg accuracy</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl text-sm text-gray-300">
                <span className="text-cyan-400 font-bold">{stats.mcqAttempts}</span>
                <span className="text-gray-500"> quizzes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts row ── */}
      {!loading && stats && stats.total > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
          {stats.patterns?.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <BarChart2 size={14} className="text-cyan-400" />
                <span className="font-bold text-sm text-cyan-400 font-mono tracking-wider">PATTERNS ANALYZED</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.patterns.map(p => ({ name: p._id || "Unknown", count: p.count }))}
                  margin={{ top: 0, right: 0, bottom: 30, left: -10 }}
                >
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "JetBrains Mono" }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(34,211,238,0.04)" }} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <Target size={14} className="text-green-400" />
              <span className="font-bold text-sm text-green-400 font-mono tracking-wider">SOLUTION QUALITY</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Optimal",    value: stats.optimal   },
                    { name: "Suboptimal", value: stats.suboptimal },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#4ade80" />
                  <Cell fill="#fbbf24" />
                </Pie>
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#9ca3af" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
          <div className="card mb-6">
        <div className="section-header">
          <Zap size={14} className="text-cyan-400" />
          <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">QUICK ACTIONS</span>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map(a => (
            <Link
              key={a.to}
              to={a.to}
              className="glass-hover rounded-xl p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2 group"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${a.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <a.icon size={16} className={a.color} />
              </div>
              <div className="font-bold text-[10px] sm:text-xs leading-tight">{a.label}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-500 font-mono leading-tight hidden sm:block">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Problem of the Day ── */}
      {potd && (
        <div className="card mb-6">
          <div className="section-header">
            <Target size={14} className="text-cyan-400" />
            <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">PROBLEM OF THE DAY</span>
            <span className="ml-auto text-[11px] text-gray-600 font-mono">{potd.date}</span>
          </div>
          <div className="p-4 sm:p-5 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`font-bold truncate ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {potd.title}
                </div>
                <span className={`badge border ${potd.difficulty === "Easy" ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                  : potd.difficulty === "Medium" ? "bg-amber-400/10 border-amber-400/20 text-amber-400"
                  : "bg-red-400/10 border-red-400/20 text-red-400"}`}>
                  {potd.difficulty}
                </span>
                <span className="badge bg-white/5 border border-white/10 text-gray-500">
                  {potd.topic}
                </span>
              </div>
              {potd.tags?.length > 0 && (
                <div className="text-xs text-gray-500 font-mono mt-1.5 truncate">
                  {potd.tags.slice(0, 6).join(" • ")}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs font-mono text-gray-400">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={potdBusy}
                    checked={!!potd.status?.solved}
                    onChange={() => updatePotdStatus({ solved: !potd.status?.solved })}
                    className="h-4 w-4 accent-cyan-400"
                  />
                  Solved
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={potdBusy}
                    checked={!!potd.status?.revision}
                    onChange={() => updatePotdStatus({ revision: !potd.status?.revision })}
                    className="h-4 w-4 accent-amber-400"
                  />
                  Revision
                </label>
              </div>
            </div>
            <a
              href={potd.link}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-sm py-2 px-4"
            >
              Open Problem
            </a>
          </div>
        </div>
      )}

      {/* ── Recent activity ── */}
      {!loading && stats?.recentActivity?.length > 0 && (
        <div className="card">
          <div className="section-header">
            <Trophy size={14} className="text-amber-400" />
            <span className="font-bold text-sm font-mono text-amber-400 tracking-wider">RECENT ACTIVITY</span>
            <Link to="/history" className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.result?.is_optimal ? "bg-green-400" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{a.problemTitle}</div>
                  <div className="text-xs text-gray-500 font-mono">{a.result?.algorithm_pattern || "—"}</div>
                </div>
                <div className={`badge text-[10px] border hidden sm:inline-flex ${
                  a.result?.is_optimal
                    ? "bg-green-400/10 border-green-400/20 text-green-400"
                    : "bg-amber-400/10 border-amber-400/20 text-amber-400"
                }`}>
                  {a.result?.is_optimal
                    ? <><CheckCircle size={9} className="mr-1" />Optimal</>
                    : <><XCircle size={9} className="mr-1" />Suboptimal</>
                  }
                </div>
                <div className="text-[11px] text-gray-600 font-mono flex-shrink-0">
                  {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && (!stats || stats.total === 0) && (
        <div className="card p-10 sm:p-16 text-center">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">🚀</div>
          <h3 className="text-xl sm:text-2xl font-black mb-3">Start Your First Analysis</h3>
          <p className="text-gray-500 font-mono text-sm mb-6 sm:mb-8 max-w-sm mx-auto leading-relaxed">
            Paste any LeetCode solution to get instant AI feedback on patterns, complexity, hints, and optimizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/analyzer" className="btn-primary inline-flex items-center justify-center gap-2">
              <Code2 size={15} /> Analyze Code Now
            </Link>
            <Link to="/mock-interview" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Play size={15} /> Try Mock Interview
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}