import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Please enter your email address";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) e.email = "Please enter a valid email address";

    if (!form.password) e.password = "Please enter your password";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      navigate("/dashboard");
    } else if (result?.message) {
      // Prefer field‑specific errors when possible, otherwise show a general banner
      const msg = result.message;
      if (/email/i.test(msg)) {
        setErrors(prev => ({ ...prev, email: msg }));
      } else if (/password/i.test(msg)) {
        setErrors(prev => ({ ...prev, password: msg }));
      } else {
        setErrors(prev => ({ ...prev, general: msg || "Incorrect email or password" }));
      }
    } else {
      setErrors(prev => ({ ...prev, general: "Unable to sign in. Please try again." }));
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 grid-bg flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,211,238,0.07) 0%, transparent 60%)" }} />

        <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/25">⚡</div>
            <span className="font-extrabold text-xl tracking-tight">DSA <span className="text-cyan-400">Coach</span></span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight">Welcome back</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">Sign in to continue your practice</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono mb-1">
                {errors.general}
              </div>
            )}
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => {
                    const value = e.target.value;
                    setForm(f => ({ ...f, email: value }));
                    if (errors.email || errors.general) {
                      setErrors(err => ({ ...err, email: "", general: "" }));
                    }
                  }}
                  placeholder="you@example.com"
                  className={`input-field pl-11 ${errors.email ? "border-red-400/50 focus:border-red-400/50" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 font-mono">
                  <span className="text-base leading-none">⚠ </span>
                  {errors.email}
              </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={e => {
                    const value = e.target.value;
                    setForm(f => ({ ...f, password: value }));
                    if (errors.password || errors.general) {
                      setErrors(err => ({ ...err, password: "", general: "" }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`input-field pl-11 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden ${
                    errors.confirm ? "border-red-400/50" : ""
                  }`}
                />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-red-400 text-xs mt-1.5 font-mono">
                  <span className="text-base leading-none">⚠</span>
                  {errors.password}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-gray-500 text-sm font-mono">
              Don't have an account?{" "}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-xs font-mono">
            Demo: demo@test.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
}