// =============================================
// Register Page — Role Selection + React Hook Form + Zod
// =============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Loader2, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

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

      toast.success(`Welcome to MoveMate, ${data.data?.user?.name || formData.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1 className="text-2xl font-heading font-bold text-gray-900">Create your account</h1>
          <p className="text-muted mt-1">Join MoveMate and start exploring</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('user')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedRole === 'user'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-gray-500 hover:border-gray-300'
                }`}
              >
                <User size={18} />
                Find a Place
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('owner')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedRole === 'owner'
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-gray-500 hover:border-gray-300'
                }`}
              >
                <Building2 size={18} />
                List Property
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'border-danger' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-danger' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+880 17XX-XXXXXX"
                className="input-field"
                {...register('phone')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className={`input-field pr-11 ${errors.password ? 'border-danger' : ''}`}
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
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className={`input-field ${errors.confirmPassword ? 'border-danger' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:text-accent-hover">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
