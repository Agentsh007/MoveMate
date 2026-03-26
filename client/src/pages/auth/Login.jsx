// =============================================
// Login Page — React Hook Form + Zod Validation
// =============================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

// Zod schema — validates form data before submission
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // React Hook Form — connects to Zod for validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Redirect to where user was trying to go, or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xl">M</span>
            </div>
            <span className="font-heading font-bold text-2xl text-primary">
              Move<span className="text-accent">Mate</span>
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome back</h1>
          <p className="text-muted mt-1">Sign in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-danger focus:ring-danger/20' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pr-11 ${errors.password ? 'border-danger focus:ring-danger/20' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent font-medium hover:text-accent-hover">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo accounts hint */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-medium text-blue-700 mb-1">🔑 Demo Accounts</p>
          <p className="text-xs text-blue-600">
            <strong>Owner:</strong> owner1@dummyinbox.com / Test@1234
          </p>
          <p className="text-xs text-blue-600">
            <strong>User:</strong> user1@dummyinbox.com / Test@1234
          </p>
        </div>
      </div>
    </div>
  );
}
