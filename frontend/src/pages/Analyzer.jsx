import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Code2, Zap, ChevronDown, BookOpen, TrendingUp, Lightbulb, MessageSquare, Link2, CheckCircle, XCircle, Copy, Check, ExternalLink, Bug, RotateCcw } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx";
import api from "../api/axios";
import { saveToHistory } from "../services/historyService";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const LANGUAGES = [
  { name: "C++", icon: "⚙️", color: "#00599C" },
  { name: "Python", icon: "🐍", color: "#3776AB" },
  { name: "Java", icon: "☕", color: "#ED8B00" },
  { name: "JavaScript", icon: "🌐", color: "#F7DF1E" },
  { name: "TypeScript", icon: "🔷", color: "#3178C6" },
  { name: "Go", icon: "🔵", color: "#00ADD8" },
  { name: "Rust", icon: "🦀", color: "#CE422B" },
  { name: "C#", icon: "🟣", color: "#9B4F96" },
];

const MONACO_LANG_MAP = { "C++": "cpp", Python: "python", Java: "java", JavaScript: "javascript", TypeScript: "typescript", Go: "go", Rust: "rust", "C#": "csharp" };

function LangPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find(l => l.name === value) || LANGUAGES[0];
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
          isLight
            ? open
              ? "bg-slate-50 border-cyan-400 shadow-sm"
              : "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400"
            : open
              ? "bg-white/[0.07] border-cyan-500/40"
              : "glass border-white/10"
        }`}
      >
        <span className="text-base">{selected.icon}</span>
        <span className={`text-sm font-semibold ${isLight ? "text-slate-800" : ""}`}>
          {selected.name}
        </span>
        <ChevronDown
          size={13}
          className={`transition-transform ${
            isLight ? "text-slate-500" : "text-gray-400"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-2 right-0 left-auto min-w-full w-48 z-50 rounded-xl overflow-hidden shadow-2xl animate-fade-up border ${
            isLight ? "bg-white border-slate-200" : "bg-dark-700 border-white/10"
          }`}
        >
          <div className="p-1.5">
            {LANGUAGES.map(l => {
              const active = value === l.name;
              const base =
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all";
              const cls = active
                ? isLight
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "bg-white/[0.08] text-white font-bold"
                : isLight
                  ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white";
              return (
                <button
                  key={l.name}
                  onClick={() => {
                    onChange(l.name);
                    setOpen(false);
                  }}
                  className={`${base} ${cls}`}
                >
                  <span>{l.icon}</span>
                  <span>{l.name}</span>
                  {active && (
                    <Check
                      size={13}
                      className={`ml-auto ${
                        isLight ? "text-cyan-500" : "text-cyan-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono glass border-white/10 text-gray-400 hover:text-white transition-all">
      {copied ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function HintCard({ hint, index }) {
  const [revealed, setRevealed] = useState(false);
  const colors = [
    "text-amber-400 border-amber-400/20 bg-amber-400/5",
    "text-orange-400 border-orange-400/20 bg-orange-400/5",
    "text-red-400 border-red-400/20 bg-red-400/5",
  ];
  const labels = ["💡 Gentle Nudge", "🔍 Closer Look", "⚡ Key Insight"];
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div
      onClick={() => setRevealed((r) => !r)}
      className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
        revealed ? colors[index] : "glass border-white/[0.07]"
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold font-mono">{labels[index]}</span>
        <span className="text-xs text-gray-500 font-mono">
          {revealed ? "hide ↑" : "reveal →"}
        </span>
      </div>
      {revealed && (
        <p
          className={`mt-3 text-sm leading-relaxed font-mono animate-fade-up ${
            isLight ? "text-slate-700" : "text-gray-300"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function ComplexityBadge({ label, value, color }) {
  const cls = { red: "bg-red-400/10 border-red-400/20 text-red-400", green: "bg-green-400/10 border-green-400/20 text-green-400", blue: "bg-blue-400/10 border-blue-400/20 text-blue-400" };
  return (
    <div className={`flex flex-col gap-1 border rounded-xl p-4 flex-1 min-w-[90px] ${cls[color]}`}>
      <span className="text-[10px] font-mono tracking-wider opacity-70">{label}</span>
      <span className="text-lg sm:text-xl font-black font-mono">{value}</span>
    </div>
  );
}

function normalizeBigO(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/o\s*\(|\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function complexityKind(bigO) {
  const t = normalizeBigO(bigO);
  if (!t) return "unknown";
  if (/(2\^n|exponential)/.test(t)) return "exp";
  if (/(n\s*!|factorial)/.test(t)) return "fact";
  if (/(n\s*\^\s*3|n3|cubic)/.test(t)) return "cubic";
  if (/(n\s*\^\s*2|n2|quadratic)/.test(t)) return "quad";
  if (/n\s*log\s*n/.test(t)) return "nlogn";
  if (/log\s*n/.test(t)) return "logn";
  if (/\bn\b/.test(t)) return "linear";
  if (/\b1\b|constant/.test(t)) return "const";
  return "other";
}

function growthFn(kind) {
  switch (kind) {
    case "const": return (n) => 1;
    case "logn": return (n) => Math.log2(n);
    case "linear": return (n) => n;
    case "nlogn": return (n) => n * Math.log2(n);
    case "quad": return (n) => n * n;
    case "cubic": return (n) => n * n * n;
    case "exp": return (n) => Math.pow(2, n / 10); // scaled so chart stays readable
    case "fact": return (n) => Math.pow(n / 8, n / 8); // rough scaled growth
    default: return (n) => n;
  }
}

export default function Analyzer() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("analyze");
  const [form, setForm] = useState({ title: "", description: "", code: "", language: user?.preferredLanguage || "C++" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  // Determine active tab based on current route
  useEffect(() => {
    if (location.pathname === "/analyzer") {
      setActiveTab("analyze");
    } else if (location.pathname === "/explainer") {
      setActiveTab("explain");
    } else if (location.pathname === "/debugger") {
      setActiveTab("debug");
    }
  }, [location.pathname]);

  const tabs = [
    { id: "analyze", label: "Analyze", icon: Code2, route: "/analyzer" },
    { id: "explain", label: "Explain", icon: BookOpen, route: "/explainer" },
    { id: "debug", label: "Debug", icon: Bug, route: "/debugger" },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "explain") {
      navigate("/explainer");
    } else if (tabId === "debug") {
      navigate("/debugger");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(form.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleResetCode = () => {
    setForm(f => ({ ...f, code: "" }));
    localStorage.removeItem('code-tools-code');
    // Emit reset event to sync with other editors
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: "", source: 'analyzer' } }));
    toast.success("Code reset successfully!");
  };

  const handleTitleChange = (newTitle) => {
    setForm(f => ({ ...f, title: newTitle }));
    localStorage.setItem('code-tools-title', newTitle);
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { title: newTitle, source: 'analyzer' } }));
  };

  // Sync code across all editors and persist to localStorage
  const handleCodeChange = (newCode) => {
    setForm(f => ({ ...f, code: newCode }));
    // Save to localStorage for persistence
    localStorage.setItem('code-tools-code', newCode);
    // Emit event to sync with other editors
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: newCode, source: 'analyzer' } }));
  };

  // Listen for code sync events from other editors
  useEffect(() => {
    const handleSync = (event) => {
      const { code, title, source } = event.detail || {};
      if (source !== 'analyzer') {
        setForm(f => ({
          ...f,
          ...(typeof code === "string" ? { code } : {}),
          ...(typeof title === "string" ? { title } : {}),
        }));
      }
    };

    window.addEventListener('code-tools-sync', handleSync);
    return () => window.removeEventListener('code-tools-sync', handleSync);
  }, []);

  // Load code from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('code-tools-code');
    if (savedCode && !form.code) {
      setForm(f => ({ ...f, code: savedCode }));
    }
  }, []);

  useEffect(() => {
    const savedTitle = localStorage.getItem('code-tools-title');
    if (savedTitle && !form.title) {
      setForm(f => ({ ...f, title: savedTitle }));
    }
  }, []);

  useEffect(() => {
    const t = searchParams.get("title");
    if (t && !form.title) {
      setForm((f) => ({ ...f, title: t }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Add real-time form state debugging
  useEffect(() => {
    console.log(`[ANALYZE] === Form State Update ===`);
    console.log(`[ANALYZE] Current form:`, form);
    console.log(`[ANALYZE] Title value:`, form.title);
    console.log(`[ANALYZE] Title type:`, typeof form.title);
    console.log(`[ANALYZE] Is title string:`, typeof form.title === 'string');
  }, [form]);

  // Restore session when navigating from History ("View in Analyze tool")
  useEffect(() => {
    const historyItem = location.state?.historyItem;
    console.log(`[ANALYZE] === History Restoration Check ===`);
    console.log(`[ANALYZE] Current pathname: ${location.pathname}`);
    console.log(`[ANALYZE] History item exists:`, !!historyItem);
    console.log(`[ANALYZE] History item toolType:`, historyItem?.toolType);
    console.log(`[ANALYZE] History item title:`, historyItem?.problemTitle);
    console.log(`[ANALYZE] History item codeInput length:`, historyItem?.codeInput?.length);
    
    if (location.pathname === "/analyzer" && historyItem?.toolType === "analyze") {
      console.log(`[ANALYZE] Restoring from history...`);
      const newForm = {
        ...form,
        code: historyItem.codeInput || "",
        language: historyItem.language || "C++",
        title: historyItem.problemTitle || form.title,
        description: historyItem.problemDescription || form.description,
      };
      console.log(`[ANALYZE] New form state:`, newForm);
      setForm(newForm);
      // Backend stores analysis result as resultOutput; Analyzer expects { result }
      setResult(historyItem.resultOutput != null ? { result: historyItem.resultOutput } : null);
      navigate(location.pathname, { replace: true, state: {} });
      console.log(`[ANALYZE] ✅ History restoration complete`);
    }
  }, [location.pathname, location.state, navigate]);

  const selectedLang = LANGUAGES.find(l => l.name === form.language) || LANGUAGES[0];

  const handleAnalyze = async () => {
    console.log(`[ANALYZE] === Validation Check ===`);
    console.log(`[ANALYZE] Form state:`, form);
    console.log(`[ANALYZE] Title: "${form.title}"`);
    console.log(`[ANALYZE] Title trimmed: "${form.title.trim()}"`);
    console.log(`[ANALYZE] Title exists:`, !!form.title);
    console.log(`[ANALYZE] Title length:`, form.title?.length);
    console.log(`[ANALYZE] Title is falsy:`, !form.title);
    console.log(`[ANALYZE] Title.trim() is falsy:`, !form.title.trim());
    
    // Test with direct comparison
    if (form.title === "") {
      console.error(`[ANALYZE] Title is empty string`);
    }
    if (form.title === null) {
      console.error(`[ANALYZE] Title is null`);
    }
    if (form.title === undefined) {
      console.error(`[ANALYZE] Title is undefined`);
    }
    
    if (!form.title.trim()) { 
      console.error(`[ANALYZE] Title validation failed`);
      toast.error("Problem title is required"); 
      return; 
    }
    if (!form.code.trim()) { 
      console.error(`[ANALYZE] Code validation failed`);
      toast.error("Please paste your code"); 
      return; 
    }

    console.log(`[ANALYZE] ✅ Validation passed`);
    setLoading(true);
    setResult(null);
    console.log(`[ANALYZE] Starting analysis for ${form.language}`);
    console.log(`[ANALYZE] Code length: ${form.code.length}`);
    console.log(`[ANALYZE] Token exists:`, !!localStorage.getItem("token"));
    
    try {
      // Backend expects: { problemTitle, problemDescription, userCode, language }
      const res = await api.post("/analysis/analyze", {
        problemTitle: form.title,
        problemDescription: form.description,
        userCode: form.code,
        language: form.language,
      });
      // Backend returns a saved History entry (result is in `resultOutput`)
      const historyEntry = res.data.data;
      
      console.log(`[ANALYZE] Analysis received:`, historyEntry ? "success" : "failed");
      setResult(historyEntry ? { ...historyEntry, result: historyEntry.resultOutput } : null);
      updateUser({ ...user, dailyUsage: (user.dailyUsage || 0) + 1 });
      
      // Save to unified history
      try {
        await saveToHistory(
          "analyze",
          form.code,
          form.language,
          historyEntry?.resultOutput,
          form.title,
          form.description
        );
      } catch (historyError) {
        console.warn("Failed to save to history:", historyError);
        // Don't show error to user, just log it
      }
      
      toast.success("Analysis complete! 🎉");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      console.error("[ANALYZE] Analysis error:", err);
      console.error("[ANALYZE] Error response:", err.response?.data);
      const msg = err.response?.data?.message || "Analysis failed";
      if (err.response?.data?.limitReached) {
        toast.error("Daily limit reached. Upgrade to Pro for unlimited analyses.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const r = result?.result;

  const complexityChart = useMemo(() => {
    const userTime = r?.code_analysis?.time_complexity;
    const optTime = r?.optimized_solution?.time_complexity;
    if (!userTime || !optTime) return null;

    const userKind = complexityKind(userTime);
    const optKind = complexityKind(optTime);
    const fUser = growthFn(userKind);
    const fOpt = growthFn(optKind);

    const ns = [10, 20, 50, 100, 200, 500, 1000];
    const raw = ns.map((n) => ({ n, user: fUser(n), optimal: fOpt(n) }));
    const max = Math.max(...raw.flatMap((d) => [d.user, d.optimal]).filter((x) => Number.isFinite(x))) || 1;
    return raw.map((d) => ({
      n: d.n,
      user: Math.round((d.user / max) * 1000) / 10,
      optimal: Math.round((d.optimal / max) * 1000) / 10,
    }));
  }, [r]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-up">
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">Code <span className="text-cyan-400">Tools</span></h1>
        <p className="text-gray-500 font-mono text-xs sm:text-sm">AI-powered code analysis, explanation, and debugging tools</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 glass rounded-xl border border-white/10 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.route;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? theme === "light"
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg"
                    : theme === "light"
                      ? "text-gray-700 hover:text-black hover:bg-gray-100"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.charAt(0)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Only show analyze content when analyze tab is active */}
      {activeTab === "analyze" && (
        <>
          {/* Input form */}
          <div className="card mb-6">
            <div className="section-header border-cyan-500/10 bg-cyan-500/[0.03]">
              <Code2 size={15} className="text-cyan-400" />
              <span className="font-bold text-sm text-cyan-400 font-mono tracking-wider">INPUT</span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {/* Title + Language — stacks on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Problem Title *</label>
                  <input 
                    value={form.title} 
                    onChange={e => {
                      handleTitleChange(e.target.value);
                    }} 
                    placeholder="e.g. Two Sum" 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Language</label>
                  <LangPicker value={form.language} onChange={v => setForm(f => ({ ...f, language: v }))} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Problem Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the problem (optional but improves analysis quality)..." rows={2}
                  className="input-field resize-none leading-relaxed" />
              </div>

              {/* Code editor with copy-paste buttons */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase">Your Code *</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    {/* Language picker */}
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-1 sr-only">Language</label>
                      <LangPicker value={form.language} onChange={v => setForm(f => ({ ...f, language: v }))} />
                    </div>
                    
                    {/* Action buttons */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all w-full sm:w-auto justify-center ${
                      theme === "light" 
                        ? 'bg-gray-100 border-gray-400 shadow-md' 
                        : 'glass border-white/10'
                    }`}>
                      <button
                        onClick={handleCopyCode}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-mono transition-all ${
                          theme === "light"
                            ? 'text-gray-900 hover:text-gray-900 hover:bg-gray-200 font-medium'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                        title="Copy code"
                      >
                        {copied ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
                      </button>
                      <div className={`w-px h-4 ${theme === "light" ? 'bg-gray-400' : 'bg-white/10'}`} />
                      <button
                        onClick={handleResetCode}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-mono transition-all ${
                          theme === "light"
                            ? 'text-gray-900 hover:text-red-600 hover:bg-red-100 font-medium'
                            : 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                        }`}
                        title="Reset code"
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <Editor
                    height="350px"
                    language={MONACO_LANG_MAP[form.language] || "cpp"}
                    value={form.code}
                    onChange={handleCodeChange}
                    theme={theme === "light" ? "vs-light" : "vs-dark"}
                    options={{ fontSize: 13, fontFamily: "JetBrains Mono", lineHeight: 1.7, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, tabSize: 4 }}
                  />
                </div>
              </div>

              <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap size={15} /> Analyze My Code</>
                )}
              </button>
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-4 animate-fade-up">
              {[80, 140, 200, 120].map((h, i) => (
                <div key={i} className="card" style={{ height: h }}>
                  <div className="h-full rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {r && !loading && (
            <div ref={resultRef} className="space-y-4 sm:space-y-5 animate-fade-up">
              {/* Summary banner */}
              <div className={`card p-4 sm:p-6 border ${r.is_optimal ? "border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-600/5" : "border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-600/5"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-gray-500 font-mono tracking-widest uppercase mb-2">Analysis Complete</div>
                    <div className="text-xl sm:text-2xl font-black tracking-tight mb-3">{result.problemTitle}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">🔷 {r.algorithm_pattern}</span>
                      <span className={`badge border ${
                        r.difficulty === "Easy" ? "bg-green-400/10 border-green-400/20 text-green-400" :
                        r.difficulty === "Medium" ? "bg-amber-400/10 border-amber-400/20 text-amber-400" :
                        "bg-red-400/10 border-red-400/20 text-red-400"
                      }`}>{r.difficulty}</span>
                      <span className="badge" style={{ background: `${selectedLang.color}18`, borderColor: `${selectedLang.color}35`, color: "#d1d5db" }}>
                        {selectedLang.icon} {selectedLang.name}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${r.is_optimal ? "bg-green-400/10 border border-green-400/20" : "bg-amber-400/10 border border-amber-400/20"}`}>
                    {r.is_optimal ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-amber-400" size={20} />}
                    <div>
                      <div className={`font-bold text-sm ${r.is_optimal ? "text-green-400" : "text-amber-400"}`}>
                        {r.is_optimal ? "Optimal Solution" : "Can Be Improved"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{r.is_optimal ? "Great work!" : "See optimization below"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complexity */}
              <div className="card">
                <div className="section-header">
                  <TrendingUp size={15} className="text-cyan-400" />
                  <span className="font-bold text-sm font-mono tracking-wider text-cyan-400">COMPLEXITY ANALYSIS</span>
                </div>
                <div className="p-4 sm:p-5 space-y-5">
                  <div>
                    <div className="text-xs text-gray-500 font-mono tracking-wider uppercase mb-3">Your Solution</div>
                    <div className="flex gap-3 flex-wrap mb-3">
                      <ComplexityBadge label="TIME" value={r.code_analysis?.time_complexity} color="red" />
                      <ComplexityBadge label="SPACE" value={r.code_analysis?.space_complexity} color="blue" />
                    </div>
                    <p className="text-xs text-gray-500 font-mono mb-2">
                      {`Your current code runs in ${r.code_analysis?.time_complexity || "unknown"} time and ${r.code_analysis?.space_complexity || "unknown"} space.`}
                      {r.optimized_solution?.time_complexity && (
                        <> The optimal approach runs in {r.optimized_solution.time_complexity} time and {r.optimized_solution.space_complexity || "unknown"} space.</>
                      )}
                    </p>
                    <p
                      className={`text-sm leading-relaxed font-mono ${
                        isLight ? "text-slate-700" : "text-gray-400"
                      }`}
                    >
                      {r.code_analysis?.explanation}
                    </p>
                  </div>

                  {/* Complexity comparison graph */}
                  {complexityChart && (
                    <div className="pt-4 border-t border-white/[0.06]">
                      <div className="text-xs text-gray-500 font-mono tracking-wider uppercase mb-3">Complexity Comparison (normalized)</div>
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={complexityChart} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                            <XAxis dataKey="n" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "JetBrains Mono" }} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "JetBrains Mono" }} unit="%" />
                            <Tooltip
                              contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontFamily: "JetBrains Mono", fontSize: 11 }}
                              labelStyle={{ color: "#9ca3af" }}
                              formatter={(v, name) => [`${v}%`, name === "user" ? "Your algorithm" : "Optimal algorithm"]}
                            />
                            <Legend
                              formatter={(value) => (value === "user" ? "Your algorithm" : "Optimal algorithm")}
                              wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#9ca3af" }}
                            />
                            <Line type="monotone" dataKey="user" stroke="#f87171" strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="optimal" stroke="#4ade80" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[11px] text-gray-600 font-mono mt-2">
                        This chart is normalized (0–100%) to show growth trend. Bigger separation means the optimal approach scales much better as input size increases.
                      </p>
                    </div>
                  )}
                  {!r.is_optimal && (
                    <div className="pt-4 border-t border-white/[0.06]">
                      <div className="text-xs text-gray-500 font-mono tracking-wider uppercase mb-3">Optimal Solution</div>
                      <div className="flex gap-3 flex-wrap mb-3">
                        <ComplexityBadge label="TIME" value={r.optimized_solution?.time_complexity} color="green" />
                        <ComplexityBadge label="SPACE" value={r.optimized_solution?.space_complexity} color="green" />
                      </div>
                      <p
                        className={`text-sm leading-relaxed font-mono ${
                          isLight ? "text-slate-700" : "text-gray-400"
                        }`}
                      >
                        {r.optimized_solution?.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization advice */}
              {!r.is_optimal && r.optimization_advice && (
                <div className="card">
                  <div className="section-header">
                    <Zap size={15} className="text-amber-400" />
                    <span className="font-bold text-sm font-mono tracking-wider text-amber-400">OPTIMIZATION ADVICE</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <p
                      className={`text-sm leading-relaxed ${
                        isLight ? "text-slate-700" : "text-gray-300"
                      }`}
                    >
                      {r.optimization_advice}
                    </p>
                  </div>
                </div>
              )}

              {/* Optimized code */}
              {r.optimized_solution?.code && (
                <div className="card">
                  <div className="section-header">
                    <Code2 size={15} className="text-green-400" />
                    <span className="font-bold text-sm font-mono tracking-wider text-green-400">OPTIMIZED CODE</span>
                    <div className="ml-auto"><CopyButton text={r.optimized_solution.code} /></div>
                  </div>
                  <div className="rounded-b-2xl overflow-hidden">
                    <Editor
                      height="260px"
                      language={MONACO_LANG_MAP[form.language] || "cpp"}
                      value={r.optimized_solution.code}
                      theme={theme === "light" ? "vs-light" : "vs-dark"}
                      options={{ readOnly: true, fontSize: 13, fontFamily: "JetBrains Mono", lineHeight: 1.7, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 } }}
                    />
                  </div>
                </div>
              )}

              {/* Hints */}
              {r.hints?.length > 0 && (
                <div className="card">
                  <div className="section-header">
                    <Lightbulb size={15} className="text-amber-400" />
                    <span className="font-bold text-sm font-mono tracking-wider text-amber-400">PROGRESSIVE HINTS</span>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs text-gray-600 font-mono mb-4">Click to reveal — try in order before looking at the optimized code</p>
                    {r.hints.map((h, i) => <HintCard key={i} hint={h} index={i} />)}
                  </div>
                </div>
              )}

              {/* Interview follow-ups */}
              {r.interview_followups?.length > 0 && (
                <div className="card">
                  <div className="section-header">
                    <MessageSquare size={15} className="text-purple-400" />
                    <span className="font-bold text-sm font-mono tracking-wider text-purple-400">INTERVIEW FOLLOW-UPS</span>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    {r.interview_followups.map((q, i) => (
                      <div key={i} className="flex gap-3 sm:gap-4 bg-purple-400/5 border border-purple-400/10 rounded-xl p-4">
                        <span className="badge bg-purple-400/15 border-purple-400/25 text-purple-400 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                        <p
                          className={`text-sm leading-relaxed ${
                            isLight ? "text-slate-800" : "text-gray-300"
                          }`}
                        >
                          {q}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related problems */}
              {r.related_problems?.length > 0 && (
                <div className="card">
                  <div className="section-header">
                    <Link2 size={15} className="text-blue-400" />
                    <span className="font-bold text-sm font-mono tracking-wider text-blue-400">RELATED PROBLEMS</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {r.related_problems.map((p, i) => {
                        if (typeof p === "string") {
                          return (
                            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                              <div
                                className={`font-semibold ${
                                  isLight ? "text-slate-800" : "text-gray-200"
                                }`}
                              >
                                {p}
                              </div>
                            </div>
                          );
                        }
                        const searchUrl = p.title
                          ? `https://leetcode.com/problemset/all/?search=${encodeURIComponent(p.title)}`
                          : "https://leetcode.com/problemset/all/";
                        const href = p.link || searchUrl;
                        return (
                          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`font-semibold truncate flex items-center gap-1 ${
                                    isLight
                                      ? "text-slate-800 hover:text-cyan-600"
                                      : "text-gray-200 hover:text-cyan-300"
                                  }`}
                                  title="Open on LeetCode"
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
                                </a>
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
                              {p.difficulty && (
                                <span className={`badge border flex-shrink-0 ${
                                  p.difficulty === "Easy" ? "bg-green-400/10 border-green-400/20 text-green-400" :
                                  p.difficulty === "Medium" ? "bg-amber-400/10 border-amber-400/20 text-amber-400" :
                                  "bg-red-400/10 border-red-400/20 text-red-400"
                                }`}>{p.difficulty}</span>
                              )}
                            </div>
                            {p.topic && (
                              <div className="mt-3">
                                <span className="badge bg-blue-400/10 border border-blue-400/20 text-blue-300 text-xs">{p.topic}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}