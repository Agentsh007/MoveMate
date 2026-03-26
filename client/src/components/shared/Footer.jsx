import { Link } from 'react-router-dom';
import { Building2, MapPin, AlertTriangle, Mail, Phone, Github } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Footer() {
  const { user } = useAuthStore();

  const handleListPropertyClick = (e) => {
    if (user && user.role !== 'owner' && user.role !== 'admin') {
      toast.error('You need an Owner account to list properties.');
    }
  };

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-heading font-bold text-lg">M</span>
              </div>
              <span className="font-heading font-bold text-xl">
                Move<span className="text-accent">Mate</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Your all-in-one companion for relocating to a new city in Bangladesh.
              Find rentals, discover services, access emergency help.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-white/80">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {[
                { to: '/listings', label: 'Find Rentals', icon: Building2 },
                { to: '/essentials', label: 'Nearby Services', icon: MapPin },
                { to: '/emergency', label: 'Emergency Contacts', icon: AlertTriangle },
              ].map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-accent transition-colors"
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Property Owners */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-white/80">
              Property Owners
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
                  onClick={handleListPropertyClick}
                  className="text-sm text-white/60 hover:text-accent transition-colors"
                >
                  List Your Property
                </Link>
              </li>
              <li>
                <Link 
                  to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner' : '/dashboard') : '/login'}
                  className="text-sm text-white/60 hover:text-accent transition-colors"
                >
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <span className="text-sm text-white/40">Pricing Plans (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-white/80">
              Contact
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail size={14} />
                support@movemate.bd
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone size={14} />
                +880 1700-000000
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <MapPin size={14} />
                Dhaka, Bangladesh
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} MoveMate. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-white/40 hover:text-white/70 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-white/40 hover:text-white/70 text-xs transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
