import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/* ---------- Reusable Input Field ---------- */
const Field = ({ name, label, type = "text", placeholder, icon: Icon, form, setForm, errors }) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">
        {label}
      </label>

      <div className="relative">
        <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

        <input
          type={type}
          value={form[name]}
          autoComplete="off"
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              [name]: e.target.value,
            }))
          }
          placeholder={placeholder}
          className={`input-field pl-11 ${
            errors[name] ? "border-red-400/50" : ""
          }`}
        />
      </div>

      {errors[name] && (
        <p className="text-red-400 text-xs mt-1 font-mono">{errors[name]}</p>
      )}
    </div>
  );
};

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});

  /* ---------- Validation ---------- */

  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = "Name required";

    if (!form.email) e.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Invalid email address";

    if (!form.password) e.password = "Password required";
    else if (form.password.length < 6)
      e.password = "Minimum 6 characters";

    if (form.password !== form.confirm)
      e.confirm = "Passwords do not match";

    return e;
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const result = await register(form.name, form.email, form.password);

    if (result?.success) {
      navigate("/dashboard");
    } else if (result?.message) {
      // Show backend error inline; if it's about email, attach to email field
      if (/email/i.test(result.message)) {
        setErrors((prev) => ({ ...prev, email: result.message }));
      } else {
        setErrors((prev) => ({ ...prev, general: result.message }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 grid-bg flex items-center justify-center px-4 py-8">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,211,238,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-xl">
              ⚡
            </div>

            <span className="font-extrabold text-xl tracking-tight">
              DSA <span className="text-cyan-400">Coach</span>
            </span>
          </Link>

          <h1 className="text-2xl font-black tracking-tight">
            Create your account
          </h1>

          <p className="text-gray-500 font-mono text-sm mt-1">
            Start your AI-powered coding journey
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono mb-1">
                {errors.general}
              </div>
            )}

            <Field
              name="name"
              label="Full Name"
              placeholder="Mohit Sahu"
              icon={User}
              form={form}
              setForm={setForm}
              errors={errors}
            />

            <Field
              name="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              form={form}
              setForm={setForm}
              errors={errors}
            />

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  autoComplete="off"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Min. 6 characters"
                  className={`input-field pl-11 pr-11 ${
                    errors.password ? "border-red-400/50" : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {errors.password && (
                <p className="text-red-400 text-xs mt-1 font-mono">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-mono tracking-wider uppercase mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="password"
                  value={form.confirm}
                  autoComplete="off"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      confirm: e.target.value,
                    }))
                  }
                  placeholder="Repeat password"
                  className={`input-field pl-11 ${
                    errors.confirm ? "border-red-400/50" : ""
                  }`}
                />
              </div>

              {errors.confirm && (
                <p className="text-red-400 text-xs mt-1 font-mono">
                  {errors.confirm}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-gray-500 text-sm font-mono">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}