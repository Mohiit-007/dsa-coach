import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Brain, TrendingUp, Code2, ArrowRight, CheckCircle, SunMedium, MoonStar, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

const FEATURES = [
  {
    icon: "🧠",
    title: "AI Code Tools",
    desc: "Analyze, explain, and debug your DSA code in one place with beginner‑friendly guidance.",
  },
  {
    icon: "📊",
    title: "Topic Strength",
    desc: "See which patterns you’re strong or weak at based on all your Analyze, Explain, and Debug runs.",
  },
  {
    icon: "🗺️",
    title: "Learning Paths",
    desc: "Generate day‑by‑day DSA roadmaps tailored to your weak topics and available study time.",
  },
  {
    icon: "📅",
    title: "DSA Practice & POTD",
    desc: "Solve curated DSA problems and a daily Problem of the Day to build a consistent habit.",
  },
  {
    icon: "🎤",
    title: "Mock Interviews & MCQs",
    desc: "Simulated interviews and concept quizzes that mirror real FAANG‑style technical rounds.",
  },
  {
    icon: "📁",
    title: "History & Bookmarks",
    desc: "Searchable history for every AI session with bookmarks so you never lose an important insight.",
  },
];

const STATS = [
  { value: "3", label: "AI Code Tools" },
  { value: "8", label: "Languages Supported" },
  { value: "20+", label: "Patterns Tracked" },
  { value: "30", label: "Free AI Runs / Day" },
];

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    color: "from-gray-500/10 to-gray-600/10",
    border: "border-white/10",
    features: [
      "Up to 30 AI runs/day (10 per tool)",
      "Analyze, Explain & Debug tools",
      "Topic Strength & basic dashboard",
      "History (last 20) sessions",
    ],
    cta: "Get Started",
    ctaStyle: "btn-secondary w-full justify-center",
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    color: "from-cyan-500/10 to-blue-600/10",
    border: "border-cyan-500/30",
    badge: "Most Popular",
    features: [
      "Unlimited AI runs across all tools",
      "Advanced topic analytics & insights",
      "Full history with bookmarks",
      "All 8 languages unlocked",
      "Learning path generator",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    ctaStyle: "btn-primary w-full justify-center",
  },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const [openStep, setOpenStep] = useState("01");

  return (
    <div
      className={`min-h-screen font-sans overflow-x-hidden transition-colors duration-300 ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-dark-900 text-white"
      }`}
    >
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-60 pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(191,219,254,0.7) 0%, transparent 60%)"
            : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Navbar */}
      <nav
        className={`relative z-10 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-sm transition-colors ${
          isLight ? "border-b border-slate-200/70 bg-white/70" : "border-b border-white/[0.06] bg-dark-900/70"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/25">
            ⚡
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            DSA <span className="text-cyan-500">Coach</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`hidden sm:inline-flex items-center justify-center rounded-full border text-xs font-medium px-3 py-1.5 transition-colors ${
              isLight
                ? "border-slate-200 bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
          >
            {isLight ? <MoonStar size={14} /> : <SunMedium size={14} />}
          </button>
          <Link to="/login" className="btn-secondary text-sm py-2 px-4">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-5">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 badge bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-6">
          <Zap size={12} />
          <span>AI-Powered · DSA · Interview Prep</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Master DSA with
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400" style={{ backgroundSize: "200% auto", animation: "shimmer 3s linear infinite" }}>
            AI Coaching
          </span>
        </h1>
        <p
          className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-mono ${
            isLight ? "text-slate-600" : "text-gray-400"
          }`}
        >
          Analyze, explain, and debug your DSA code, discover weak topics, generate learning paths, and practice interviews — all in one AI‑powered coach.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
            Start Coding Smarter <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div
              key={s.label}
              className={`glass rounded-2xl py-5 px-4 ${
                isLight ? "bg-white/80 border border-slate-200 shadow-sm" : ""
              }`}
            >
              <div className="text-3xl font-black text-cyan-500">{s.value}</div>
              <div className={`text-xs font-mono mt-1 ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-cyan-500 tracking-widest uppercase mb-3">Features</div>
          <h2 className="text-4xl font-black tracking-tight">
            Everything you need to <span className="text-cyan-500">level up</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className={`glass-hover rounded-2xl p-6 group ${
                isLight ? "bg-white/80 border border-slate-200 shadow-sm" : ""
              }`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-500 transition-colors">{f.title}</h3>
              <p
                className={`text-sm leading-relaxed font-mono ${
                  isLight ? "text-slate-600" : "text-gray-400"
                }`}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-cyan-500 tracking-widest uppercase mb-3">How It Works</div>
          <h2 className="text-4xl font-black tracking-tight">Three steps to mastery</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              n: "01",
              title: "Paste your solution",
              desc: "Open Code Tools and paste your DSA code in any supported language.",
              icon: Code2,
            },
            {
              n: "02",
              title: "Pick the right tool",
              desc: "Use Analyze to check optimality, Explain to understand code, or Debug to fix bugs instantly.",
              icon: Brain,
            },
            {
              n: "03",
              title: "Master topics with Topic Strength",
              desc: "Review your Topic Strength dashboard to see which patterns you solve well and where you struggle.",
              icon: TrendingUp,
            },
            {
              n: "04",
              title: "Follow your Learning Path",
              desc: "Generate a personalized DSA learning path from your weak topics and follow the day‑by‑day plan.",
              icon: TrendingUp,
            },
          ].map(step => {
            const isOpen = openStep === step.n;
            return (
              <button
                key={step.n}
                type="button"
                onClick={() => setOpenStep(prev => (prev === step.n ? "" : step.n))}
                className={`w-full text-left rounded-2xl px-5 py-4 transition-all border ${
                  isLight
                    ? "bg-white/90 border-slate-200 hover:border-cyan-300 hover:shadow-md"
                    : "bg-dark-800/80 border-white/10 hover:border-cyan-400/40"
                } ${isOpen ? "shadow-lg ring-1 ring-cyan-400/70" : "shadow-sm"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl sm:text-3xl font-black text-cyan-500/60 font-mono w-10 sm:w-12 flex-shrink-0">
                      {step.n}
                    </div>
                    <div>
                      <div className="font-bold text-base sm:text-lg">{step.title}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono ${
                    isLight ? "text-slate-500" : "text-gray-400"
                  }`}>
                    <span>{isOpen ? "Hide" : "Show"}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </div>
                </div>
                {isOpen && (
                  <div className="overflow-hidden">
                    <p
                      className={`mt-3 font-mono text-sm leading-relaxed ${
                        isLight ? "text-slate-600" : "text-gray-300"
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-cyan-500 tracking-widest uppercase mb-3">Pricing</div>
          <h2 className="text-4xl font-black tracking-tight">Simple, transparent pricing</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 bg-gradient-to-br ${
                isLight
                  ? plan.name === "Pro"
                    ? "from-cyan-100 to-blue-100 border-cyan-200 shadow-md"
                    : "from-slate-50 to-slate-100 border-slate-200 shadow-sm"
                  : `${plan.border} ${plan.color}`
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-cyan-400 text-black font-bold px-4">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <div className="font-bold text-xl mb-1">{plan.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span
                    className={`mb-1 font-mono ${
                      isLight ? "text-slate-500" : "text-gray-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm font-mono">
                    <CheckCircle size={15} className="text-cyan-500 flex-shrink-0" />
                    <span className={isLight ? "text-slate-700" : "text-gray-300"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all ${plan.name === "Pro" ? "btn-primary" : "btn-secondary"}`}>
                {plan.cta} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        <div
          className={`glass rounded-3xl p-12 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 ${
            isLight ? "border border-cyan-200 bg-white/90 shadow-lg" : "border border-cyan-500/20"
          }`}
        >
          <h2 className="text-4xl font-black tracking-tight mb-4">
            Ready to crack your next interview?
          </h2>
          <p
            className={`font-mono text-sm mb-8 ${
              isLight ? "text-slate-600" : "text-gray-400"
            }`}
          >
            Join thousands of developers who improved their DSA skills with AI coaching.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
            Start for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 py-8 text-center font-mono text-xs transition-colors ${
          isLight ? "border-t border-slate-200 text-slate-500 bg-white/80" : "border-t border-white/[0.06] text-gray-600"
        }`}
      >
        <p>© 2024 DSA AI Coach · Built by Mohit Sahu · Powered by Claude AI</p>
      </footer>
    </div>
  );
}
