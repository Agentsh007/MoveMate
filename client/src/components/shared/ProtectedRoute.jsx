// =============================================
// ProtectedRoute & OwnerRoute — Supabase Auth Gate
// =============================================
// Checks both Supabase session AND app user data.
// Shows loading spinner while auth state initializes.
// =============================================

import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export const ProtectedRoute = ({ children }) => {
  const { user, session, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const OwnerRoute = ({ children }) => {
  const { user, session, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
