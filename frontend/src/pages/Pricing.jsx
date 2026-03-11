import { CheckCircle, Zap, Crown, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "/month",
    icon: "🆓",
    color: "border-white/10",
    headerBg: "bg-white/[0.03]",
    features: [
      { text: "Up to 30 AI actions/day (10 per tool)", available: true },
      { text: "Basic complexity analysis", available: true },
      { text: "3 hints per problem", available: true },
      { text: "Last 20 analyses history", available: true },
      { text: "C++, Python, Java", available: true },
      { text: "Mock Interview (2/day)", available: false },
      { text: "Learning Path Generator", available: false },
      { text: "Topic Strength Analyzer", available: false },
      { text: "Unlimited history", available: false },
      { text: "All 8 languages", available: false },
    ],
    cta: "Current Plan",
    ctaDisabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/month",
    icon: "⚡",
    color: "border-cyan-500/40",
    headerBg: "bg-gradient-to-br from-cyan-500/10 to-blue-600/10",
    badge: "Most Popular",
    features: [
      { text: "Unlimited AI analyses", available: true },
      { text: "Advanced complexity analysis", available: true },
      { text: "Unlimited hints", available: true },
      { text: "Full history + bookmarks", available: true },
      { text: "All 8 languages", available: true },
      { text: "Unlimited Mock Interviews", available: true },
      { text: "AI Learning Path Generator", available: true },
      { text: "Topic Strength Analyzer", available: true },
      { text: "Code explanation tool", available: true },
      { text: "Priority support", available: true },
    ],
    cta: "Upgrade to Pro",
    ctaStyle: "btn-primary",
    highlighted: true,
  },
];

const FAQ = [
  { q: "When does the free limit reset?", a: "Every day at midnight IST. You get 10 fresh runs per tool (Analyze, Explain, Debug) every 24 hours." },
  { q: "Can I cancel Pro anytime?", a: "Yes, you can cancel your Pro subscription at any time. No lock-in periods." },
  { q: "What payment methods are accepted?", a: "We accept all major cards, UPI, Net Banking via Razorpay/Stripe." },
  { q: "Is my code stored securely?", a: "Yes, all code and analyses are encrypted and stored securely in our database." },
  { q: "Which AI model powers the analysis?", a: "We use Claude Sonnet (Anthropic) for all code analysis and generation." },
];

export default function Pricing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleUpgrade = () => {
    toast("Payment integration coming soon! 🚀\nContact: support@leetcodecoach.dev", { icon: "💳", duration: 4000 });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 mb-4">
          <Crown size={12} /><span>Pricing Plans</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">
          Simple, <span className="text-cyan-400">transparent</span> pricing
        </h1>
        <p className="text-gray-500 font-mono text-sm max-w-md mx-auto">
          Start free, upgrade when you need more. No hidden fees, no surprises.
        </p>
      </div>

      {/* Current plan banner */}
      {user && (
        <div
          className={`mb-8 card p-4 flex items-center gap-3 border ${
            user.plan === "pro" ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/10"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
              user.plan === "pro" ? "bg-cyan-400/15" : "bg-white/[0.05]"
            }`}
          >
            {user.plan === "pro" ? "⚡" : "🆓"}
          </div>
          <div>
            <div
              className={`font-bold text-sm ${
                isLight ? "text-slate-900" : "text-gray-100"
              }`}
            >
              You're on the{" "}
              <span
                className={
                  user.plan === "pro"
                    ? isLight
                      ? "text-cyan-600"
                      : "text-cyan-400"
                    : isLight
                      ? "text-slate-800"
                      : "text-gray-100"
                }
              >
                {user.plan === "pro" ? "Pro" : "Free"}
              </span>{" "}
              plan
            </div>
            <div
              className={`text-xs font-mono ${
                isLight ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {user.plan === "free"
                ? `${Math.max(0, 30 - (user.dailyUsage || 0))} AI actions remaining today`
                : "Unlimited analyses · All features unlocked"}
            </div>
          </div>
          {user.plan === "pro" && <div className="ml-auto badge bg-cyan-400/15 border border-cyan-400/30 text-cyan-400">✨ Active</div>}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`relative card border ${plan.color} ${
              plan.highlighted ? "shadow-2xl shadow-cyan-500/10" : ""
            } overflow-hidden`}
          >
            {plan.badge && (
              <div className="absolute top-0 right-0 bg-cyan-400 text-black text-[10px] font-black px-4 py-1 rounded-bl-xl tracking-wider">
                {plan.badge}
              </div>
            )}
            <div className={`p-6 ${plan.headerBg} border-b border-white/[0.06]`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{plan.icon}</div>
                <div>
                  <div
                    className={`font-black text-xl ${
                      isLight ? "text-slate-900" : "text-gray-50"
                    }`}
                  >
                    {plan.name}
                  </div>
                  <div
                    className={`text-xs font-mono ${
                      isLight ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    Plan
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span
                  className={`text-5xl font-black ${
                    isLight ? "text-slate-900" : "text-gray-50"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`mb-2 font-mono text-sm ${
                    isLight ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
            </div>

            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-3 text-sm ${
                      f.available
                        ? isLight
                          ? "text-slate-800"
                          : "text-gray-100"
                        : isLight
                          ? "text-gray-500"
                          : "text-gray-500"
                    }`}
                  >
                    <CheckCircle
                      size={14}
                      className={
                        f.available
                          ? "text-cyan-500 flex-shrink-0"
                          : "text-gray-400 flex-shrink-0"
                      }
                    />
                    <span className={f.available ? "" : "line-through"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "free" && user?.plan === "free" ? (
                <button disabled className="w-full py-3 rounded-xl border border-white/10 text-gray-500 text-sm font-semibold cursor-not-allowed">
                  Current Plan
                </button>
              ) : plan.id === "pro" && user?.plan === "pro" ? (
                <button disabled className="w-full py-3 rounded-xl border border-cyan-400/30 text-cyan-400 text-sm font-semibold cursor-not-allowed bg-cyan-400/10">
                  ✓ Active Plan
                </button>
              ) : (
                <button onClick={handleUpgrade} className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta} {plan.highlighted && <ArrowRight size={14} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feature comparison */}
      <div className="card mb-10">
        <div className="section-header">
          <Zap size={14} className="text-cyan-400" />
          <span className="font-bold text-sm font-mono text-cyan-400 tracking-wider">FEATURE COMPARISON</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-mono text-slate-600 tracking-wider">
                  FEATURE
                </th>
                <th className="text-center px-5 py-3 text-xs font-mono text-slate-500 tracking-wider">
                  FREE
                </th>
                <th className="text-center px-5 py-3 text-xs font-mono text-cyan-600 tracking-wider">
                  PRO ⚡
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                ["Daily AI Analyses", "10 / day", "Unlimited"],
                ["Code Analysis", "Basic", "Advanced"],
                ["Mock Interviews", "2 / day", "Unlimited"],
                ["Learning Path", "❌", "✅"],
                ["Topic Strength", "❌", "✅"],
                ["History", "20 entries", "Unlimited"],
                ["Languages", "3", "8"],
                ["Code Execution", "❌", "✅"],
                ["Support", "Community", "Priority"],
              ].map(([feat, free, pro]) => (
                <tr key={feat} className="hover:bg-white/[0.01] transition-colors">
                  <td
                    className={`px-5 py-3 text-sm ${
                      isLight ? "text-slate-700" : "text-gray-300"
                    }`}
                  >
                    {feat}
                  </td>
                  <td
                    className={`px-5 py-3 text-center text-sm font-mono ${
                      isLight ? "text-slate-600" : "text-gray-500"
                    }`}
                  >
                    {free}
                  </td>
                  <td
                    className={`px-5 py-3 text-center text-sm font-mono ${
                      isLight ? "text-cyan-600" : "text-cyan-400"
                    }`}
                  >
                    {pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-center mb-6">Frequently Asked <span className="text-cyan-400">Questions</span></h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {FAQ.map((f, i) => (
            <details key={i} className="card group">
              <summary className="p-5 font-semibold text-sm cursor-pointer list-none flex items-center justify-between hover:text-cyan-400 transition-colors">
                {f.q}
                <ArrowRight size={14} className="text-gray-500 group-open:rotate-90 transition-transform flex-shrink-0 ml-2" />
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-400 font-mono leading-relaxed border-t border-white/[0.04] pt-3">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
