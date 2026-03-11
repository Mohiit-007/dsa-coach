import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Code2, ChevronDown, ExternalLink } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext";

const TOPIC_ICONS = {
  Arrays: "[]",
  Basics: "io",
  Sorting: "so",
  Strings: "Aa",
  "Binary Search": "bs",
  "Linked List": "→",
  Stack: "⌁",
  Queue: "⇢",
  "Stack & Queue": "sq",
  Trees: "⌥",
  Graphs: "◈",
  "Dynamic Programming": "dp",
  Greedy: "gr",
  Recursion: "rc",
  Backtracking: "bt",
  "Bit Manipulation": "bm",
  Heap: "hp",
  Trie: "tr",
};

function topicSlug(topic) {
  return String(topic || "").toLowerCase().replace(/\s+/g, "-");
}

const TOPIC_ORDER = [
  "Basics",
  "Sorting",
  "Arrays",
  "Binary Search",
  "Strings",
  "Linked List",
  "Stack & Queue",
  "Stack",
  "Queue",
  "Bit Manipulation",
  "Recursion",
  "Backtracking",
  "Heap",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Trie",
];

function topicSortKey(name) {
  const idx = TOPIC_ORDER.indexOf(name);
  return idx === -1 ? TOPIC_ORDER.length + 1 : idx;
}

const DIFF_COLOR = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-red-400",
};

function PlatformBadge({ p }) {
  const lc = p?.link;
  const gfg = p?.gfg_link;
  if (!lc && !gfg) {
    return <span className="text-[10px] text-gray-600 font-mono">N/A</span>;
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      {lc && (
        <a
          href={lc}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border text-[10px] font-black font-mono transition-all lc-badge"
          title="Open on LeetCode (search page)"
          onClick={(e) => e.stopPropagation()}
        >
          LC
        </a>
      )}
      {gfg && (
        <a
          href={gfg}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border text-[10px] font-black font-mono transition-all gfg-badge"
          title="Open on GeeksforGeeks (search page)"
          onClick={(e) => e.stopPropagation()}
        >
          G
        </a>
      )}
    </div>
  );
}

function FancyCheck({ checked, onChange, disabled, light }) {
  return (
    <label
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
        disabled
          ? light
            ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-100"
            : "opacity-60 cursor-not-allowed border-white/10 bg-white/[0.02]"
          : checked
            ? light
              ? "border-cyan-500 bg-cyan-50 hover:bg-cyan-100 cursor-pointer"
              : "border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/15 cursor-pointer"
            : light
              ? "border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer"
      }`}
      title={checked ? "Solved" : "Mark solved"}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      <div
        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
          checked
            ? "border-cyan-400 bg-cyan-400"
            : light
              ? "border-slate-300 bg-white"
              : "border-white/20 bg-transparent"
        }`}
      >
        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
      </div>
    </label>
  );
}

function RevisionCheck({ checked, onChange, disabled, light }) {
  return (
    <label
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
        disabled
          ? light
            ? "opacity-60 cursor-not-allowed border-slate-200 bg-slate-100"
            : "opacity-60 cursor-not-allowed border-white/10 bg-white/[0.02]"
          : checked
            ? light
              ? "border-amber-400 bg-amber-50 hover:bg-amber-100 cursor-pointer"
              : "border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15 cursor-pointer"
            : light
              ? "border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
              : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer"
      }`}
      title={checked ? "Needs revision" : "Mark for revision"}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      <div
        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
          checked
            ? "border-amber-400 bg-amber-400"
            : light
              ? "border-slate-300 bg-white"
              : "border-white/20 bg-transparent"
        }`}
      >
        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
      </div>
    </label>
  );
}

function RingProgress({ solved, total, light }) {
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="-rotate-90" width="64" height="64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="6"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-xs font-mono ${
              light ? "text-slate-700" : "text-gray-400"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={`text-xs font-mono uppercase tracking-wider ${
            light ? "text-slate-600" : "text-gray-500"
          }`}
        >
          Overall Progress
        </span>
        <span
          className={`text-sm font-mono ${
            light ? "text-slate-800" : "text-gray-200"
          }`}
        >
          <span className="font-bold text-cyan-400">{solved}</span>
          <span className={light ? "text-slate-500" : "text-gray-500"}>
            {" "}
            / {total || 0}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function PracticeList() {
  const nav = useNavigate();
  const { theme } = useTheme();
  const { updateUser } = useAuth();
  const isLight = theme === "light";
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [potd, setPotd] = useState(null);
  const [openTopic, setOpenTopic] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/dsa/all");
        setAll(res.data.data || []);
        const p = await api.get("/dsa/potd");
        setPotd(p.data.data);
      } catch {
        toast.error("Failed to load practice sheet");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of all) {
      const t = p.topic || "Other";
      if (!map.has(t)) map.set(t, []);
      map.get(t).push(p);
    }
    const topics = [...map.keys()].sort((a, b) => {
      const da = topicSortKey(a) - topicSortKey(b);
      if (da !== 0) return da;
      return a.localeCompare(b);
    });
    const diffRank = { Easy: 1, Medium: 2, Hard: 3 };
    return topics.map((t) => {
      const items = (map.get(t) || []).slice().sort((a, b) => {
        const da = (diffRank[a.difficulty] || 99) - (diffRank[b.difficulty] || 99);
        if (da !== 0) return da;
        return String(a.title).localeCompare(String(b.title));
      });
      const solved = items.filter((x) => x.status?.solved).length;
      return { topic: t, slug: topicSlug(t), total: items.length, solved, items };
    });
  }, [all]);

  const total = grouped.reduce((a, t) => a + (t.total || 0), 0);
  const solved = grouped.reduce((a, t) => a + (t.solved || 0), 0);

  const toggle = async (id, patch) => {
    try {
      setBusyId(id);
      const res = await api.put(`/dsa/problems/${id}/status`, patch);
      const next = res.data.data;
      setAll((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: { solved: !!next.solved, revision: !!next.revision } } : p))
      );

      // Refresh user stats (problemsSolved, streak) so dashboard/profile update in real time
      try {
        const me = await api.get("/auth/me");
        updateUser(me.data.user);
      } catch {
        // Non-blocking; local UI already updated
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="border-b border-white/5 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="text-cyan-400" size={26} /> DSA Practice
            </h1>
            <p
              className={`text-sm mt-0.5 ${
                isLight ? "text-slate-600" : "text-gray-500"
              }`}
            >
              No compiler — only curated external problems + progress tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`glass px-4 py-3 rounded-2xl text-sm ${
                isLight ? "text-slate-800" : "text-gray-300"
              }`}
            >
              <RingProgress solved={solved} total={total} light={isLight} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {potd && (
          <div className="glass rounded-2xl p-4 mb-5 border border-cyan-400/15 bg-gradient-to-r from-cyan-500/5 to-blue-600/5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div
                  className={`text-xs font-mono ${
                    isLight ? "text-slate-600" : "text-gray-500"
                  }`}
                >
                  Problem of the Day • {potd.date}
                </div>
                <div
                  className={`font-bold mt-1 ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {potd.title}
                </div>
                <div
                  className={`text-xs font-mono mt-1 ${
                    isLight ? "text-slate-600" : "text-gray-500"
                  }`}
                >
                  {potd.topic} • {potd.difficulty}
                </div>
              </div>
              <a href={potd.link} target="_blank" rel="noreferrer" className="btn-primary text-sm py-2 px-4">
                Open POTD
              </a>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map((t) => {
              const pct = t.total ? Math.round((t.solved / t.total) * 100) : 0;
              const open = openTopic === t.topic;
              return (
                <div key={t.slug} className="glass rounded-2xl border border-white/5 overflow-hidden">
                  <button
                    onClick={() => setOpenTopic((cur) => (cur === t.topic ? "" : t.topic))}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-cyan-400 flex-shrink-0">
                        {TOPIC_ICONS[t.topic] || "•"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{t.topic}</div>
                        <div className="text-xs text-gray-500 font-mono">{t.total} problems</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-xs text-gray-500 font-mono">
                        <span className="text-cyan-300 font-bold">{t.solved}</span> / {t.total} solved
                      </div>
                      <div
                        className={`w-24 rounded-full h-1.5 overflow-hidden hidden sm:block ${
                          isLight ? "bg-slate-200" : "bg-white/5"
                        }`}
                      >
                        <div
                          className={`h-1.5 rounded-full ${
                            isLight ? "bg-cyan-400" : "bg-gradient-to-r from-cyan-400 to-blue-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <ChevronDown size={18} className={`text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {open && (
                    <div
                      className={`border-t overflow-x-auto ${
                        isLight ? "border-slate-200" : "border-white/5"
                      }`}
                    >
                      <div className="min-w-[640px]">
                        <div
                          className={`grid grid-cols-[1fr_8rem_7rem_6rem_6rem] gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider ${
                            isLight
                              ? "text-slate-500 bg-slate-50 border-b border-slate-200"
                              : "text-gray-500 bg-white/[0.02] border-b border-white/5"
                          }`}
                        >
                          <span>Question</span>
                          <span className="text-center">Practice Links</span>
                          <span>Difficulty</span>
                          <span className="text-center">Solved</span>
                          <span className="text-center">Revision</span>
                        </div>

                        {t.items.map((p) => {
                          const disabled = busyId === p._id;
                          const diffCls = DIFF_COLOR[p.difficulty] || "text-gray-300";
                          return (
                            <div
                              key={p._id}
                              className={`grid grid-cols-[1fr_8rem_7rem_6rem_6rem] gap-3 px-5 py-3.5 items-center border-t ${
                                isLight
                                  ? "border-slate-200 hover:bg-slate-50"
                                  : "border-white/5 hover:bg-white/[0.02]"
                              }`}
                            >
                              <button
                                onClick={() => window.open(p.link, "_blank", "noopener,noreferrer")}
                                className="min-w-0 text-left"
                                title="Open problem"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`text-sm transition-colors truncate ${
                                      isLight ? "text-slate-800 hover:text-slate-900" : "text-gray-200 hover:text-white"
                                    }`}
                                  >
                                    {p.title}
                                  </span>
                                  <ExternalLink size={14} className="text-gray-600 flex-shrink-0" />
                                </div>
                                {p.tags?.length > 0 && (
                                  <div className="mt-1 text-[11px] text-gray-600 font-mono truncate">
                                    {p.tags.slice(0, 4).join(" • ")}
                                  </div>
                                )}
                              </button>

                              <div className="flex items-center justify-center gap-2">
                                <PlatformBadge p={p} />
                              </div>

                              <div className={`text-sm font-bold ${diffCls}`}>{p.difficulty}</div>

                              <div className="flex items-center justify-center">
                                <FancyCheck
                                  checked={!!p.status?.solved}
                                  disabled={disabled}
                                  light={isLight}
                                  onChange={() => toggle(p._id, { solved: !p.status?.solved })}
                                />
                              </div>

                              <div className="flex items-center justify-center">
                                <RevisionCheck
                                  checked={!!p.status?.revision}
                                  disabled={disabled}
                                  light={isLight}
                                  onChange={() => toggle(p._id, { revision: !p.status?.revision })}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
