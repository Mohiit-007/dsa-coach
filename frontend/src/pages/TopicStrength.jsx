import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext.jsx";

const STRENGTH_META = {
  strong:   { label: "Strong",   color: "#4ade80", bg: "bg-green-400/10",  border: "border-green-400/20",  icon: TrendingUp,   bar: "#4ade80" },
  moderate: { label: "Moderate", color: "#fbbf24", bg: "bg-amber-400/10",  border: "border-amber-400/20",  icon: Minus,        bar: "#fbbf24" },
  weak:     { label: "Weak",     color: "#f87171", bg: "bg-red-400/10",    border: "border-red-400/20",    icon: TrendingDown, bar: "#f87171" },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-white/10 rounded-xl p-3 shadow-xl">
      <div className="font-bold text-sm text-white mb-1">{d.name}</div>
      <div className="text-xs font-mono space-y-0.5">
        <div className="text-gray-400">Total: <span className="text-white">{d.total}</span></div>
        <div className="text-gray-400">Accuracy: <span style={{ color: d.color }}>{d.accuracy}%</span></div>
      </div>
    </div>
  );
};

export default function TopicStrength() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("bar");
  const { theme } = useTheme();
  const isLight = theme === "light";

  const load = () => {
    setLoading(true);
    api.get("/learn/topic-strength")
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-white/[0.05] rounded-xl mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 card animate-pulse" />)}
        </div>
        <div className="h-80 card animate-pulse" />
      </div>
    );
  }

  if (!data || data.topics?.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-up">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-7">Topic <span className="text-cyan-400">Strength</span></h1>
        <div className="card p-12 sm:p-16 text-center">
          <div className="text-4xl sm:text-5xl mb-4">📊</div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">No data yet</h3>
          <p className="text-gray-500 font-mono text-sm mb-6">Analyze at least 5 problems to see your topic strengths and weaknesses.</p>
          <Link to="/analyzer" className="btn-primary inline-flex items-center gap-2">
            Start Analyzing <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const { topics, strong, weak } = data;

  const chartData = topics.map(t => ({
    name: t.name,
    accuracy: t.accuracy,
    total: t.total,
    color: t.accuracy >= 80 ? "#4ade80" : t.accuracy >= 50 ? "#fbbf24" : "#f87171",
  }));

  const radarData = topics.slice(0, 8).map(t => ({
    topic: t.name.length > 12 ? t.name.slice(0, 12) + "…" : t.name,
    accuracy: t.accuracy,
  }));

  const SUMMARY_CARDS = [
    { label: "Strong Topics", value: strong?.length || 0, color: "text-green-400", bg: "bg-green-400/10",  desc: strong?.slice(0, 2).join(", ") || "—" },
    { label: "Weak Topics",   value: weak?.length || 0,   color: "text-red-400",   bg: "bg-red-400/10",    desc: weak?.slice(0, 2).join(", ") || "—" },
    {
      label: "Patterns Practiced",
      value: topics.length,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      desc: `${data.total} code tool runs`,
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-start justify-between mb-6 sm:mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            Topic <span className="text-cyan-400">Strength</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            Based on your {data.total} Code Tools runs
            <span className="hidden sm:inline"> (Analyze, Explain, Debug)</span>
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {SUMMARY_CARDS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${s.bg} mb-3`}>
              <BarChart2 size={16} className={s.color} />
            </div>
            <div className={`text-2xl sm:text-3xl font-black ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-sm font-bold mb-0.5">{s.label}</div>
            <div className="text-xs text-gray-500 font-mono truncate">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Chart toggle */}
      <div className="card mb-5">
        <div className="section-header">
          <BarChart2 size={14} className="text-cyan-400" />
          <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">ACCURACY BY TOPIC</span>
          <div className="ml-auto flex gap-2">
            {["bar", "radar"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${view === v ? "bg-cyan-400/15 border border-cyan-400/25 text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {view === "bar" ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 60, left: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "JetBrains Mono" }} angle={-35} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} unit="%" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: "#9ca3af", fontSize: 9, fontFamily: "JetBrains Mono" }} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Topic cards grid */}
      <div className="card">
        <div className="section-header">
          <TrendingUp size={14} className="text-cyan-400" />
          <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">ALL TOPICS</span>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map(t => {
            const meta = STRENGTH_META[t.strength];
            const Icon = meta.icon;
            return (
              <div key={t.name} className={`rounded-xl border p-4 ${meta.bg} ${meta.border}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="font-bold text-sm">{t.name}</span>
                  <span className={`badge text-[10px] border ${meta.bg} ${meta.border}`} style={{ color: meta.color }}>
                    <Icon size={10} className="mr-1" />{meta.label}
                  </span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${t.accuracy}%`, background: meta.color }} />
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span style={{ color: meta.color }}>{t.accuracy}% accuracy</span>
                  <span className="text-gray-500">{t.optimal}/{t.total} optimal</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {weak?.length > 0 && (
        <div className="card mt-4 sm:mt-5 p-4 sm:p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-600/5">
          <div className="text-sm font-bold text-amber-400 font-mono mb-3">
            💡 RECOMMENDED NEXT STEPS
          </div>
          <p
            className={`text-sm mb-4 ${
              isLight ? "text-slate-700" : "text-gray-300"
            }`}
          >
            You're struggling most with{" "}
            <strong
              className={isLight ? "text-amber-700" : "text-white"}
            >
              {weak.slice(0, 3).join(", ")}
            </strong>
            . Generate a targeted learning path to improve.
          </p>
          <Link
            to="/learning-path"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Build Learning Path <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}