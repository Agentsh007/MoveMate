// =============================================
// Owner Dashboard — Listings, Bookings, Earnings
// =============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Calendar, DollarSign, PlusCircle, Loader2,
  Eye, Edit, Trash2, MapPin, Clock, Users, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { propertyAPI } from '../../api/property.api';
import { bookingAPI } from '../../api/booking.api';
import BookingStatusBadge from '../../components/shared/BookingStatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';

const TABS = [
  { key: 'listings', label: 'My Listings', icon: Building2 },
  { key: 'bookings', label: 'Booking Requests', icon: Calendar },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
];

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'listings') {
          const { data } = await propertyAPI.myListings();
          setListings(data.properties || []);
        } else if (activeTab === 'bookings') {
          const { data } = await bookingAPI.list({ role: 'owner' });
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error('Owner dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab !== 'earnings') fetchData();
    else setLoading(false);
  }, [activeTab]);

  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await propertyAPI.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await bookingAPI.updateStatus(bookingId, { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch (err) {
      toast.error('Failed to update booking');
    }
  };

  // Stats
  const totalListings = listings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">Owner Dashboard</h1>
                <p className="text-white/70 text-sm">{user?.name} &mdash; {user?.email}</p>
              </div>
            </div>
            <Link to="/owner/listings/new" className="hidden sm:flex items-center gap-2 bg-white text-accent px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all shadow-lg">
              <PlusCircle size={16} />
              Add Listing
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { val: totalListings, label: 'Listings', icon: Building2 },
              { val: pendingBookings, label: 'Pending', icon: Clock },
              { val: bookings.length, label: 'Total Bookings', icon: Calendar },
            ].map(({ val, label, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                <Icon size={18} className="mx-auto mb-1 text-white/70" />
                <p className="text-2xl font-heading font-bold text-white">{val}</p>
                <p className="text-xs text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Add button */}
        <Link to="/owner/listings/new" className="sm:hidden flex items-center justify-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-medium text-sm mb-4">
          <PlusCircle size={16} /> Add New Listing
        </Link>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-border p-1 mb-6 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === key
                  ? 'bg-accent text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* ══════════ LISTINGS TAB ══════════ */}
            {activeTab === 'listings' && (
              <div className="space-y-4">
                {listings.length > 0 ? listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-xl border border-border p-5 flex flex-col sm:flex-row gap-4 hover:shadow-card transition-shadow">
                    <div className="w-full sm:w-40 h-28 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={listing.primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-heading font-semibold text-gray-900">{listing.title}</h3>
                          <p className="flex items-center gap-1 text-xs text-muted mt-0.5">
                            <MapPin size={12} />{listing.city}
                          </p>
                        </div>
                        <span className="badge bg-primary/10 text-primary text-xs">{listing.property_type}</span>
                      </div>
                      <p className="text-lg font-heading font-bold text-accent mt-2">
                        {formatPrice(listing.base_price, listing.price_unit)}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Link to={`/listings/${listing.id}`} className="flex items-center gap-1 text-xs text-primary hover:text-primary-light font-medium">
                          <Eye size={13} /> View
                        </Link>
                        <span className="text-border">|</span>
                        <button onClick={() => handleDeleteListing(listing.id)} className="flex items-center gap-1 text-xs text-danger hover:text-red-700 font-medium">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-border">
                    <Building2 size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-heading font-semibold text-gray-700">No listings yet</p>
                    <Link to="/owner/listings/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                      <PlusCircle size={16} /> Add Your First Listing
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ BOOKINGS TAB ══════════ */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {bookings.length > 0 ? bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl border border-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-heading font-semibold text-gray-900">{b.renter_name}</p>
                        <p className="text-xs text-muted">{b.renter_email}</p>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1"><Building2 size={13} />{b.property_title}</span>
                      <span className="flex items-center gap-1"><Clock size={13} />{formatDate(b.check_in)}</span>
                      <span className="flex items-center gap-1"><Users size={13} />{b.guests} guest{b.guests > 1 ? 's' : ''}</span>
                      <span className="font-semibold text-primary">{formatPrice(b.total_price)}</span>
                    </div>
                    {b.message && (
                      <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-3 italic">"{b.message}"</p>
                    )}
                    {b.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBookingAction(b.id, 'confirmed')}
                          className="flex-1 bg-green-50 text-green-700 font-medium py-2 rounded-lg text-sm hover:bg-green-100 transition-colors"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleBookingAction(b.id, 'rejected')}
                          className="flex-1 bg-red-50 text-red-700 font-medium py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-border">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-heading font-semibold text-gray-700">No booking requests</p>
                    <p className="text-sm text-muted mt-1">Requests will appear when renters book your properties</p>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ EARNINGS TAB ══════════ */}
            {activeTab === 'earnings' && (
              <div className="text-center py-16 bg-white rounded-xl border border-border">
                <DollarSign size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-heading font-semibold text-gray-700">Earnings Dashboard</p>
                <p className="text-sm text-muted mt-1">Income analytics coming soon with SSLCommerz integration</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
