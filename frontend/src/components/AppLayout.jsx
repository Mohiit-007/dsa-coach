import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Code2, History, User, LogOut,
  Play, Map, BarChart2, BookOpen, Crown,
  ChevronLeft, ChevronRight, Zap, Target, SunMedium, MoonStar, Calendar, Bug,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard"      },
      { to: "/analyzer",    icon: Code2,           label: "Code Tools"     },
      { to: "/history",     icon: History,         label: "History"        },
    ],
  },
  {
    label: "Practice",
    items: [
      { to: "/practice",       icon: Target,   label: "DSA Practice",  badge: "New" },
      { to: "/mock-interview", icon: Play,     label: "Mock Test" },
      { to: "/learning-path",  icon: Map,      label: "Learning Path"  },
      { to: "/learning-paths", icon: Calendar, label: "My Learning Paths" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/topic-strength", icon: BarChart2, label: "Topic Strength" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", icon: User,  label: "Profile" },
      { to: "/pricing", icon: Crown, label: "Upgrade", badge: "Pro" },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Check if current page is a Code Tools page
  const isCodeToolsActive = location.pathname === "/analyzer" || 
                           location.pathname === "/explainer" || 
                           location.pathname === "/debugger";

  const handleLogout = () => { logout(); navigate("/"); };
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  // Per-tool limits on the free plan
  const TOOL_LIMIT = 10;
  const analyzeUsed = user?.dailyAnalyzeUsage || 0;
  const explainUsed = user?.dailyExplainUsage || 0;
  const debugUsed = user?.dailyDebugUsage || 0;
  const analyzeLeft = Math.max(0, TOOL_LIMIT - analyzeUsed);
  const explainLeft = Math.max(0, TOOL_LIMIT - explainUsed);
  const debugLeft = Math.max(0, TOOL_LIMIT - debugUsed);

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-64"} flex flex-col border-r border-white/[0.06] bg-dark-800/60 backdrop-blur-xl flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-white/[0.06] min-h-[60px]">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-sm shadow-lg shadow-cyan-500/20 flex-shrink-0">
                ⚡
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm tracking-tight whitespace-nowrap">
                  DSA <span className="text-cyan-400">Coach</span>
                </div>
                <div className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">AI Powered</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-sm mx-auto">
              ⚡
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className={`flex-shrink-0 transition-colors p-1.5 rounded-lg ${
                theme === "light"
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
              }`}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <MoonStar size={14} /> : <SunMedium size={14} />}
            </button>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="flex-shrink-0 ml-1 text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div className="text-[9px] font-bold text-gray-600 font-mono tracking-widest uppercase px-3 mb-1.5">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) => {
                      const base = `flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer`;
                      
                      // Check if Code Tools should be active based on current route
                      const isCodeToolsItem = to === "/analyzer";
                      const isCodeToolsRouteActive = location.pathname === "/analyzer" || 
                                                location.pathname === "/explainer" || 
                                                location.pathname === "/debugger";
                      const shouldShowCodeToolsActive = isCodeToolsItem && isCodeToolsRouteActive;
                      
                      if (isActive || shouldShowCodeToolsActive) {
                        // Use same cyan colors for all active items including Code Tools
                        return `${base} ${
                          theme === "light"
                            ? "text-cyan-700 bg-cyan-100 border border-cyan-200"
                            : "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20"
                        }`;
                      }
                      return `${base} ${
                        theme === "light"
                          ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                      }`;
                    }}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        {badge === "New" && (
                          <span className="text-[9px] bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 px-1.5 py-0.5 rounded-full font-mono">
                            NEW
                          </span>
                        )}
                        {badge === "Pro" && user?.plan === "free" && (
                          <span className="text-[9px] bg-amber-400/20 border border-amber-400/30 text-amber-400 px-1.5 py-0.5 rounded-full font-mono">
                            PRO
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade nudge */}
        {!collapsed && (
          <div className="px-3 pb-2">
            {user?.plan === "free" ? (
              <div className="glass rounded-xl p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-500 font-mono">Code tools</span>
                </div>
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>Analyze</span>
                    <span className="text-cyan-400 font-semibold">{analyzeLeft}/10 left</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>Explain</span>
                    <span className="text-blue-400 font-semibold">{explainLeft}/10 left</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>Debug</span>
                    <span className="text-amber-400 font-semibold">{debugLeft}/10 left</span>
                  </div>
                </div>
                <NavLink
                  to="/pricing"
                  className="w-full text-[11px] font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg py-1.5 block hover:brightness-110 transition-all text-center"
                >
                  Upgrade to Pro ✨
                </NavLink>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
                <div className="text-[10px] font-black text-cyan-400 font-mono">✨ PRO PLAN</div>
                <div className="text-[9px] text-gray-500 mt-0.5">Unlimited everything</div>
              </div>
            )}
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-2">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"} px-2 py-2`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{user?.name}</div>
                  <div className="text-[10px] text-gray-500 truncate font-mono">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
                  title="Logout"
                >
                  <LogOut size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="grid-bg min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
