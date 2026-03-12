import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Bookmark, Trash2, ArrowRight, CheckCircle, XCircle, ChevronLeft, ChevronRight, Code2, BookOpen, Bug, ChevronDown, Check } from "lucide-react";
import { getHistory, deleteHistoryEntry, toggleBookmark } from "../services/historyService";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const LANGUAGES = ["All", "C++", "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C#"];
const LANG_ICONS = { "C++": "⚙️", Python: "🐍", Java: "☕", JavaScript: "🌐", TypeScript: "🔷", Go: "🔵", Rust: "🦀", "C#": "🟣" };
// Map toolType to actual route path for "View in X tool" redirect
const TOOL_TYPE_ROUTES = { explain: "/explainer", analyze: "/analyzer", debug: "/debugger" };
const TOOL_TYPES = [
  { value: "all", label: "All Tools", icon: Code2 },
  { value: "analyze", label: "Analyze", icon: Code2 },
  { value: "explain", label: "Explain", icon: BookOpen },
  { value: "debug", label: "Debug", icon: Bug },
];

function LanguageDropdown({ value, onChange, theme }) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value || "All";
  const selectedIcon = LANG_ICONS[selectedLabel] || "🌐";

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between w-full gap-2 px-3 py-2.5 rounded-xl border text-sm shadow-sm transition-all
          ${theme === "light"
            ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800"
            : "border-white/10 bg-dark-800/80 hover:border-white/20 hover:bg-dark-700 text-gray-100"}`}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{selectedIcon}</span>
          <span
            className={`font-medium ${
              theme === "light" ? "text-slate-800" : "text-white"
            }`}
          >
            {selectedLabel}
          </span>
        </span>
        <ChevronDown size={14} className={theme === "light" ? "text-slate-500" : "text-gray-400"} />
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-2 w-44 rounded-xl border shadow-2xl overflow-hidden ${
            theme === "light"
              ? "border-slate-200 bg-white"
              : "border-white/10 bg-dark-800"
          }`}
        >
          <div className="py-1.5">
            {LANGUAGES.map((lang) => {
              const active = value === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    onChange(lang);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    active
                      ? theme === "light"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "bg-white/10 text-white font-semibold"
                      : theme === "light"
                        ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{LANG_ICONS[lang] || "🌐"}</span>
                  <span className="flex-1 text-left">{lang}</span>
                  {active && <Check size={13} className="text-cyan-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ toolType: "all", language: "All", search: "" });
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const fetchHistory = useCallback(async () => {
    console.log(`[HISTORY-PAGE] === Fetching History Page ===`);
    console.log(`[HISTORY-PAGE] Page: ${page}`);
    console.log(`[HISTORY-PAGE] Filters:`, filters);
    
    setLoading(true);
    try {
      const filterParams = {
        page,
        limit: 12,
      };
      
      if (filters.toolType !== "all") {
        filterParams.toolType = filters.toolType;
      }
      if (filters.language !== "All") {
        filterParams.language = filters.language;
      }
      if (filters.search) {
        filterParams.search = filters.search;
      }

      console.log(`[HISTORY-PAGE] Calling getHistory with:`, filterParams);
      const res = await getHistory(filterParams);
      
      console.log(`[HISTORY-PAGE] ✅ History fetched successfully`);
      console.log(`[HISTORY-PAGE] Setting ${res.data?.length || 0} history items`);
      console.log(`[HISTORY-PAGE] Total count: ${res.total}`);
      
      setHistory(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch (error) {
      console.error(`[HISTORY-PAGE] ❌ Fetch failed:`, error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await toggleBookmark(id);
      setHistory(prev => prev.map(item => item._id === id ? { ...item, isBookmarked: res.data.isBookmarked } : item));
    } catch { 
      toast.error("Failed to update bookmark"); 
    }
  };

  const performDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteHistoryEntry(id);
      setHistory(prev => prev.filter(item => item._id !== id));
      setTotal(prev => prev - 1);
      toast.success("History entry deleted");
    } catch {
      toast.error("Failed to delete history entry");
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const getToolIcon = (toolType) => {
    switch (toolType) {
      case "analyze": return Code2;
      case "explain": return BookOpen;
      case "debug": return Bug;
      default: return Code2;
    }
  };

  const getToolColor = (toolType) => {
    switch (toolType) {
      case "analyze": return "text-cyan-400";
      case "explain": return "text-green-400";
      case "debug": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const truncateCode = (code, maxLength = 100) => {
    if (code.length <= maxLength) return code;
    return code.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-up">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
          History
        </h1>
        <p className={theme === "light" ? "text-slate-600 font-mono text-sm" : "text-gray-500 font-mono text-sm"}>
          Your Code Tools activity history
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tool Type Filter */}
            <div className="flex-1">
              <label
                className={`block text-xs font-semibold font-mono tracking-wider uppercase mb-2 ${
                  theme === "light" ? "text-slate-500" : "text-gray-400"
                }`}
              >
                Tool Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {TOOL_TYPES.map((tool) => {
                  const Icon = tool.icon;
                  const active = filters.toolType === tool.value;
                  return (
                    <button
                      key={tool.value}
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, toolType: tool.value }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                        active
                          ? theme === "light"
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-dark-800/80 text-cyan-200 border-cyan-400/60 shadow-sm"
                          : theme === "light"
                            ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            : "bg-dark-900/60 text-gray-300 border-white/10 hover:bg-dark-800 hover:text-white"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Filter */}
            <div className="flex-1">
              <label
                className={`block text-xs font-semibold font-mono tracking-wider uppercase mb-2 ${
                  theme === "light" ? "text-slate-500" : "text-gray-400"
                }`}
              >
                Language
              </label>
              <LanguageDropdown
                value={filters.language}
                onChange={(lang) => setFilters(prev => ({ ...prev, language: lang }))}
                theme={theme}
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label
              className={`block text-xs font-semibold font-mono tracking-wider uppercase mb-2 ${
                theme === "light" ? "text-slate-500" : "text-gray-400"
              }`}
            >
              Search
            </label>
            <div className="relative">
              <Search
                size={16}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === "light" ? "text-slate-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search code, title, or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={`w-full rounded-xl pl-10 pr-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 border ${
                  theme === "light"
                    ? "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400"
                    : "border-white/10 bg-dark-800/80 text-gray-100 placeholder:text-gray-500"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={theme === "light" ? "text-slate-500" : "text-gray-400"}>Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="card p-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              theme === "light" ? "bg-slate-100" : "bg-gray-800"
            }`}
          >
            <Search
              size={24}
              className={theme === "light" ? "text-slate-500" : "text-gray-600"}
            />
          </div>
          <h3 className="text-lg font-semibold mb-2">No history found</h3>
          <p className={theme === "light" ? "text-slate-500 text-sm" : "text-gray-400 text-sm"}>
            {filters.search || filters.toolType !== "all" || filters.language !== "All"
              ? "Try adjusting your filters"
              : "Start using the Code Tools to see your history here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const ToolIcon = getToolIcon(item.toolType);
            return (
              <div key={item._id} className="card group hover:border-cyan-500/30 transition-all">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg glass border border-white/10 ${getToolColor(item.toolType)}`}>
                        <ToolIcon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-mono font-semibold uppercase ${getToolColor(item.toolType)}`}>
                            {item.toolType}
                          </span>
                          <span
                            className={`text-xs ${
                              theme === "light" ? "text-slate-500" : "text-gray-500"
                            }`}
                          >
                            {LANG_ICONS[item.language]} {item.language}
                          </span>
                        </div>
                        <h3
                          className={`font-semibold mb-1 ${
                            theme === "light" ? "text-slate-900" : "text-white"
                          }`}
                        >
                          {item.problemTitle || `${item.toolType.charAt(0).toUpperCase() + item.toolType.slice(1)} Session`}
                        </h3>
                        <p
                          className={`text-xs ${
                            theme === "light" ? "text-slate-500" : "text-gray-400"
                          }`}
                        >
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleBookmark(item._id, e)}
                        className={`p-2 rounded-lg transition-all ${
                          item.isBookmarked
                            ? "text-yellow-400 hover:text-yellow-300"
                            : theme === "light"
                              ? "text-slate-500 hover:text-yellow-500"
                              : "text-gray-500 hover:text-yellow-400"
                        }`}
                        title={item.isBookmarked ? "Remove bookmark" : "Add bookmark"}
                      >
                        <Bookmark size={14} fill={item.isBookmarked ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(item._id);
                        }}
                        disabled={deleting === item._id}
                        className={`p-2 rounded-lg transition-all ${
                          theme === "light"
                            ? "text-slate-500 hover:text-red-500"
                            : "text-gray-500 hover:text-red-400"
                        }`}
                        title="Delete"
                      >
                        {deleting === item._id ? (
                          <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Preview */}
                  <div className="mb-3">
                    <div
                      className={`rounded-lg p-3 border ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200"
                          : "bg-dark-800/50 border-white/5"
                      }`}
                    >
                      <pre
                        className={`text-xs font-mono overflow-x-auto ${
                          theme === "light" ? "text-slate-800" : "text-gray-300"
                        }`}
                      >
                        {truncateCode(item.codeInput)}
                      </pre>
                    </div>
                  </div>

                  {/* Action Link - redirects to correct tool page (explainer / analyzer / debugger) */}
                  <Link
                    to={TOOL_TYPE_ROUTES[item.toolType] || `/dashboard`}
                    state={{ historyItem: item }}
                    className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View in {item.toolType.charAt(0).toUpperCase() + item.toolType.slice(1)} tool
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`p-2 rounded-lg glass border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "light"
                ? "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let pageNum;
              if (pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pages - 2) {
                pageNum = pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono transition-all ${
                    page === pageNum
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
                      : theme === "light"
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "glass border border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className={`p-2 rounded-lg glass border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "light"
                ? "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center mt-6">
        <p
          className={`text-xs font-mono ${
            theme === "light" ? "text-slate-500" : "text-gray-500"
          }`}
        >
          Showing {history.length} of {total} results
        </p>
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 shadow-xl ${
              isLight ? "bg-white border border-slate-200" : "bg-dark-800 border border-white/10"
            }`}
          >
            <h2 className="text-base font-bold mb-2">Delete history entry?</h2>
            <p
              className={`text-xs sm:text-sm mb-4 font-mono ${
                isLight ? "text-slate-600" : "text-gray-400"
              }`}
            >
              This action cannot be undone. You&apos;ll permanently remove this Code Tools run from your history.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmId(null)}
                disabled={deleting === confirmId}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-500/40 text-slate-200 hover:bg-white/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => performDelete(confirmId)}
                disabled={deleting === confirmId}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-500/60 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
              >
                {deleting === confirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
