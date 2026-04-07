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
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ─────────── Header ─────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top row */}
          <div className="flex items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md shadow-orange-200">
              <span className="text-white text-lg font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Tabs — underline style */}
          <div className="flex gap-7 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key
                  ? 'border-gray-900 text-gray-900 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────── Content ─────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={30} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <>

            {/* ══ Bookings Tab ══ */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
                  {bookings.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {bookings.length} trip{bookings.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {bookings.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Image */}
                        <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={b.property_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'}
                            alt={b.property_title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/listings/${b.property_id}`}
                              className="text-sm font-semibold text-gray-900 truncate hover:underline underline-offset-2"
                            >
                              {b.property_title}
                            </Link>
                            <BookingStatusBadge status={b.status} />
                          </div>

                          <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
                            <MapPin size={12} /> {b.property_city}
                          </p>

                          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock size={12} className="text-gray-400" />
                              {formatDate(b.check_in)}{b.check_out ? ` – ${formatDate(b.check_out)}` : ''}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(b.total_price)}
                            </span>
                          </div>

                          <div className="mt-4">
                            <Link
                              to={`/bookings/${b.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 underline underline-offset-2 hover:text-orange-500 transition-colors"
                            >
                              <Eye size={13} /> View details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-900 mb-1">No trips yet</p>
                    <p className="text-sm text-gray-500 mb-5">
                      Time to dust off your bags and plan your next stay
                    </p>
                    <Link
                      to="/listings"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Start exploring
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ══ Saved Tab ══ */}
            {activeTab === 'saved' && (
              <div>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">Saved</h2>
                  {saved.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {saved.length} place{saved.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {saved.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {saved.map((s) => (
                      <div
                        key={s.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={s.primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => removeSaved(s.id)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition-transform duration-150"
                          >
                            <Heart size={15} className="text-rose-500 fill-rose-500" />
                          </button>
                        </div>
                        <div className="p-3.5">
                          <Link
                            to={`/listings/${s.id}`}
                            className="text-sm font-semibold text-gray-900 block hover:underline underline-offset-2 truncate"
                          >
                            {s.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">{s.city}</p>
                          <p className="text-sm font-bold text-gray-900 mt-2">
                            {formatPrice(s.base_price, s.price_unit)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <Heart size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-900 mb-1">Nothing saved yet</p>
                    <p className="text-sm text-gray-500">Tap the heart on any listing to save it here</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ Profile Tab ══ */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* Left — Identity card */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">

                  {/* Banner */}
                  <div className="h-20 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-300" />

                  {/* Body */}
                  <div className="px-6 pb-6 -mt-9">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-orange-400 border-[3px] border-white flex items-center justify-center shadow-lg shadow-orange-200 mb-3 text-white text-2xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 mb-5">
                      Member since {formatDate(user?.created_at)}
                    </p>

                    <div className="divide-y divide-gray-100 border-t border-gray-100">
                      {[
                        { label: 'Email', value: user?.email },
                        { label: 'Role', value: user?.role },
                        { label: 'Joined', value: formatDate(user?.created_at) },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-3 text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-gray-900 font-medium text-right break-all max-w-[55%]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — Edit form */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-7">
                  <h2 className="text-xl font-bold text-gray-900">Personal info</h2>
                  <p className="text-sm text-gray-500 mt-1 mb-6">Update your name, phone, and location</p>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">

                    {/* Full width — Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Full name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Rahim Ahmed"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 hover:border-gray-400 transition-colors"
                      />
                    </div>

                    {/* Two col — Phone & City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Phone number</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+880 17XX-XXXXXX"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 hover:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">City</label>
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="e.g. Dhaka"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 hover:border-gray-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                      >
                        {saving
                          ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                          : <><Settings size={16} /> Save changes</>
                        }
                      </button>
                    </div>
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
