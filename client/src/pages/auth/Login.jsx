import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  MapPin,
  Home,
  Building2,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";

// ── Zod schema (unchanged) ─────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── Animation variants ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.09,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ═══════════════════════════════════════════════════════════════════════
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ── React Hook Form + Zod (unchanged) ─────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // ── Submit handler (unchanged) ─────────────────────────────────────
  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      toast.success(`Welcome back, ${data.user.name}!`);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── LEFT PANEL — Branding ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923] overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,22,0.20) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />
        </div>

        {/* Logo */}
        <Link to="/" className="relative inline-flex items-center gap-2.5 z-10">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-white font-heading font-bold text-xl">M</span>
          </div>
          <span className="font-heading font-bold text-2xl text-white">
            Move<span className="text-accent">Mate</span>
          </span>
        </Link>

        {/* Center — Headline */}
        <motion.div
          className="relative z-10"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.p
            variants={fadeUp}
            className="text-accent font-semibold text-sm uppercase tracking-widest mb-4"
          >
            Your Relocation Companion
          </motion.p>

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl xl:text-5xl font-heading font-bold text-white leading-[1.1]"
          >
            Find a home <br />
            <span
              style={{
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundImage:
                  "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)",
              }}
            >
              you'll love.
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-slate-400 mt-5 text-base leading-relaxed max-w-sm"
          >
            Verified rentals across Bangladesh with nearby essentials and 24/7
            emergency contacts — all in one platform.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-col gap-3 mt-9"
          >
            {[
              { icon: Building2, text: "100+ Verified Listings" },
              { icon: MapPin, text: "Dhaka, Chittagong, Sylhet & more" },
              { icon: Shield, text: "24/7 Emergency Help" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-accent" />
                </div>
                <span className="text-slate-400 text-sm">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom floating card */}
        <motion.div
          className="relative z-10 flex items-center gap-4 bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center shrink-0 shadow-lg">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              Ready to find your home?
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              Join thousands relocating with MoveMate
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — Form ───────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <motion.div
          className="w-full max-w-[420px]"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {/* Mobile logo */}
          <motion.div variants={fadeUp} className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">
                  M
                </span>
              </div>
              <span className="font-heading font-bold text-xl text-gray-900">
                Move<span className="text-accent">Mate</span>
              </span>
            </Link>
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Welcome back
            </h1>
            <p className="text-muted mt-1.5 text-sm">
              Sign in to continue to your account
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <motion.div variants={fadeUp} custom={2}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`input-field transition-all duration-200 ${
                    errors.email
                      ? "border-danger focus:ring-danger/20"
                      : "focus:border-accent focus:ring-accent/15"
                  }`}
                  {...register("email")}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-danger text-xs mt-1.5 flex items-center gap-1"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp} custom={3}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`input-field pr-11 transition-all duration-200 ${
                      errors.password
                        ? "border-danger focus:ring-danger/20"
                        : "focus:border-accent focus:ring-accent/15"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-danger text-xs mt-1.5"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp} custom={4} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Loader2 size={17} />
                    </motion.div>
                  ) : (
                    <LogIn size={17} />
                  )}
                  {loading ? "Signing in..." : "Sign In"}
                </motion.button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-muted mt-5">
              Don't have an account?{" "}
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                Create one
              </Link>
            </p>
          </motion.div>

          {/* Demo accounts */}
          <motion.div
            variants={fadeUp}
            custom={5}
            className="mt-5 bg-blue-50 rounded-2xl p-4 border border-blue-100"
          >
            <p className="text-xs font-bold text-blue-700 mb-2">
              🔑 Demo Accounts
            </p>
            <div className="space-y-1">
              <p className="text-xs text-blue-600">
                <span className="font-semibold">Owner:</span>{" "}
                owner1@dummyinbox.com / Test@1234
              </p>
              <p className="text-xs text-blue-600">
                <span className="font-semibold">User:</span>{" "}
                user1@dummyinbox.com / Test@1234
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
