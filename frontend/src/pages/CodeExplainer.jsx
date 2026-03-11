import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Zap, ChevronDown, ChevronRight, TrendingUp, CheckCircle, XCircle, Route, Code2, Bug, Copy, Check, RotateCcw } from "lucide-react";
import Editor from "@monaco-editor/react";
import api from "../api/axios";
import { saveToHistory } from "../services/historyService";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext";

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

const LANG_MAP = { "C++": "cpp", Python: "python", Java: "java", JavaScript: "javascript", TypeScript: "typescript", Go: "go", Rust: "rust", "C#": "csharp" };

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

export default function CodeExplainer() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("explain");
  const [form, setForm] = useState({ title: "", description: "", code: "", language: user?.preferredLanguage || "C++" });
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("C++");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

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
    if (tabId === "analyze") {
      navigate("/analyzer");
    } else if (tabId === "debug") {
      navigate("/debugger");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
      setForm(f => ({ ...f, code: text }));
      toast.success("Code pasted!");
    } catch (err) {
      toast.error("Failed to paste code");
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setForm(f => ({ ...f, language: newLanguage }));
  };

  const handleResetCode = () => {
    setCode("");
    setForm(f => ({ ...f, code: "" }));
    localStorage.removeItem('code-tools-code');
    // Emit reset event to sync with other editors
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: "", source: 'explainer' } }));
    toast.success("Code reset successfully!");
  };

  const handleTitleChange = (newTitle) => {
    setForm(f => ({ ...f, title: newTitle }));
    localStorage.setItem('code-tools-title', newTitle);
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { title: newTitle, source: 'explainer' } }));
  };

  // Sync code across all editors and persist to localStorage
  const handleCodeChange = (newCode) => {
    const updatedCode = newCode || "";
    setCode(updatedCode);
    setForm(f => ({ ...f, code: updatedCode }));
    // Save to localStorage for persistence
    localStorage.setItem('code-tools-code', updatedCode);
    // Emit event to sync with other editors
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: updatedCode, source: 'explainer' } }));
  };

  // Listen for code sync events from other editors
  useEffect(() => {
    const handleSync = (event) => {
      const { code, title, source } = event.detail || {};
      if (source !== 'explainer') {
        if (typeof code === "string") setCode(code);
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
    if (savedCode && !code) {
      setCode(savedCode);
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
  }, [searchParams]);

  // Restore session when navigating from History ("View in Explain tool")
  useEffect(() => {
    const historyItem = location.state?.historyItem;
    if (location.pathname === "/explainer" && historyItem?.toolType === "explain") {
      setCode(historyItem.codeInput || "");
      setLanguage(historyItem.language || "C++");
      setForm((f) => ({
        ...f,
        code: historyItem.codeInput || "",
        language: historyItem.language || "C++",
        title: historyItem.problemTitle || f.title,
        description: historyItem.problemDescription || f.description,
      }));
      setResult(historyItem.resultOutput ?? null);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const explain = async () => {
    if (!code.trim()) { toast.error("Paste some code first"); return; }
    setLoading(true);
    setResult(null);
    try {
      console.log(`[EXPLAIN] Starting explanation for ${language}`);
      console.log(`[EXPLAIN] Code length: ${code.length}`);
      console.log(`[EXPLAIN] Token exists:`, !!localStorage.getItem("token"));
      
      const res = await api.post("/learn/explain", { code, language });
      const explanationResult = res.data.data;
      
      console.log(`[EXPLAIN] Explanation received:`, explanationResult ? "success" : "failed");
      setResult(explanationResult);

      // Update local user usage counters (keep in sync with backend)
      if (user && updateUser) {
        updateUser({
          ...user,
          dailyUsage: (user.dailyUsage || 0) + 1,
          dailyExplainUsage: (user.dailyExplainUsage || 0) + 1,
        });
      }
      
      // Save to unified history
      try {
        await saveToHistory(
          "explain",
          code,
          language,
          explanationResult,
          form.title || "",
          ""
        );
      } catch (historyError) {
        console.warn("Failed to save to history:", historyError);
        // Don't show error to user, just log it
      }
      
      toast.success("Code explained successfully! 🎉");
    } catch (err) {
      console.error("[EXPLAIN] Explanation error:", err);
      console.error("[EXPLAIN] Error response:", err.response?.data);
      const msg = err.response?.data?.message || "Explanation failed";
      if (err.response?.data?.limitReached) {
        toast.error("Daily limit reached for Code Explain. Upgrade to Pro for unlimited explanations.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto animate-fade-up">
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
                    ? isLight
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg"
                      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg"
                    : isLight
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

      {/* Only show explain content when explain tab is active */}
      {activeTab === "explain" && (
        <>
          {/* Code Input Section */}
          <div className="card mb-6">
            <div className="section-header border-cyan-500/10 bg-cyan-500/[0.03]">
              <Code2 size={15} className="text-cyan-400" />
              <span className="font-bold text-sm text-cyan-400 font-mono tracking-wider">INPUT</span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Two Sum"
                  className="input-field"
                />
              </div>

              {/* Code editor with language picker and copy-paste buttons */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase">Your Code *</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    {/* Language picker */}
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-1 sr-only">Language</label>
                      <LangPicker value={language} onChange={handleLanguageChange} />
                    </div>
                    
                    {/* Action buttons */}
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all w-full sm:w-auto justify-center ${
                      isLight 
                        ? 'bg-gray-100 border-gray-400 shadow-md' 
                        : 'glass border-white/10'
                    }`}>
                      <button
                        onClick={handleCopyCode}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-mono transition-all ${
                          isLight
                            ? 'text-gray-900 hover:text-gray-900 hover:bg-gray-200 font-medium'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                        title="Copy code"
                      >
                        {copied ? <><Check size={11} className="text-green-600" /> Copied</> : <><Copy size={11} /> Copy</>}
                      </button>
                      <div className={`w-px h-4 ${isLight ? 'bg-gray-400' : 'bg-white/10'}`} />
                      <button
                        onClick={handleResetCode}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-mono transition-all ${
                          isLight
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
                    language={LANG_MAP[language] || "cpp"}
                    value={code}
                    onChange={handleCodeChange}
                    theme={theme === "light" ? "vs-light" : "vs-dark"}
                    options={{ fontSize: 13, fontFamily: "JetBrains Mono", lineHeight: 1.7, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, tabSize: 4 }}
                  />
                </div>
              </div>

              <button 
                onClick={explain} 
                disabled={loading} 
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Explaining...</>
                ) : (
                  <><BookOpen size={15} /> Explain This Code</>
                )}
              </button>
            </div>
          </div>

          {/* Result - below editor */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="card p-8 sm:p-10 text-center h-full flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl mb-4">🔍</div>
                <h3 className="font-bold text-lg mb-2">Paste Your Code</h3>
                <p className="text-gray-500 font-mono text-sm">AI will break it down line-by-line in plain English</p>
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {[80, 120, 100, 90].map((h, i) => (
                  <div key={i} className="card animate-pulse" style={{ height: h }}>
                    <div className="h-full rounded-2xl bg-white/[0.03]" />
                  </div>
                ))}
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-fade-up">
                {/* Summary */}
                <div className="card p-4 sm:p-5 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold font-mono text-cyan-400 tracking-wider">
                      SUMMARY
                    </span>
                  </div>
                  <p
                    className={`text-sm font-mono leading-relaxed ${
                      isLight ? "text-slate-800" : "text-gray-200"
                    }`}
                  >
                    {result.summary}
                  </p>
                  {result.algorithm_used && (
                    <div className="mt-3 badge bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs">
                      🔷 {result.algorithm_used}
                    </div>
                  )}
                </div>

                {/* Complexity + Optimal */}
                {(result.time_complexity || result.space_complexity || result.optimal_time_complexity || result.optimal_space_complexity) && (
                  <div className="card">
                    <div className="section-header">
                      <TrendingUp size={14} className="text-cyan-400" />
                      <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">COMPLEXITY</span>
                      {typeof result.is_optimal === "boolean" && (
                        <span className={`ml-auto badge border ${result.is_optimal ? "bg-green-400/10 border-green-400/20 text-green-400" : "bg-amber-400/10 border-amber-400/20 text-amber-400"}`}>
                          {result.is_optimal ? <><CheckCircle size={12} className="mr-1" />Optimal</> : <><XCircle size={12} className="mr-1" />Not optimal</>}
                        </span>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="glass rounded-xl border border-white/10 p-3">
                          <div className="text-[10px] font-mono tracking-wider text-gray-500 mb-1">YOUR CODE • TIME</div>
                          <div className="font-black font-mono text-cyan-300">{result.time_complexity || "—"}</div>
                        </div>
                        <div className="glass rounded-xl border border-white/10 p-3">
                          <div className="text-[10px] font-mono tracking-wider text-gray-500 mb-1">YOUR CODE • SPACE</div>
                          <div className="font-black font-mono text-cyan-300">{result.space_complexity || "—"}</div>
                        </div>
                        <div className="glass rounded-xl border border-white/10 p-3">
                          <div className="text-[10px] font-mono tracking-wider text-gray-500 mb-1">OPTIMAL • TIME</div>
                          <div className="font-black font-mono text-green-300">{result.optimal_time_complexity || "—"}</div>
                        </div>
                        <div className="glass rounded-xl border border-white/10 p-3">
                          <div className="text-[10px] font-mono tracking-wider text-gray-500 mb-1">OPTIMAL • SPACE</div>
                          <div className="font-black font-mono text-green-300">{result.optimal_space_complexity || "—"}</div>
                        </div>
                      </div>
                      {result.optimal_approach && (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div
                            className={`text-xs font-bold font-mono tracking-wider mb-2 ${
                              isLight ? "text-slate-600" : "text-gray-400"
                            }`}
                          >
                            WHY / WHAT TO IMPROVE
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${
                              isLight ? "text-slate-800" : "text-gray-300"
                            }`}
                          >
                            {result.optimal_approach}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step-by-step */}
                {result.steps?.length > 0 && (
                  <div className="card">
                    <div className="section-header">
                      <ChevronRight size={14} className="text-green-400" />
                      <span className="font-bold text-sm font-mono text-green-400 tracking-wider">STEP-BY-STEP BREAKDOWN</span>
                    </div>
                    <div className="p-3 sm:p-4 space-y-3">
                      {result.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 sm:gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 sm:p-4">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center text-xs font-black text-green-400 font-mono flex-shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <div
                              className={`text-xs font-mono mb-1 ${
                                isLight ? "text-slate-500" : "text-gray-500"
                              }`}
                            >
                              Line {step.line_range}
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${
                                isLight ? "text-slate-800" : "text-gray-300"
                              }`}
                            >
                              {step.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Variables */}
                {result.key_variables?.length > 0 && (
                  <div className="card p-4 sm:p-5">
                    <div className="text-xs font-bold font-mono text-amber-400 tracking-wider mb-3">📦 KEY VARIABLES</div>
                    <div className="space-y-2">
                      {result.key_variables.map((v, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <code className="bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded-lg text-xs font-mono flex-shrink-0">{v.name}</code>
                          <p
                            className={`text-xs font-mono leading-relaxed ${
                              isLight ? "text-slate-600" : "text-gray-400"
                            }`}
                          >
                            {v.purpose}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beginner tip */}
                {result.beginner_tip && (
                  <div className="card p-4 bg-purple-400/5 border-purple-400/20">
                    <div className="text-xs font-bold font-mono text-purple-400 mb-2">
                      💡 BEGINNER TIP
                    </div>
                    <p
                      className={`text-sm font-mono leading-relaxed ${
                        isLight ? "text-slate-800" : "text-gray-300"
                      }`}
                    >
                      {result.beginner_tip}
                    </p>
                  </div>
                )}

                {/* Walkthrough */}
                {result.walkthrough && (result.walkthrough.input || result.walkthrough.steps?.length || result.walkthrough.output) && (
                  <div className="card">
                    <div className="section-header">
                      <ChevronRight size={14} className="text-cyan-400" />
                      <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">EXECUTION WALKTHROUGH</span>
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      {result.walkthrough.input && (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div
                            className={`text-xs font-bold font-mono tracking-wider mb-2 ${
                              isLight ? "text-slate-600" : "text-gray-400"
                            }`}
                          >
                            INPUT
                          </div>
                          <pre
                            className={`text-sm font-mono whitespace-pre-wrap ${
                              isLight ? "text-slate-800" : "text-gray-200"
                            }`}
                          >
                            {result.walkthrough.input}
                          </pre>
                        </div>
                      )}
                      {result.walkthrough.steps?.length > 0 && (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div
                            className={`text-xs font-bold font-mono tracking-wider mb-2 ${
                              isLight ? "text-slate-600" : "text-gray-400"
                            }`}
                          >
                            STEPS
                          </div>
                          <div className="space-y-2">
                            {result.walkthrough.steps.map((s, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="badge bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-mono flex-shrink-0">#{i + 1}</span>
                                <p
                                  className={`text-sm leading-relaxed ${
                                    isLight ? "text-slate-800" : "text-gray-300"
                                  }`}
                                >
                                  {s}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.walkthrough.output && (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div
                            className={`text-xs font-bold font-mono tracking-wider mb-2 ${
                              isLight ? "text-slate-600" : "text-gray-400"
                            }`}
                          >
                            OUTPUT
                          </div>
                          <pre
                            className={`text-sm font-mono whitespace-pre-wrap ${
                              isLight ? "text-slate-800" : "text-gray-200"
                            }`}
                          >
                            {result.walkthrough.output}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Flow */}
                {result.flow?.length > 0 && (
                  <div className="card">
                    <div className="section-header">
                      <Route size={14} className="text-amber-400" />
                      <span className="font-bold text-sm font-mono text-amber-400 tracking-wider">ALGORITHM FLOW</span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-2">
                        {result.flow.map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-black font-mono flex items-center justify-center flex-shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                              <span
                                className={isLight ? "text-slate-800" : "text-gray-300"}
                              >
                                {f}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}