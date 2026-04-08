// import { useState } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import {
//   Menu, X, Home, Building2, MapPin, AlertTriangle,
//   User, LogOut, PlusCircle, LayoutDashboard, ChevronDown
// } from 'lucide-react';
// import useAuthStore from '../../store/authStore';
// import NotificationBell from './NotificationBell';

// const NAV_LINKS = [
//   { to: '/', label: 'Home', icon: Home },
//   { to: '/listings', label: 'Listings', icon: Building2 },
//   { to: '/essentials', label: 'Essentials', icon: MapPin },
//   { to: '/emergency', label: 'Emergency', icon: AlertTriangle },
// ];

// export default function Navbar() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const { user, logout } = useAuthStore();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const handleLogout = () => {
//     logout();
//     setProfileOpen(false);
//     navigate('/');
//   };

//   const isActive = (path) => location.pathname === path;

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center gap-2 shrink-0">
//             <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
//               <span className="text-white font-heading font-bold text-lg">M</span>
//             </div>
//             <span className="font-heading font-bold text-xl text-primary hidden sm:block">
//               Move<span className="text-accent">Mate</span>
//             </span>
//           </Link>

//           {/* Desktop Nav */}
//           <div className="hidden md:flex items-center gap-1">
//             {NAV_LINKS.map(({ to, label, icon: Icon }) => (
//               <Link
//                 key={to}
//                 to={to}
//                 className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
//                   isActive(to)
//                     ? 'bg-primary/10 text-primary'
//                     : 'text-gray-600 hover:text-primary hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon size={16} />
//                 {label}
//               </Link>
//             ))}
//           </div>

//           {/* Right Side */}
//           <div className="flex items-center gap-2">
//             {user ? (
//               <>
//                 {/* Notification Bell */}
//                 <NotificationBell />

//                 {/* Profile Dropdown */}
//                 <div className="relative">
//                   <button
//                     onClick={() => setProfileOpen(!profileOpen)}
//                     className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-border"
//                   >
//                     <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
//                       <span className="text-white text-sm font-semibold">
//                         {user.name?.charAt(0).toUpperCase()}
//                       </span>
//                     </div>
//                     <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
//                       {user.name}
//                     </span>
//                     <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
//                   </button>

//                   {profileOpen && (
//                     <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-border z-50 animate-fade-in overflow-hidden">
//                       <div className="px-4 py-3 border-b border-border bg-gray-50">
//                         <p className="text-sm font-semibold">{user.name}</p>
//                         <p className="text-xs text-muted truncate">{user.email}</p>
//                         <span className="badge-info mt-1 text-[10px]">{user.role}</span>
//                       </div>

//                       <div className="py-1">
//                         <Link
//                           to="/dashboard"
//                           onClick={() => setProfileOpen(false)}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
//                         >
//                           <LayoutDashboard size={16} />
//                           Dashboard
//                         </Link>

//                         {(user.role === 'owner' || user.role === 'admin') && (
//                           <>
//                             <Link
//                               to="/owner"
//                               onClick={() => setProfileOpen(false)}
//                               className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
//                             >
//                               <Building2 size={16} />
//                               Owner Panel
//                             </Link>
//                             <Link
//                               to="/owner/listings/new"
//                               onClick={() => setProfileOpen(false)}
//                               className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent-light transition-colors"
//                             >
//                               <PlusCircle size={16} />
//                               Add Listing
//                             </Link>
//                           </>
//                         )}

//                         <hr className="my-1 border-border" />

//                         <button
//                           onClick={handleLogout}
//                           className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors w-full"
//                         >
//                           <LogOut size={16} />
//                           Logout
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <Link
//                   to="/login"
//                   className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-light transition-colors"
//                 >
//                   Login
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="btn-primary text-sm !px-4 !py-2"
//                 >
//                   Register
//                 </Link>
//               </div>
//             )}

//             {/* Mobile Menu Button */}
//             <button
//               onClick={() => setMobileOpen(!mobileOpen)}
//               className="md:hidden p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50"
//             >
//               {mobileOpen ? <X size={22} /> : <Menu size={22} />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Menu Drawer */}
//       {mobileOpen && (
//         <div className="md:hidden bg-white border-t border-border animate-slide-up">
//           <div className="px-4 py-3 space-y-1">
//             {NAV_LINKS.map(({ to, label, icon: Icon }) => (
//               <Link
//                 key={to}
//                 to={to}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
//                   isActive(to)
//                     ? 'bg-primary/10 text-primary'
//                     : 'text-gray-600 hover:bg-gray-50'
//                 }`}
//               >
//                 <Icon size={18} />
//                 {label}
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }

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
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #ede9e3',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px' }}>M</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.4px', color: '#1a1a2e' }}
              className="hidden sm:block"
            >
              Move<span style={{ color: '#8b5cf6' }}>Mate</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2px' }}>
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '10px',
                  fontSize: '13.5px', fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease',
                  ...(isActive(to)
                    ? { background: '#ede9fe', color: '#6d28d9' }
                    : { color: '#6b7280' }
                  ),
                }}
                onMouseEnter={e => {
                  if (!isActive(to)) {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(to)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? (
              <>
                <NotificationBell />

                {/* ── Profile Dropdown ── */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 10px 5px 5px',
                      borderRadius: '999px',
                      border: profileOpen ? '1px solid #e0dff9' : '1px solid transparent',
                      background: profileOpen ? '#f5f3ff' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#f5f3ff';
                      e.currentTarget.style.borderColor = '#e0dff9';
                    }}
                    onMouseLeave={e => {
                      if (!profileOpen) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 2px #fff, 0 0 0 3.5px #ddd8fe',
                        fontSize: '13px', fontWeight: 700, color: '#fff',
                      }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      {/* Online dot */}
                      <span style={{
                        position: 'absolute', bottom: '1px', right: '1px',
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#22c55e', border: '1.5px solid #fff',
                      }} />
                    </div>

                    <span
                      className="hidden sm:block"
                      style={{
                        fontSize: '13px', fontWeight: 500, color: '#374151',
                        maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </span>

                    <ChevronDown
                      size={13}
                      style={{
                        color: '#9ca3af',
                        transition: 'transform 0.22s ease',
                        transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* ── Dropdown Panel ── */}
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '236px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #ede9e3',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 16px 32px -4px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transformOrigin: 'top right',
                    transform: profileOpen ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(-8px)',
                    opacity: profileOpen ? 1 : 0,
                    pointerEvents: profileOpen ? 'auto' : 'none',
                    transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease',
                  }}>

                    {/* Header */}
                    <div style={{
                      padding: '14px 16px 12px',
                      background: 'linear-gradient(155deg, #faf9f7, #f4f1fb)',
                      borderBottom: '1px solid #ede9e3',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 0 2px #fff, 0 0 0 3px #ddd8fe',
                        fontSize: '15px', fontWeight: 700, color: '#fff',
                      }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>
                          {user.name}
                        </p>
                        <p style={{ margin: '2px 0 5px', fontSize: '11.5px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                        <span style={{
                          display: 'inline-block', fontSize: '9.5px', fontWeight: 700,
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '999px',
                          background: '#ede9fe', color: '#6d28d9',
                        }}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Menu */}
                    <div style={{ padding: '6px 0' }}>
                      <DropItem delay={0} open={profileOpen}>
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          style={menuLinkStyle()}
                        >
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>
                      </DropItem>

                      {(user.role === 'owner' || user.role === 'admin') && (
                        <>
                          <DropItem delay={40} open={profileOpen}>
                            <Link
                              to="/owner"
                              onClick={() => setProfileOpen(false)}
                              style={menuLinkStyle()}
                            >
                              <Building2 size={15} /> Owner Panel
                            </Link>
                          </DropItem>

                          <DropItem delay={80} open={profileOpen}>
                            <Link
                              to="/owner/listings/new"
                              onClick={() => setProfileOpen(false)}
                              style={menuLinkStyle('#7c3aed')}
                            >
                              <PlusCircle size={15} /> Add Listing
                            </Link>
                          </DropItem>
                        </>
                      )}

                      <div style={{ margin: '5px 12px', borderTop: '1px solid #f0ede8' }} />

                      <DropItem delay={120} open={profileOpen}>
                        <button
                          onClick={handleLogout}
                          style={{
                            ...menuLinkStyle('#dc2626'),
                            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </DropItem>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px', fontSize: '13.5px', fontWeight: 500,
                    color: '#6366f1', textDecoration: 'none', borderRadius: '10px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '8px 18px', fontSize: '13.5px', fontWeight: 600,
                    color: '#fff', textDecoration: 'none', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden"
              style={{
                padding: '7px', borderRadius: '10px', border: 'none',
                background: 'transparent', cursor: 'pointer', color: '#6b7280',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <div
        className="md:hidden"
        style={{
          overflow: 'hidden',
          maxHeight: mobileOpen ? '400px' : '0px',
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderTop: mobileOpen ? '1px solid #ede9e3' : 'none',
        }}
      >
        <div style={{ padding: '8px 16px 14px' }}>
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '10px', marginBottom: '2px',
                fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s ease',
                ...(isActive(to)
                  ? { background: '#ede9fe', color: '#6d28d9' }
                  : { color: '#4b5563' }
                ),
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ── Helpers ────────────────────────────────────────────────

function menuLinkStyle(color = '#374151') {
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 16px', margin: '0 4px',
    fontSize: '13.5px', fontWeight: 500, color,
    borderRadius: '10px', textDecoration: 'none',
    background: 'transparent',
    transition: 'background 0.15s ease',
  };
}

function DropItem({ children, delay, open }) {
  return (
    <div style={{
      opacity: open ? 1 : 0,
      transform: open ? 'translateX(0)' : 'translateX(-8px)',
      transition: `opacity 0.2s ease ${delay}ms, transform 0.2s ease ${delay}ms`,
    }}
      onMouseEnter={e => {
        const child = e.currentTarget.firstChild;
        if (child) child.style.background = child.style.color === 'rgb(220, 38, 38)'
          ? '#fef2f2'
          : child.style.color === 'rgb(124, 58, 237)'
            ? '#f5f3ff'
            : '#f9f8f6';
      }}
      onMouseLeave={e => {
        const child = e.currentTarget.firstChild;
        if (child) child.style.background = 'transparent';
      }}
    >
      {children}
    </div>
  );
}