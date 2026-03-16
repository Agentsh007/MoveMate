// =============================================
// App.jsx — Root Component with Lazy Loading + Polish
// =============================================

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import ScrollToTop from './components/shared/ScrollToTop';
import { ProtectedRoute, OwnerRoute } from './components/shared/ProtectedRoute';
import { PageSkeleton } from './components/shared/LoadingSkeleton';

// Lazy-loaded pages — only downloaded when user navigates to them
const Home = lazy(() => import('./pages/Home'));
const Listings = lazy(() => import('./pages/Listings'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const Essentials = lazy(() => import('./pages/Essentials'));
const Emergency = lazy(() => import('./pages/Emergency'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const UserDashboard = lazy(() => import('./pages/dashboard/UserDashboard'));
const OwnerDashboard = lazy(() => import('./pages/dashboard/OwnerDashboard'));
const AddListing = lazy(() => import('./pages/owner/AddListing'));
const NotFound = lazy(() => import('./pages/NotFound'));

// React Query client — caches API responses
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 pt-16">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listings/:id" element={<PropertyDetail />} />
                <Route path="/essentials" element={<Essentials />} />
                <Route path="/emergency" element={<Emergency />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><UserDashboard /></ProtectedRoute>
                } />

                {/* Owner Only */}
                <Route path="/owner" element={
                  <OwnerRoute><OwnerDashboard /></OwnerRoute>
                } />
                <Route path="/owner/listings/new" element={
                  <OwnerRoute><AddListing /></OwnerRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#1C1C1C',
              color: '#fff',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
