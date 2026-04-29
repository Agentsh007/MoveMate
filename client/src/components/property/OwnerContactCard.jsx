// =============================================
// Owner Contact Card — Blurred for guests
// =============================================

import { Link, useLocation } from "react-router-dom";
import { Phone, Mail, MessageSquare, Lock } from "lucide-react";

export default function OwnerContactCard({ property, isLoggedIn }) {
  const { owner_name, owner_email, owner_phone, owner_avatar } = property;
  const location = useLocation();

  // Guest view — blurred contact info
  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {owner_name?.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{owner_name}</p>
            <p className="text-xs text-muted">Property Owner</p>
          </div>
        </div>

        {/* Blurred info */}
        <div className="space-y-3 filter blur-sm select-none pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} /> +880 17XX-XXXXXX
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} /> owner@email.com
          </div>
        </div>

        {/* Login overlay */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
          <Lock size={24} className="text-primary mb-2" />
          <p className="font-heading font-semibold text-sm text-gray-800">
            Login to see contact info
          </p>
          <p className="text-xs text-muted mt-1 mb-3">
            Owner's phone & email are private
          </p>
          <Link to="/login" className="btn-primary text-sm !px-5 !py-2">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated viewstate={{ from: location.pathname }}  — full contact info
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-5">
        {owner_avatar ? (
          <img
            src={owner_avatar}
            alt={owner_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {owner_name?.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">{owner_name}</p>
          <p className="text-xs text-muted">Property Owner</p>
        </div>
      </div>

      <div className="space-y-3">
        {owner_phone && (
          <a
            href={`tel:${owner_phone}`}
            className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Phone size={16} />
            {owner_phone}
          </a>
        )}

        {owner_email && (
          <a
            href={`mailto:${owner_email}`}
            className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Mail size={16} />
            {owner_email}
          </a>
        )}

        <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
          <MessageSquare size={16} />
          Send Message
        </button>
      </div>
    </div>
  );
}
