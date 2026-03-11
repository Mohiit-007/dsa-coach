import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Map, Trash2, FileDown, RefreshCw } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

export default function MyLearningPaths() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/learn/learning-paths");
        setPaths(res.data.data || []);
      } catch {
        toast.error("Failed to load learning paths");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/learn/learning-path/${id}`);
      setPaths((prev) => prev.filter((p) => p._id !== id));
      toast.success("Learning path deleted");
    } catch {
      toast.error("Failed to delete learning path");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const downloadPdf = async (id) => {
    try {
      const res = await api.get(`/learn/learning-path/${id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dsa-learning-path-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            My <span className="text-cyan-400">Learning Paths</span>
          </h1>
          <p
            className={`font-mono text-xs sm:text-sm ${
              isLight ? "text-slate-600" : "text-gray-500"
            }`}
          >
            Revisit, resume, or export your personalized study plans.
          </p>
        </div>
        <button
          onClick={() => navigate("/learning-path")}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Map size={14} /> New Learning Path
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : paths.length === 0 ? (
        <div className="card p-6 sm:p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h2 className="text-lg font-bold mb-1">No learning paths yet</h2>
          <p
            className={`font-mono text-xs sm:text-sm mb-4 ${
              isLight ? "text-slate-600" : "text-gray-500"
            }`}
          >
            Generate your first roadmap and we&apos;ll save it here.
          </p>
          <button
            onClick={() => navigate("/learning-path")}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Map size={14} /> Create Learning Path
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          {paths.map((p) => (
            <div
              key={p._id}
              className={`card p-4 sm:p-5 flex flex-col justify-between ${
                isLight ? "bg-white border border-slate-200 shadow-sm" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold mb-1">
                    {p.title || `Learning Path`}
                  </h2>
                  <p
                    className={`text-xs font-mono ${
                      isLight ? "text-slate-600" : "text-gray-500"
                    }`}
                  >
                    {p.topics?.length ? p.topics.join(" · ") : "Mixed DSA topics"}
                  </p>
                </div>
                <div className="text-right text-xs font-mono">
                  <div
                    className={isLight ? "text-slate-500" : "text-gray-500"}
                  >
                    {formatDate(p.createdAt)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-cyan-400 mt-0.5">
                    {p.duration} days
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-4">
                <div
                  className={`flex justify-between text-xs font-mono mb-1 ${
                    isLight ? "text-slate-600" : "text-gray-500"
                  }`}
                >
                  <span>Progress</span>
                  <span>{p.progress || 0}%</span>
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
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div
                  className={`flex items-center gap-1 text-[11px] font-mono ${
                    isLight ? "text-slate-600" : "text-gray-500"
                  }`}
                >
                  <Calendar size={12} className="text-cyan-400" />
                  Saved path
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(`/learning-path?id=${p._id}`)
                    }
                    className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5"
                  >
                    <RefreshCw size={12} /> Resume
                  </button>
                  <button
                    onClick={() => downloadPdf(p._id)}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <FileDown size={12} /> Download PDF
                  </button>
                  <button
                    onClick={() => setConfirmId(p._id)}
                    disabled={deletingId === p._id}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/5 disabled:opacity-60"
                  >
                    <Trash2 size={12} />
                    {deletingId === p._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 shadow-xl ${
              isLight ? "bg-white border border-slate-200" : "bg-dark-800 border border-white/10"
            }`}
          >
            <h2 className="text-base font-bold mb-2">Delete learning path?</h2>
            <p
              className={`text-xs sm:text-sm mb-4 font-mono ${
                isLight ? "text-slate-600" : "text-gray-400"
              }`}
            >
              This action cannot be undone. You&apos;ll permanently remove this saved roadmap.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deletingId === confirmId}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-500/40 text-slate-200 hover:bg-white/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/60 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
              >
                {deletingId === confirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

