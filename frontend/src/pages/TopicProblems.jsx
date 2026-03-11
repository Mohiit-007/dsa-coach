import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { ChevronLeft, ExternalLink, Search } from "lucide-react";

const TOPIC_SLUG_TO_NAME = {
  arrays: "Arrays",
  strings: "Strings",
  "linked-list": "Linked List",
  stack: "Stack",
  queue: "Queue",
  trees: "Trees",
  graphs: "Graphs",
  "dynamic-programming": "Dynamic Programming",
  greedy: "Greedy",
  "sliding-window": "Sliding Window",
  backtracking: "Backtracking",
  "binary-search": "Binary Search",
};

const DIFF_COLOR = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400  bg-amber-400/10  border-amber-400/20",
  Hard: "text-red-400    bg-red-400/10    border-red-400/20",
};

export default function TopicProblems() {
  const { topicSlug } = useParams();
  const nav = useNavigate();

  const topic = TOPIC_SLUG_TO_NAME[topicSlug] || "Arrays";
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [difficulty, setDifficulty] = useState("All");
  const [status, setStatus] = useState("all"); // all | solved | unsolved | revision
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const query = useMemo(() => {
    const q = { topic, status };
    if (difficulty !== "All") q.difficulty = difficulty;
    if (search.trim()) q.search = search.trim();
    return q;
  }, [topic, difficulty, status, search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/dsa/problems", { params: query });
        if (mounted) setItems(res.data.data || []);
      } catch (e) {
        toast.error(e.response?.data?.message || "Failed to load problems");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [query]);

  const toggle = async (id, patch) => {
    try {
      setBusyId(id);
      const res = await api.put(`/dsa/problems/${id}/status`, patch);
      const next = res.data.data;
      setItems((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: { solved: !!next.solved, revision: !!next.revision } } : p))
      );
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const FancyCheck = ({ checked, onChange, disabled, accent = "cyan", title }) => (
    <label
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${
        disabled
          ? "opacity-60 cursor-not-allowed border-white/10 bg-white/[0.02]"
          : checked
            ? accent === "amber"
              ? "border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15 cursor-pointer"
              : "border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/15 cursor-pointer"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer"
      }`}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
          checked
            ? accent === "amber"
              ? "border-amber-400 bg-amber-400"
              : "border-cyan-400 bg-cyan-400"
            : "border-white/20 bg-transparent"
        }`}
      >
        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => nav("/practice")}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Topics
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div className="min-w-0">
              <div className="text-white font-bold truncate">{topic}</div>
              <div className="text-xs text-gray-500 font-mono">
                Click a title to open the original problem link
              </div>
            </div>
          </div>
          <button onClick={() => nav("/dashboard")} className="btn-secondary text-sm py-2 px-4">
            Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-dark-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-400/50"
          >
            <option className="bg-dark-800 text-gray-200">All</option>
            <option className="bg-dark-800 text-gray-200">Easy</option>
            <option className="bg-dark-800 text-gray-200">Medium</option>
            <option className="bg-dark-800 text-gray-200">Hard</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-dark-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-400/50"
          >
            <option value="all" className="bg-dark-800 text-gray-200">All</option>
            <option value="solved" className="bg-dark-800 text-gray-200">Solved</option>
            <option value="unsolved" className="bg-dark-800 text-gray-200">Unsolved</option>
            <option value="revision" className="bg-dark-800 text-gray-200">Revision</option>
          </select>

          <span className="text-sm text-gray-500">{items.length} problems</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-gray-400">
            No problems found.
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[4rem_1fr_7rem_7rem] gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span className="text-center">Status</span>
              <span>Title</span>
              <span>Difficulty</span>
              <span className="text-center">Revision</span>
            </div>

            {items.map((p, idx) => {
              const solved = !!p.status?.solved;
              const revision = !!p.status?.revision;
              const disabled = busyId === p._id;
              return (
                <div key={p._id} className="group">
                  <div className="grid grid-cols-[4rem_1fr_7rem_7rem] gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all items-center">
                  <div className="flex items-center justify-center">
                    <FancyCheck
                      checked={solved}
                      disabled={disabled}
                      onChange={() => toggle(p._id, { solved: !solved })}
                      accent="cyan"
                      title="Mark solved"
                    />
                  </div>

                  <button
                    onClick={() => window.open(p.link, "_blank", "noopener,noreferrer")}
                    className="text-left min-w-0 group"
                    title="Open problem"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors truncate font-medium">
                        {p.title}
                      </span>
                      <ExternalLink size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                    </div>
                    {p.tags?.length > 0 && (
                      <div className="mt-1 text-[11px] text-gray-600 font-mono truncate">
                        {p.tags.slice(0, 5).join(" • ")}
                      </div>
                    )}
                  </button>

                  <div>
                    <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${DIFF_COLOR[p.difficulty]}`}>
                      {p.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <FancyCheck
                      checked={revision}
                      disabled={disabled}
                      onChange={() => toggle(p._id, { revision: !revision })}
                      accent="amber"
                      title="Needs revision"
                    />
                  </div>
                </div>
                  <div className="px-5 pb-3 -mt-1 flex justify-end">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(p.link, '_blank', 'noopener,noreferrer'); }}
                        className="text-[11px] font-mono text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
                        title="Open problem"
                      >
                        <ExternalLink size={12} /> Open
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

