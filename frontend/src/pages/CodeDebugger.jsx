import { useRef, useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Bug, ChevronDown, BookOpen, AlertTriangle, Code2, Copy, Check, RotateCcw } from "lucide-react";
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

const LANG_MAP = {
  "C++": "cpp",
  Python: "python",
  Java: "java",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Go: "go",
  Rust: "rust",
  "C#": "csharp",
};

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

export default function CodeDebugger() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("debug");
  const [form, setForm] = useState({ title: "", description: "", code: "", language: user?.preferredLanguage || "C++" });
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("C++");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
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
    } else if (tabId === "explain") {
      navigate("/explainer");
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
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: "", source: 'debugger' } }));
    toast.success("Code reset successfully!");
  };

  const handleTitleChange = (newTitle) => {
    setForm(f => ({ ...f, title: newTitle }));
    localStorage.setItem('code-tools-title', newTitle);
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { title: newTitle, source: 'debugger' } }));
  };

  // Sync code across all editors and persist to localStorage
  const handleCodeChange = (newCode) => {
    const updatedCode = newCode || "";
    setCode(updatedCode);
    setForm(f => ({ ...f, code: updatedCode }));
    // Save to localStorage for persistence
    localStorage.setItem('code-tools-code', updatedCode);
    // Emit event to sync with other editors
    window.dispatchEvent(new CustomEvent('code-tools-sync', { detail: { code: updatedCode, source: 'debugger' } }));
  };

  // Listen for code sync events from other editors
  useEffect(() => {
    const handleSync = (event) => {
      const { code, title, source } = event.detail || {};
      if (source !== 'debugger') {
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

  // Restore session when navigating from History ("View in Debug tool")
  useEffect(() => {
    const historyItem = location.state?.historyItem;
    if (location.pathname === "/debugger" && historyItem?.toolType === "debug") {
      const codeStr = historyItem.codeInput || "";
      setCode(codeStr);
      setLanguage(historyItem.language || "C++");
      setForm((f) => ({
        ...f,
        code: codeStr,
        language: historyItem.language || "C++",
        title: historyItem.problemTitle || f.title,
        description: historyItem.problemDescription || f.description,
      }));
      const output = historyItem.resultOutput;
      setResult(output ?? null);
      if (output?.issues?.length) {
        setTimeout(() => applyDecorations(output.issues), 150);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const applyDecorations = (issues) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecos = issues.map((issue) => {
      const line = issue.line && issue.line > 0 ? issue.line : 1;
      return {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "code-debug-error-line",
          glyphMarginClassName: "code-debug-error-glyph",
          hoverMessage: { value: issue.message || "Issue" },
        },
      };
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecos);
  };

  const clearDecorations = () => {
    const editor = editorRef.current;
    if (!editor || !decorationsRef.current.length) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
  };

  const debugCode = async () => {
    if (!code.trim()) {
      toast.error("Paste some code first");
      return;
    }
    setLoading(true);
    setResult(null);
    clearDecorations();
    try {
      console.log(`[DEBUG] Starting debug for ${language}`);
      console.log(`[DEBUG] Code length: ${code.length}`);
      console.log(`[DEBUG] Token exists:`, !!localStorage.getItem("token"));
      
      const res = await api.post("/analysis/debug", {
        userCode: code,
        language,
      });
      const debugResult = res.data.data;
      
      console.log(`[DEBUG] Debug result received:`, debugResult ? "success" : "failed");
      setResult(debugResult);

      // Update local user usage counters (keep in sync with backend)
      if (user && updateUser) {
        updateUser({
          ...user,
          dailyUsage: (user.dailyUsage || 0) + 1,
          dailyDebugUsage: (user.dailyDebugUsage || 0) + 1,
        });
      }
      
      // Save to unified history
      try {
        await saveToHistory(
          "debug",
          code,
          language,
          debugResult,
          form.title || "",
          ""
        );
      } catch (historyError) {
        console.warn("Failed to save to history:", historyError);
        // Don't show error to user, just log it
      }
      
      if (Array.isArray(debugResult.issues) && debugResult.issues.length) {
        applyDecorations(debugResult.issues);
        toast.success("Found a few things to fix 🐞");
      } else {
        toast.success("No obvious bugs detected");
      }
    } catch (err) {
      console.error("[DEBUG] Debug error:", err);
      console.error("[DEBUG] Error response:", err.response?.data);
      const msg = err.response?.data?.message || "Debugging failed";
      if (err.response?.data?.limitReached) {
        toast.error("Daily limit reached for Code Debug. Upgrade to Pro for unlimited debugging.");
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

      {/* Only show debug content when debug tab is active */}
      {activeTab === "debug" && (
        <>
          {/* Code Input Section */}
          <div className="card mb-6">
            <div className="section-header border-red-500/10 bg-red-500/[0.03]">
              <Bug size={15} className="text-red-400" />
              <span className="font-bold text-sm text-red-400 font-mono tracking-wider">INPUT</span>
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
                    onMount={handleEditorMount}
                    options={{
                      fontSize: 13,
                      fontFamily: "JetBrains Mono",
                      lineHeight: 1.7,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                      tabSize: 4,
                      glyphMargin: true,
                    }}
                  />
                </div>
              </div>

              <button 
                onClick={debugCode} 
                disabled={loading} 
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Debugging...</>
                ) : (
                  <><Bug size={15} /> Debug My Code</>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-4">
            {!result && !loading && (
              <div className="card p-8 sm:p-10 text-center">
                <div className="text-4xl sm:text-5xl mb-4">🐛</div>
                <h3 className="font-bold text-lg mb-2">No debug run yet</h3>
                <p className="text-gray-500 font-mono text-sm">
                  Paste your code above and we&apos;ll highlight suspicious lines and explain what&apos;s
                  wrong.
                </p>
              </div>
            )}

            {loading && (
              <div className="space-y-3">
                {[90, 110, 80].map((h, i) => (
                  <div key={i} className="card animate-pulse" style={{ height: h }}>
                    <div className="h-full rounded-2xl bg-white/[0.03]" />
                  </div>
                ))}
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-fade-up">
                {/* Summary */}
                {result.summary && (
                  <div className="card p-4 sm:p-5 bg-gradient-to-br from-red-500/5 to-amber-500/5 border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-xs font-bold font-mono text-red-400 tracking-wider">
                        DEBUG SUMMARY
                      </span>
                    </div>
                    <p
                      className={`text-sm font-mono leading-relaxed ${
                        isLight ? "text-slate-800" : "text-gray-200"
                      }`}
                    >
                      {result.summary}
                    </p>
                  </div>
                )}

                {/* Issues list */}
                {Array.isArray(result.issues) && result.issues.length > 0 && (
                  <div className="card">
                    <div className="section-header">
                      <Bug size={14} className="text-red-400" />
                      <span className="font-bold text-sm font-mono text-red-400 tracking-wider">
                        ISSUES FOUND
                      </span>
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      {result.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 sm:p-4 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono text-red-300">
                              Line <span className="font-semibold">{issue.line}</span>
                            </span>
                            <span className="badge bg-red-500/15 border border-red-500/30 text-[10px] text-red-300">
                              {issue.type || "Issue"}
                            </span>
                          </div>
                          <p
                            className={`text-sm font-mono ${
                              isLight ? "text-slate-800" : "text-gray-200"
                            }`}
                          >
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <p
                              className={`text-xs font-mono ${
                                isLight ? "text-slate-600" : "text-gray-400"
                              }`}
                            >
                              Fix: {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fixed code */}
                {result.fixed_code && (
                  <div className="card p-4 sm:p-5">
                    <div className="text-xs font-bold font-mono text-cyan-400 tracking-wider mb-2">
                      SUGGESTED FIXED CODE
                    </div>
                    <pre
                      className={`text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto rounded-xl border px-3 py-3 ${
                        isLight
                          ? "bg-slate-50 border-slate-200 text-slate-800"
                          : "bg-white/[0.02] border-white/[0.08] text-gray-100"
                      }`}
                    >
                      {result.fixed_code}
                    </pre>
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

