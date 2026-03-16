// =============================================
// 404 Not Found Page
// =============================================

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-heading font-bold text-primary/20">404</p>
        <h1 className="text-2xl font-heading font-bold text-gray-900 mt-4">Page Not Found</h1>
        <p className="text-muted mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2 text-sm">
            <Home size={16} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
