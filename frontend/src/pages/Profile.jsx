import { useEffect, useState } from "react";
import { User, Mail, Code2, Github, Linkedin, Save, Zap, Trophy, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

const LANGUAGES = ["C++", "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C#"];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    preferredLanguage: user?.preferredLanguage || "C++",
    bio: user?.bio || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState(null);
  const [historyStats, setHistoryStats] = useState(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [analysisRes, historyRes] = await Promise.all([
          api.get("/analysis/stats/overview"),
          api.get("/history/stats"),
        ]);
        setStats(analysisRes.data.data);
        setHistoryStats(historyRes.data.data);
      } catch {
        // Non-blocking: profile page should still load even if stats fail
      }
    };

    fetchStats();
  }, []);

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", form);
      updateUser(res.data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  // Prefer live user.problemsSolved so it updates instantly when problems are marked solved
  const dsaSolved = user?.problemsSolved ?? stats?.dsaSolved ?? 0;

  // Prefer unified History stats for total analyses so it matches the History page.
  const totalAnalysesFromHistory =
    historyStats?.toolStats?.find((t) => t._id === "analyze")?.count ?? null;

  const totalAnalyses =
    user?.totalAnalyses ??
    totalAnalysesFromHistory ??
    stats?.total ??
    0;

  const STATS = [
    { label: "Total Analyses",      value: totalAnalyses,             icon: Code2,  color: "text-cyan-400",   bg: "bg-cyan-400/10"   },
    { label: "DSA Problems Solved", value: dsaSolved,                  icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10"  },
    { label: "DSA Streak (days)",   value: user?.streak || 0,          icon: Zap,    color: "text-green-400", bg: "bg-green-400/10"  },
    { label: "Member Since",        value: new Date(user?.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), icon: Calendar, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6 sm:mb-7">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">Your <span className="text-cyan-400">Profile</span></h1>
        <p className="text-gray-500 font-mono text-xs sm:text-sm">Manage your account and preferences</p>
      </div>

      {/* Profile card header */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-16 sm:h-20 bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100" />
        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="-mt-8 sm:-mt-10 mb-4 flex items-end justify-between">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-xl border-4 border-white">
              {initials}
            </div>
            <span
              className={`badge ${
                user?.plan === "pro"
                  ? "bg-cyan-100 border-cyan-200 text-cyan-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              {user?.plan === "pro" ? "✨ PRO" : "FREE"}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {user?.name}
          </h2>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            {user?.email}
          </p>
          {user?.bio && (
            <p className="text-gray-500 text-sm mt-2">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {STATS.map(s => (
          <div key={s.label} className="card p-3 sm:p-4">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2 sm:mb-3`}>
              <s.icon size={14} className={s.color} />
            </div>
            <div className={`text-xl sm:text-2xl font-black ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 font-mono">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 glass rounded-xl p-1 w-fit">
        {["profile", "preferences"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all capitalize ${activeTab === tab ? "bg-cyan-400/15 border border-cyan-400/25 text-cyan-400" : "text-gray-500 hover:text-gray-300"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="card">
          <div className="section-header">
            <User size={15} className="text-cyan-400" />
            <span className="font-bold text-sm font-mono tracking-wider text-cyan-400">EDIT PROFILE</span>
          </div>
          <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field pl-9" placeholder="Your full name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={user?.email} disabled className="input-field pl-9 opacity-50 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} maxLength={200}
                placeholder="Tell us about yourself..." className="input-field resize-none" />
              <div className="text-right text-xs text-gray-600 font-mono mt-1">{form.bio.length}/200</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">GitHub</label>
                <div className="relative">
                  <Github size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="github.com/username" className="input-field pl-9" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">LinkedIn</label>
                <div className="relative">
                  <Linkedin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/username" className="input-field pl-9" />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={15} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "preferences" && (
        <div className="card">
          <div className="section-header">
            <Code2 size={15} className="text-cyan-400" />
            <span className="font-bold text-sm font-mono tracking-wider text-cyan-400">PREFERENCES</span>
          </div>
          <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-3">Preferred Language</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map((lang) => {
                  const active = form.preferredLanguage === lang;
                  const base =
                    "py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all";
                  const cls = active
                    ? isLight
                      ? "bg-cyan-100 border-cyan-300 text-cyan-700"
                      : "bg-cyan-400/15 border-cyan-400/30 text-cyan-400"
                    : isLight
                      ? "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      : "glass text-gray-400 hover:text-white";
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, preferredLanguage: lang }))
                      }
                      className={`${base} ${cls}`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Saving...</> : <><Save size={15} /> Save Preferences</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}