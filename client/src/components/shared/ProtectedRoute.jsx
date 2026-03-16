// =============================================
// ProtectedRoute & OwnerRoute — Auth Gate Wrappers
// =============================================
// These components wrap routes that require authentication.
// If user is not logged in → redirect to /login
// If user is not an owner → redirect to /dashboard
// =============================================

import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Not logged in → redirect to login, save intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const OwnerRoute = ({ children }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
