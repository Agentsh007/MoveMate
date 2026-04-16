// =============================================
// Minimalist Navbar - Soft White + Light Black + Blue Accents
// Soothing & Clean Design with Smooth Animations
// =============================================

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, Building2, MapPin, AlertTriangle,
  LogOut, PlusCircle, LayoutDashboard, ChevronDown
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/listings', label: 'Listings', icon: Building2 },
  { to: '/essentials', label: 'Essentials', icon: MapPin },
  { to: '/emergency', label: 'Emergency', icon: AlertTriangle },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-zinc-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 group-active:scale-95">
              <span className="text-white font-bold text-xl tracking-tighter">M</span>
            </div>
            <span className="font-semibold text-2xl tracking-tight text-zinc-900 hidden sm:block transition-colors group-hover:text-zinc-800">
              Move<span className="text-blue-600">Mate</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${isActive(to)
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
              >
                <Icon
                  size={17}
                  className={`transition-transform duration-200 ${isActive(to) ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-3xl border transition-all duration-300 ${profileOpen
                        ? 'bg-zinc-50 border-zinc-200 shadow-sm'
                        : 'border-transparent hover:bg-zinc-50'
                      }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-sm font-semibold shadow-sm transition-transform hover:scale-105">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{user.role}</p>
                    </div>

                    <ChevronDown
                      size={15}
                      className={`text-zinc-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-xl border border-zinc-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 rounded-t-3xl">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-xl font-semibold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 text-base">{user.name}</p>
                            <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-3 px-2 space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-5 py-3.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-2xl transition-all hover:translate-x-1 duration-200"
                        >
                          <LayoutDashboard size={18} className="text-zinc-500" />
                          Dashboard
                        </Link>

                        {(user.role === 'owner' || user.role === 'admin') && (
                          <>
                            <Link
                              to="/owner"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-5 py-3.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-2xl transition-all hover:translate-x-1 duration-200"
                            >
                              <Building2 size={18} className="text-zinc-500" />
                              Owner Panel
                            </Link>

                            <Link
                              to="/owner/listings/new"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-5 py-3.5 text-sm text-blue-600 hover:bg-blue-50 rounded-2xl transition-all hover:translate-x-1 duration-200"
                            >
                              <PlusCircle size={18} />
                              Add Listing
                            </Link>
                          </>
                        )}

                        <div className="mx-4 my-3 border-t border-zinc-100" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-5 py-3.5 text-sm text-red-600 hover:bg-red-50 rounded-2xl transition-all hover:translate-x-1 duration-200 w-full text-left"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-sm transition-all duration-200 active:scale-[0.97]"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-3 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-2xl transition-all duration-200"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden bg-white border-t border-zinc-100 overflow-hidden transition-all duration-300 ease-out ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-6 py-6 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-medium transition-all duration-200 ${isActive(to)
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'
                }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}