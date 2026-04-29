// // =============================================
// // Register Page — Role Selection + React Hook Form + Zod
// // =============================================

// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Eye, EyeOff, UserPlus, Loader2, User, Building2 } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { authAPI } from '../../api/auth.api';

// const registerSchema = z.object({
//   name: z.string().min(2, 'Name must be at least 2 characters'),
//   email: z.string().email('Enter a valid email'),
//   phone: z.string().optional(),
//   password: z.string().min(6, 'Password must be at least 6 characters'),
//   confirmPassword: z.string(),
// }).refine((data) => data.password === data.confirmPassword, {
//   message: 'Passwords do not match',
//   path: ['confirmPassword'],
// });

// export default function Register() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [selectedRole, setSelectedRole] = useState('user');
//   const navigate = useNavigate();

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({
//     resolver: zodResolver(registerSchema),
//   });

//   const onSubmit = async (formData) => {
//     setLoading(true);
//     try {
//       const { data } = await authAPI.register({
//         name: formData.name,
//         email: formData.email,
//         phone: formData.phone || undefined,
//         password: formData.password,
//         role: selectedRole,
//       });

//       toast.success(`Welcome to MoveMate, ${data.data?.user?.name || formData.name}!`);
//       navigate('/', { replace: true });
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
//       <div className="w-full max-w-md">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <Link to="/" className="inline-flex items-center gap-2 mb-6">
//             <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
//               <span className="text-white font-heading font-bold text-xl">M</span>
//             </div>
//             <span className="font-heading font-bold text-2xl text-primary">
//               Move<span className="text-accent">Mate</span>
//             </span>
//           </Link>
//           <h1 className="text-2xl font-heading font-bold text-gray-900">Create your account</h1>
//           <p className="text-muted mt-1">Join MoveMate and start exploring</p>
//         </div>

//         {/* Form Card */}
//         <div className="bg-white rounded-2xl shadow-elevated p-8">
//           {/* Role Selector */}
//           <div className="mb-6">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               I want to
//             </label>
//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 type="button"
//                 onClick={() => setSelectedRole('user')}
//                 className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
//                   selectedRole === 'user'
//                     ? 'border-primary bg-primary/5 text-primary'
//                     : 'border-border text-gray-500 hover:border-gray-300'
//                 }`}
//               >
//                 <User size={18} />
//                 Find a Place
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setSelectedRole('owner')}
//                 className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
//                   selectedRole === 'owner'
//                     ? 'border-accent bg-accent-light text-accent'
//                     : 'border-border text-gray-500 hover:border-gray-300'
//                 }`}
//               >
//                 <Building2 size={18} />
//                 List Property
//               </button>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             {/* Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
//               <input
//                 type="text"
//                 placeholder="John Doe"
//                 className={`input-field ${errors.name ? 'border-danger' : ''}`}
//                 {...register('name')}
//               />
//               {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
//             </div>

//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
//               <input
//                 type="email"
//                 placeholder="you@example.com"
//                 className={`input-field ${errors.email ? 'border-danger' : ''}`}
//                 {...register('email')}
//               />
//               {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
//             </div>

//             {/* Phone (optional) */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                 Phone <span className="text-muted font-normal">(optional)</span>
//               </label>
//               <input
//                 type="tel"
//                 placeholder="+880 17XX-XXXXXX"
//                 className="input-field"
//                 {...register('phone')}
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   placeholder="Min. 6 characters"
//                   className={`input-field pr-11 ${errors.password ? 'border-danger' : ''}`}
//                   {...register('password')}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//               {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 placeholder="Repeat your password"
//                 className={`input-field ${errors.confirmPassword ? 'border-danger' : ''}`}
//                 {...register('confirmPassword')}
//               />
//               {errors.confirmPassword && (
//                 <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>
//               )}
//             </div>

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
//             >
//               {loading ? (
//                 <Loader2 size={18} className="animate-spin" />
//               ) : (
//                 <UserPlus size={18} />
//               )}
//               {loading ? 'Creating account...' : 'Create Account'}
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-muted">
//               Already have an account?{' '}
//               <Link to="/login" className="text-accent font-medium hover:text-accent-hover">
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// =============================================
// Register Page — Redesigned UI (logic unchanged)
// =============================================

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  User,
  Building2,
  MapPin,
  Star,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { authAPI } from "../../api/auth.api";

// ── Schema (unchanged) ─────────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Animation helpers ──────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      delay: i * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

const errorAnim = {
  initial: { opacity: 0, y: -5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  transition: { duration: 0.2 },
};

// ── Role card data ─────────────────────────────────────────────────────
const ROLES = [
  {
    value: "user",
    icon: User,
    title: "Find a Place",
    desc: "Browse & book rentals",
    active: "border-primary bg-primary/6 text-primary",
    glow: "shadow-primary/20",
  },
  {
    value: "owner",
    icon: Building2,
    title: "List Property",
    desc: "Reach verified renters",
    active: "border-accent bg-accent/6 text-accent",
    glow: "shadow-accent/20",
  },
];

// ═══════════════════════════════════════════════════════════════════════
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");
  const navigate = useNavigate();
  const location = useLocation();

  // ── RHF + Zod (unchanged) ──────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // ── Submit (unchanged) ─────────────────────────────────────────────
  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: selectedRole,
      });
      toast.success(
        `Welcome to MoveMate, ${data.data?.user?.name || formData.name}!`,
      );

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12
                      bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923] overflow-hidden"
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 -left-20 w-[360px] h-[360px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.09, 1] }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10 inline-flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-white font-heading font-bold text-xl">M</span>
          </div>
          <span className="font-heading font-bold text-2xl text-white">
            Move<span className="text-accent">Mate</span>
          </span>
        </Link>

        {/* Center content */}
        <motion.div
          className="relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.p
            variants={fadeUp}
            className="text-accent font-semibold text-sm uppercase tracking-widest mb-4"
          >
            Join MoveMate Today
          </motion.p>

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl xl:text-5xl font-heading font-bold text-white leading-[1.08]"
          >
            Start your journey
            <br />
            <span
              style={{
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundImage:
                  "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)",
              }}
            >
              to a new home.
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-slate-400 mt-5 text-base leading-relaxed max-w-sm"
          >
            Whether you're relocating to Dhaka or listing a property in
            Chittagong — MoveMate connects you to what matters.
          </motion.p>

          {/* Benefits list */}
          <motion.div variants={fadeUp} custom={3} className="mt-9 space-y-3">
            {[
              { icon: CheckCircle2, text: "Free to join — no hidden charges" },
              { icon: MapPin, text: "Properties across all major cities" },
              { icon: Star, text: "Verified listings with real reviews" },
              { icon: Shield, text: "Secure bookings & payments" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-accent" />
                </div>
                <span className="text-slate-400 text-sm">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Bottom — already have account */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-slate-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="text-accent font-semibold hover:text-orange-400 transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 flex items-start justify-center px-6 py-10">
        <motion.div
          className="w-full max-w-[440px]"
          initial="hidden"
          animate="visible"
          variants={stagger}
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
          <motion.div variants={fadeUp} className="mb-7">
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-muted mt-1.5 text-sm">
              Join thousands finding their perfect home
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-7"
          >
            {/* ── Role Selector ── */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(
                  ({ value, icon: Icon, title, desc, active, glow }) => (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRole(value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        selectedRole === value
                          ? `${active} shadow-lg ${glow}`
                          : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 ${
                          selectedRole === value
                            ? "bg-current/10"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={
                            selectedRole === value
                              ? "text-current"
                              : "text-gray-400"
                          }
                        />
                      </div>
                      <p className="font-bold text-sm leading-none">{title}</p>
                      <p
                        className={`text-xs leading-snug ${selectedRole === value ? "text-current opacity-70" : "text-gray-400"}`}
                      >
                        {desc}
                      </p>
                      {selectedRole === value && (
                        <motion.div
                          layoutId="role-check"
                          className="absolute top-3 right-3"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                          }}
                        >
                          <CheckCircle2 size={14} className="text-current" />
                        </motion.div>
                      )}
                    </motion.button>
                  ),
                )}
              </div>
            </div>

            {/* ── Form fields ── */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`input-field transition-all duration-200 ${
                    errors.name
                      ? "border-danger focus:ring-danger/20"
                      : "focus:border-accent focus:ring-accent/15"
                  }`}
                  {...register("name")}
                />
                <AnimatePresence>
                  {errors.name && (
                    <motion.p
                      {...errorAnim}
                      className="text-danger text-xs mt-1.5"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                      {...errorAnim}
                      className="text-danger text-xs mt-1.5"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (optional)
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+880 17XX-XXXXXX"
                  autoComplete="tel"
                  className="input-field focus:border-accent focus:ring-accent/15 transition-all duration-200"
                  {...register("phone")}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className={`input-field pr-11 transition-all duration-200 ${
                      errors.password
                        ? "border-danger focus:ring-danger/20"
                        : "focus:border-accent focus:ring-accent/15"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      {...errorAnim}
                      className="text-danger text-xs mt-1.5"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`input-field transition-all duration-200 ${
                    errors.confirmPassword
                      ? "border-danger focus:ring-danger/20"
                      : "focus:border-accent focus:ring-accent/15"
                  }`}
                  {...register("confirmPassword")}
                />
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p
                      {...errorAnim}
                      className="text-danger text-xs mt-1.5"
                    >
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <div className="pt-1">
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
                    <UserPlus size={17} />
                  )}
                  {loading ? "Creating account..." : "Create Account"}
                </motion.button>
              </div>
            </form>

            {/* Divider + sign in link */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <p className="text-center text-sm text-muted mt-5">
              Already have an account?{" "}
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>

          {/* Bottom breathing room for scrollable mobile */}
          <div className="h-8" />
        </motion.div>
      </div>
    </div>
  );
}
