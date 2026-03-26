// =============================================
// User Dashboard — Bookings, Saved, Profile
// =============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Heart, User, Settings, Loader2,
  MapPin, ChevronRight, Clock, Building2, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { bookingAPI, savedAPI } from '../../api/booking.api';
import { authAPI } from '../../api/auth.api';
import BookingStatusBadge from '../../components/shared/BookingStatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';

const TABS = [
  { key: 'bookings', label: 'My Bookings', icon: Calendar },
  { key: 'saved', label: 'Saved', icon: Heart },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function UserDashboard() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'bookings') {
          const { data } = await bookingAPI.list({ role: 'renter' });
          setBookings(data.bookings || []);
        } else if (activeTab === 'saved') {
          const { data } = await savedAPI.list();
          setSaved(data.listings || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab !== 'profile') fetchData();
    else setLoading(false);
  }, [activeTab]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      setUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const removeSaved = async (propertyId) => {
    try {
      await savedAPI.unsave(propertyId);
      setSaved(prev => prev.filter(s => s.id !== propertyId));
      toast.success('Removed from saved');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white">Welcome, {user?.name}</h1>
              <p className="text-white/60 text-sm">Manage your bookings and profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-border p-1 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════ TAB CONTENT ══════════ */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length > 0 ? bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row gap-4 hover:shadow-card transition-shadow">
                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={b.property_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'}
                        alt={b.property_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/listings/${b.property_id}`} className="font-heading font-semibold text-gray-900 hover:text-primary truncate">
                          {b.property_title}
                        </Link>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="flex items-center gap-1 text-xs text-muted mt-1">
                        <MapPin size={12} /> {b.property_city}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Clock size={13} /> {formatDate(b.check_in)}{b.check_out ? ` — ${formatDate(b.check_out)}` : ''}</span>
                        <span className="font-semibold text-primary">{formatPrice(b.total_price)}</span>
                      </div>
                      <div className="mt-4">
                        <Link to={`/bookings/${b.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                          <Eye size={16} /> View Booking Details
                        </Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-border">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-heading font-semibold text-gray-700">No bookings yet</p>
                    <p className="text-sm text-muted mt-1">Start by browsing our listings</p>
                    <Link to="/listings" className="btn-primary mt-4 inline-flex text-sm">Browse Listings</Link>
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {saved.length > 0 ? saved.map((s) => (
                  <div key={s.id} className="card">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={s.primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeSaved(s.id)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:bg-red-50 group"
                      >
                        <Heart size={16} className="text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    <div className="p-4">
                      <Link to={`/listings/${s.id}`} className="font-heading font-semibold text-sm hover:text-primary">
                        {s.title}
                      </Link>
                      <p className="text-xs text-muted mt-1">{s.city}</p>
                      <p className="text-sm font-bold text-primary mt-2">{formatPrice(s.base_price, s.price_unit)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-16 bg-white rounded-xl border border-border">
                    <Heart size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-heading font-semibold text-gray-700">No saved listings</p>
                    <p className="text-sm text-muted mt-1">Save properties you like while browsing</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-lg">
                <div className="bg-white rounded-2xl border border-border p-6">
                  <h2 className="font-heading font-bold text-lg text-gray-900 mb-5">Edit Profile</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                      <input
                        type="text" value={profileForm.name}
                        onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input
                        type="tel" value={profileForm.phone}
                        onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                        className="input-field" placeholder="+880 17XX-XXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input
                        type="text" value={profileForm.city}
                        onChange={(e) => setProfileForm(f => ({ ...f, city: e.target.value }))}
                        className="input-field" placeholder="Dhaka"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Role:</strong> {user?.role}</p>
                      <p><strong>Joined:</strong> {formatDate(user?.created_at)}</p>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
