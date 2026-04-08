// Start of: ./client\src\App.jsx
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
const BookingDetail = lazy(() => import('./pages/dashboard/BookingDetail'));
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
                <Route path="/bookings/:id" element={
                  <ProtectedRoute><BookingDetail /></ProtectedRoute>
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

// End of file

// Start of: ./client\src\main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import useAuthStore from './store/authStore';

// Fix Leaflet's default marker icon issue with Vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Initialize Supabase auth session listener before rendering
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// End of file

// Start of: ./client\src\components\property\BookingPanel.jsx
// ./client/src/components/property/BookingPanel.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, Send, CheckCircle, Clock, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { bookingAPI } from '../../api/booking.api';
import useAuthStore from '../../store/authStore';
import { formatPrice } from '../../utils/formatPrice';

const stripePromise = loadStripe('pk_test_51TJ5aGHOPecI6vQ7tXiax8vR6MtoyRUXB3ybDe5QJ8dWW2PEQUslM74brscOiRzeFUgwN5b4A3YV77awIY8bSAgh00UPwaQxNH');

export default function BookingPanel({ property }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    message: '',
    minMonths: 6,           // default for long-term
  });

  const { booking_model, base_price, price_unit, instant_book, title, max_guests = 4 } = property;

  // Calculate nights for hotel & short-term
  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0;

  const total = price_unit === 'per_night' ? base_price * nights : base_price;

  const handleBook = async (bookingType) => {
    if (!user) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    // Validation
    if ((booking_model === 'hotel_style' || booking_model === 'short_term') && (!form.checkIn || !form.checkOut)) {
      toast.error('Please select both check-in and check-out dates');
      return;
    }

    if (booking_model === 'long_term' && !form.checkIn) {
      toast.error('Please select your preferred move-in date');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        property_id: property.id,
        booking_type: bookingType,
        check_in: form.checkIn || null,
        check_out: form.checkOut || null,
        guests: form.guests,
        total_price: total || base_price,
        message: form.message || null,
        ...(booking_model === 'long_term' && { min_months: form.minMonths }),
      };

      // CORRECT RESPONSE HANDLING
      const response = await bookingAPI.create(payload);
      const booking = response.data.booking || response.data;   // ← This was the bug

      if (!booking?.id) {
        throw new Error('Failed to create booking - no ID returned');
      }

      // === STRIPE PAYMENT (Pay Now flows) ===
      if (bookingType === 'hotel_pay_now' || bookingType === 'short_term_instant') {
        if (!total || total <= 0) {
          toast.error('Invalid amount for payment');
          return;
        }

        try {
          const { data: session } = await bookingAPI.createStripeSession({
            booking_id: booking.id,
            amount: Math.round(total * 100),
          });

          // NEW WAY: Redirect manually using the URL returned from backend
          if (session.url) {
            window.location.href = session.url;
          } else {
            toast.error('Failed to open payment page');
          }
        } catch (stripeErr) {
          console.error(stripeErr);
          toast.error('Payment session creation failed');
        }
        return;
      }
      // Success for request/inquiry flows
      toast.success('Booking request sent successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error("Booking Error:", err.response?.data || err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Booking failed';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // ===================== HOTEL STYLE =====================
  if (booking_model === 'hotel_style') {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-3xl font-bold text-gray-900">{formatPrice(base_price, price_unit)}</span>
            <p className="text-sm text-gray-500">per night</p>
          </div>
          <span className="badge bg-violet-100 text-violet-700">Hotel</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
              min={form.checkIn || new Date().toISOString().split('T')[0]}
              className="input-field"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
          <select
            value={form.guests}
            onChange={(e) => setForm(f => ({ ...f, guests: parseInt(e.target.value) }))}
            className="input-field"
          >
            {Array.from({ length: max_guests }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {nights > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm">
              <span>৳{base_price} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span className="font-semibold">৳{total}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-3 mt-3">
              <span>Total</span>
              <span>৳{total}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => handleBook('hotel_pay_now')}
          disabled={loading}
          className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
          Pay Now with Stripe
        </button>

        <button
          onClick={() => handleBook('hotel_pay_at_property')}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Clock size={18} /> Pay at Property
        </button>
      </div>
    );
  }

  // ===================== SHORT TERM =====================
  if (booking_model === 'short_term') {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-3xl font-bold">{formatPrice(base_price, price_unit)}</span>
          </div>
          <span className={`badge ${instant_book ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {instant_book ? 'Instant Book' : 'Request'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} className="input-field" />
          </div>
        </div>

        {nights > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center font-semibold">
            Total: ৳{total} ({nights} nights)
          </div>
        )}

        <button
          onClick={() => handleBook(instant_book ? 'short_term_instant' : 'short_term_request')}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : instant_book ? <CheckCircle size={18} /> : <Send size={18} />}
          {instant_book ? 'Book Instantly (Stripe)' : 'Send Booking Request'}
        </button>
      </div>
    );
  }

  // ===================== LONG TERM =====================
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex justify-between mb-6">
        <div className="text-3xl font-bold">{formatPrice(base_price, price_unit)}</div>
        <span className="badge bg-emerald-100 text-emerald-700">Long Term</span>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-5 mb-6 text-sm">
        <p className="font-medium mb-2">How it works:</p>
        <ol className="list-decimal pl-5 space-y-1 text-emerald-700">
          <li>Submit your interest</li>
          <li>Owner will schedule a visit</li>
          <li>Discuss and sign agreement</li>
        </ol>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Move-in Date</label>
          <input
            type="date"
            value={form.checkIn}
            onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Minimum stay</label>
          <select
            value={form.minMonths}
            onChange={e => setForm(f => ({ ...f, minMonths: parseInt(e.target.value) }))}
            className="input-field"
          >
            {[3, 6, 12, 24].map(m => (
              <option key={m} value={m}>{m} months</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message to owner (optional)</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="I am a family of 4 looking for a long-term stay..."
            rows={4}
            className="input-field resize-none"
          />
        </div>
      </div>

      <button
        onClick={() => handleBook('long_term_inquiry')}
        disabled={loading}
        className="btn-primary w-full mt-8 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <MessageSquare size={18} />}
        Express Interest
      </button>
    </div>
  );
}
// End of file

// Start of: ./client\src\components\property\ImageGallery.jsx
// =============================================
// Image Gallery — Grid + Fullscreen Modal
// =============================================

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ImageGallery({ images = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageList = images.length > 0
    ? images.map(img => img.url)
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];

  const prev = () => setCurrentIndex((i) => (i === 0 ? imageList.length - 1 : i - 1));
  const next = () => setCurrentIndex((i) => (i === imageList.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* Grid Preview */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[400px] md:h-[480px]">
        {/* Main image */}
        <div
          className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => { setCurrentIndex(0); setIsOpen(true); }}
        >
          <img
            src={imageList[0]}
            alt="Property"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Thumbnail grid */}
        {imageList.slice(1, 5).map((url, idx) => (
          <div
            key={idx}
            className="hidden md:block relative cursor-pointer group overflow-hidden"
            onClick={() => { setCurrentIndex(idx + 1); setIsOpen(true); }}
          >
            <img
              src={url}
              alt={`Property ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* "Show all" overlay on last thumbnail */}
            {idx === 3 && imageList.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-medium text-sm">+{imageList.length - 5} more</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: show all button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden mt-2 text-sm text-accent font-medium flex items-center gap-1"
      >
        <Maximize2 size={14} />
        View all {imageList.length} photos
      </button>

      {/* ══════════ Fullscreen Modal ══════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in">
          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
            {currentIndex + 1} / {imageList.length}
          </div>

          {/* Previous */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <img
            src={imageList[currentIndex]}
            alt={`Property ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
          >
            <ChevronRight size={32} />
          </button>

          {/* Thumbnails */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {imageList.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-accent scale-110' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// End of file

// Start of: ./client\src\components\property\OwnerContactCard.jsx
// =============================================
// Owner Contact Card — Blurred for guests
// =============================================

import { Link } from 'react-router-dom';
import { Phone, Mail, MessageSquare, Lock } from 'lucide-react';

export default function OwnerContactCard({ property, isLoggedIn }) {
  const { owner_name, owner_email, owner_phone, owner_avatar } = property;

  // Guest view — blurred contact info
  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{owner_name?.charAt(0)}</span>
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
          <p className="font-heading font-semibold text-sm text-gray-800">Login to see contact info</p>
          <p className="text-xs text-muted mt-1 mb-3">Owner's phone & email are private</p>
          <Link to="/login" className="btn-primary text-sm !px-5 !py-2">
            Login
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated view — full contact info
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-5">
        {owner_avatar ? (
          <img src={owner_avatar} alt={owner_name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{owner_name?.charAt(0)}</span>
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

// End of file

// Start of: ./client\src\components\property\PropertyCard.jsx
// =============================================
// PropertyCard — Reusable listing card
// =============================================

import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Users, Star } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export default function PropertyCard({ property }) {
  const {
    id, title, city, address, property_type, base_price, price_unit,
    bedrooms, bathrooms, max_guests, primary_image, avg_rating, review_count, owner_name
  } = property;

  const typeLabels = {
    hotel: 'Hotel', flat: 'Flat', apartment: 'Apartment',
    sublet: 'Sublet', tolet: 'To-Let', room: 'Room',
  };

  const typeColors = {
    hotel: 'bg-violet-100 text-violet-700',
    flat: 'bg-blue-100 text-blue-700',
    apartment: 'bg-teal-100 text-teal-700',
    sublet: 'bg-orange-100 text-orange-700',
    tolet: 'bg-rose-100 text-rose-700',
    room: 'bg-amber-100 text-amber-700',
  };

  return (
    <Link to={`/listings/${id}`} className="group">
      <div className="card h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={primary_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Type Badge */}
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeColors[property_type] || 'bg-gray-100 text-gray-700'}`}>
            {typeLabels[property_type] || property_type}
          </span>
          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
            <span className="font-heading font-bold text-primary text-sm">
              {formatPrice(base_price, price_unit)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-heading font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <p className="flex items-center gap-1 text-muted text-xs mt-1.5">
            <MapPin size={12} />
            <span className="line-clamp-1">{address || city}</span>
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
            {bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} /> {bedrooms}
              </span>
            )}
            {bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={13} /> {bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users size={13} /> {max_guests}
            </span>
          </div>

          {/* Footer: Rating + Owner */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700">
                {parseFloat(avg_rating || 0).toFixed(1)}
              </span>
              <span className="text-xs text-muted">({review_count || 0})</span>
            </div>
            {owner_name && (
              <span className="text-[11px] text-muted truncate max-w-[100px]">
                by {owner_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// End of file

// Start of: ./client\src\components\property\ReviewForm.jsx
import { useState } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewAPI } from '../../api/review.api';

export default function ReviewForm({ propertyId, bookingId, existingReview, onReviewSubmitted }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await reviewAPI.update(existingReview.id, { rating, comment });
        toast.success('Review updated successfully!');
      } else {
        await reviewAPI.create({ property_id: propertyId, booking_id: bookingId, rating, comment });
        toast.success('Review submitted! Thank you.');
      }
      onReviewSubmitted(); // Trigger a re-fetch of the reviews list
    } catch (err) {
      console.error('Submit review error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-primary/20 p-6 mb-8 shadow-sm">
      <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
        {isEditing ? 'Update Your Review' : 'Rate your stay'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-gray-200 fill-gray-50'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like about this property? What could be improved?"
            rows={4}
            className="input-field w-full resize-y text-sm"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {isEditing ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

// End of file

// Start of: ./client\src\components\property\ReviewSection.jsx
// =============================================
// Review Section — Star Ratings + Review Cards
// =============================================

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { reviewAPI } from '../../api/review.api';
import { timeAgo } from '../../utils/formatDate';
import useAuthStore from '../../store/authStore';
import ReviewForm from './ReviewForm';

export default function ReviewSection({ propertyId }) {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0, breakdown: {} });
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data } = await reviewAPI.getByProperty(propertyId);
      setReviews(data.reviews);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (!user) return;
    try {
      const { data } = await reviewAPI.checkEligibility(propertyId);
      setEligibility(data);
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews();
      fetchEligibility();
    }
  }, [propertyId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare size={20} />
        Reviews
        <span className="text-sm font-normal text-muted">({summary?.count || 0})</span>
      </h2>

      {!user ? (
        <div className="bg-gray-50 border border-border rounded-xl p-6 text-center mb-8">
          <p className="text-gray-600 text-sm">
            Please <span className="font-semibold text-primary">Log in</span> to leave a review for this property.
          </p>
        </div>
      ) : eligibilityLoading ? (
        <p className="text-sm text-muted">
          Checking review eligibility...
        </p>
      ) : eligibility?.canReview ? (
        <ReviewForm
          propertyId={propertyId}
          bookingId={eligibility.bookingId}
          existingReview={eligibility.existingReview}
          onReviewSubmitted={() => {
            fetchReviews();
            fetchEligibility();
          }}
        />
      ) : (
        <div className="bg-gray-50 border border-border rounded-xl p-6 text-center mb-8">
          <p className="text-gray-600 text-sm">
            Only guests with a confirmed booking can leave a review.
          </p>
        </div>
      )}

      {summary?.count > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="text-center mb-4">
              <p className="text-4xl font-heading font-bold text-gray-900">
                {parseFloat(summary.average || 0).toFixed(1)}
              </p>
              <div className="flex justify-center mt-1">{renderStars(Math.round(summary.average || 0))}</div>
              <p className="text-sm text-muted mt-1">{summary.count} review{summary.count !== 1 ? 's' : ''}</p>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(n => {
                const count = summary.breakdown?.[n] || 0;
                const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-500">{n}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-gray-400 text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Cards */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {review.reviewer_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{review.reviewer_name}</p>
                      <p className="text-xs text-muted">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-border">
          <MessageSquare size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-muted text-sm">No reviews yet</p>
        </div>
      )}
    </div>
  );
}
// End of file

// Start of: ./client\src\components\shared\BookingStatusBadge.jsx
import { BOOKING_STATUS_COLORS } from '../../utils/constants';

export default function BookingStatusBadge({ status }) {
  const colorClass = BOOKING_STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

// End of file

// Start of: ./client\src\components\shared\Footer.jsx
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

// End of file

// Start of: ./client\src\components\shared\LoadingSkeleton.jsx
// =============================================
// Loading Skeleton — Shimmer placeholder for content
// =============================================

export function PropertyCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="bg-gray-200 aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-3 mt-3">
          <div className="h-3 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-200 rounded w-8" />
          <div className="h-3 bg-gray-200 rounded w-8" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyCardSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-3">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmergencyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 bg-gray-100 rounded-lg p-2.5 h-10 w-full" />
    </div>
  );
}

export function EssentialsListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex gap-2 pt-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// End of file

// Start of: ./client\src\components\shared\MapView.jsx
// =============================================
// MapView — Leaflet + OpenStreetMap
// =============================================

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DHAKA_CENTER } from '../../utils/constants';

export default function MapView({ latitude, longitude, title, className = '' }) {
  const lat = parseFloat(latitude) || DHAKA_CENTER.lat;
  const lng = parseFloat(longitude) || DHAKA_CENTER.lng;

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', minHeight: '250px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{title || 'Property Location'}</strong>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// End of file

// Start of: ./client\src\components\shared\Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, Building2, MapPin, AlertTriangle,
  User, LogOut, PlusCircle, LayoutDashboard, ChevronDown
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

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <span className="text-white font-heading font-bold text-lg">M</span>
            </div>
            <span className="font-heading font-bold text-xl text-primary hidden sm:block">
              Move<span className="text-accent">Mate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-border z-50 animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-gray-50">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                        <span className="badge-info mt-1 text-[10px]">{user.role}</span>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard size={16} />
                          Dashboard
                        </Link>

                        {(user.role === 'owner' || user.role === 'admin') && (
                          <>
                            <Link
                              to="/owner"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Building2 size={16} />
                              Owner Panel
                            </Link>
                            <Link
                              to="/owner/listings/new"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent hover:bg-accent-light transition-colors"
                            >
                              <PlusCircle size={16} />
                              Add Listing
                            </Link>
                          </>
                        )}

                        <hr className="my-1 border-border" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-light transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm !px-4 !py-2"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

// End of file

// Start of: ./client\src\components\shared\NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../../api/location.api';
import useNotificationStore from '../../store/notificationStore';
import { timeAgo } from '../../utils/formatDate';

import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationAPI.list();
        setNotifications(data.notifications, data.unread_count);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [setNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      markRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleMarkRead(n.id);
    }

    try {
      const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
      if (payload && payload.booking_id) {
        setIsOpen(false);
        navigate(`/bookings/${payload.booking_id}`);
      }
    } catch (e) {
      console.warn('Failed to parse notification payload', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1 animate-pulse-dot">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        // <div className="absolute -translate-x-1/2 left-1/2  mt-2  max-w-[calc(90vw-4rem)]   bg-white rounded-xl shadow-modal border border-border z-50 animate-fade-in overflow-hidden">
        <div className="
    fixed sm:absolute
    left-1/2 sm:left-auto sm:right-0
    -translate-x-1/2 sm:translate-x-0
    top-16 sm:top-auto sm:mt-2
    w-[calc(100vw-2rem)] sm:w-80 md:w-96
    max-h-[70vh] sm:max-h-none
    bg-white rounded-xl shadow-modal border border-border z-50 animate-fade-in overflow-hidden
  ">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-heading font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''
                    }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// End of file

// Start of: ./client\src\components\shared\ProtectedRoute.jsx
// =============================================
// ProtectedRoute & OwnerRoute — Supabase Auth Gate
// =============================================
// Checks both Supabase session AND app user data.
// Shows loading spinner while auth state initializes.
// =============================================

import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export const ProtectedRoute = ({ children }) => {
  const { user, session, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const OwnerRoute = ({ children }) => {
  const { user, session, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'owner' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// End of file

// Start of: ./client\src\components\shared\ScrollToTop.jsx
// =============================================
// ScrollToTop — Restores scroll position on route change
// =============================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// End of file

// Start of: ./client\src\pages\Emergency.jsx
// =============================================
// Emergency Page — Tap-to-Call + Offline-First
// =============================================
// OFFLINE STRATEGY:
// 1. On first load: fetch from API → store in localStorage
// 2. On subsequent loads: show localStorage first (instant), then refresh from API
// 3. If API fails: gracefully fall back to cached data
// =============================================

import { useState, useEffect } from 'react';
import {
  Phone, MapPin, AlertTriangle, Shield, Flame, Ambulance,
  Zap, Baby, Loader2, RefreshCw, WifiOff, Search, Info
} from 'lucide-react';
import { emergencyAPI } from '../api/location.api';
import { DHAKA_CENTER } from '../utils/constants';
import { EmergencyCardSkeleton } from '../components/shared/LoadingSkeleton';

const NATIONWIDE_NUMBERS = [
  { name: 'National Emergency Service (Police, Fire, Ambulance)', phone: '999', icon: AlertTriangle, color: 'from-red-600 to-red-800' },
  { name: 'Women & Child Abuse Helpline', phone: '109', icon: Baby, color: 'from-pink-500 to-pink-700' },
  { name: 'Disaster Management', phone: '1090', icon: Flame, color: 'from-orange-500 to-orange-700' },
  { name: 'Govt. Info & Services', phone: '333', icon: Phone, color: 'from-blue-500 to-blue-700' },
];

const CATEGORY_ICONS = {
  Police: Shield, 'Fire Service': Flame, Ambulance: Ambulance,
  'Gas Leak': Zap, "Women's Helpline": Phone, "Child Helpline": Baby,
  'Flood / Disaster': AlertTriangle, Default: AlertTriangle,
};

const CATEGORY_COLORS = {
  Police: 'from-blue-500 to-blue-700',
  'Fire Service': 'from-red-500 to-red-700',
  Ambulance: 'from-green-500 to-green-700',
  'Gas Leak': 'from-amber-500 to-amber-700',
  "Women's Helpline": 'from-pink-500 to-pink-700',
  "Child Helpline": 'from-purple-500 to-purple-700',
  'Flood / Disaster': 'from-cyan-500 to-cyan-700',
  Default: 'from-gray-500 to-gray-700',
};

const CACHE_KEY = 'movemate_emergency_cache';

export default function Emergency() {
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load from cache first, then API
  useEffect(() => {
    // Step 1: Load from cache immediately
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setContacts(data.contacts || []);
        setCategories(data.categories || []);
        setLoading(false);
      } catch {}
    }

    // Step 2: Fetch from API
    fetchFromAPI();
  }, []);

  const fetchFromAPI = async () => {
    try {
      // Get user location for location-aware results
      let lat = DHAKA_CENTER.lat, lng = DHAKA_CENTER.lng;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation?.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      const [catRes, contactRes] = await Promise.all([
        emergencyAPI.getCategories(),
        emergencyAPI.getContacts({ lat, lng }),
      ]);

      const categories = catRes.data.categories || [];
      const contacts = contactRes.data.contacts || [];

      setCategories(categories);
      setContacts(contacts);
      setIsOffline(false);

      // Cache for offline use
      localStorage.setItem(CACHE_KEY, JSON.stringify({ categories, contacts, cachedAt: Date.now() }));
    } catch (err) {
      console.error('Emergency fetch failed:', err);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name) => CATEGORY_ICONS[name] || CATEGORY_ICONS.Default;
  const getColor = (name) => CATEGORY_COLORS[name] || CATEGORY_COLORS.Default;

  // Filter contacts
  const filtered = contacts.filter(c => {
    const matchesSearch = !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);
    const matchesCategory = !selectedCategory || c.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = {};
  filtered.forEach(c => {
    const cat = c.category_name || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">Emergency Contacts</h1>
              <p className="text-white/70 text-sm">Tap to call — works offline</p>
            </div>
          </div>

          {isOffline && (
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-3">
              <WifiOff size={14} className="text-white/70" />
              <span className="text-xs text-white/70">Showing cached data — tap to refresh</span>
              <button onClick={fetchFromAPI} className="ml-auto text-white/90 hover:text-white">
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field !pl-10"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => {
              const Icon = getIcon(cat.name);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nationwide Banner */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
               <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                 <AlertTriangle size={16} className="text-red-600" />
               </div>
               <h2 className="font-heading font-bold text-gray-900">National Emergency Lines</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {NATIONWIDE_NUMBERS.map((n, idx) => (
                <a key={idx} href={`tel:${n.phone}`} className={`relative overflow-hidden rounded-xl p-4 text-white hover:scale-[1.02] transition-transform shadow-sm group bg-gradient-to-br ${n.color}`}>
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform duration-500">
                    <n.icon size={80} />
                  </div>
                  <n.icon size={20} className="mb-2 text-white/90" />
                  <p className="text-xs font-medium text-white/80 mb-0.5">{n.name}</p>
                  <p className="text-2xl font-bold font-heading">{n.phone}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact Cards */}
        {loading ? (
          <div className="space-y-4">
             <div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <EmergencyCardSkeleton key={i} />)}
             </div>
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([categoryName, categoryContacts]) => {
              const Icon = getIcon(categoryName);
              const color = getColor(categoryName);
              return (
                <div key={categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <h2 className="font-heading font-bold text-gray-900">{categoryName}</h2>
                    <span className="text-xs text-muted">({categoryContacts.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryContacts.map(contact => (
                      <a
                        key={contact.id}
                        href={`tel:${contact.phone}`}
                        className="bg-white rounded-xl border border-border p-4 hover:shadow-elevated hover:border-red-200 transition-all group animate-fade-in active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors">
                              {contact.name}
                            </h3>
                            {contact.address && (
                              <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                                <MapPin size={10} /> {contact.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 bg-red-50 rounded-lg p-2.5 group-hover:bg-red-100 transition-colors">
                          <Phone size={16} className="text-red-600 shrink-0" />
                          <span className="text-red-700 font-bold text-sm">{contact.phone}</span>
                          <span className="ml-auto text-xs text-red-500 font-medium">TAP TO CALL</span>
                        </div>

                        {contact.available_24h && (
                          <p className="text-[10px] text-green-600 font-medium mt-2">● Available 24/7</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-border">
            <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-heading font-semibold text-gray-700">No contacts found</p>
            <p className="text-sm text-muted mt-1">Try clearing your search filters</p>
          </div>
        )}

      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\Essentials.jsx
// =============================================
// Essentials Page — Split-View Map + Service List + Routing
// =============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {
  MapPin, Phone, Clock, Navigation, Crosshair,
  Building2, Stethoscope, Landmark, Fuel, UtensilsCrossed,
  ShoppingBag, Route, X, Timer, Milestone
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { DHAKA_CENTER } from '../utils/constants';
import { EssentialsListSkeleton } from '../components/shared/LoadingSkeleton';
import { fetchOverpassData, calculateDistance, getAddressFromCoords } from '../api/overpass.api';

const OSM_CATEGORIES = [
  { id: 'hospital', name: 'Hospital', icon: Stethoscope, query: 'node["amenity"~"hospital|clinic"]({{bbox}});' },
  { id: 'pharmacy', name: 'Pharmacy', icon: ShoppingBag, query: 'node["amenity"="pharmacy"]({{bbox}});' },
  { id: 'bank', name: 'Bank & ATM', icon: Landmark, query: 'node["amenity"~"bank|atm"]({{bbox}});' },
  { id: 'restaurant', name: 'Restaurant', icon: UtensilsCrossed, query: 'node["amenity"~"restaurant|cafe|fast_food"]({{bbox}});' },
  { id: 'supermarket', name: 'Supermarket', icon: ShoppingBag, query: 'node["shop"~"supermarket|convenience|grocery"]({{bbox}});' },
  { id: 'fuel', name: 'Fuel Station', icon: Fuel, query: 'node["amenity"="fuel"]({{bbox}});' },
];

const DEFAULT_ICON = Building2;

const CATEGORY_COLORS = {
  hospital: '#EF4444',
  pharmacy: '#EF4444',
  restaurant: '#F97316',
  supermarket: '#3B82F6',
  bank: '#A855F7',
  fuel: '#EAB308',
  default: '#6B7280',
};

const getMarkerIcon = (categoryId, isSelected = false) => {
  const color = isSelected ? '#DC2626' : (CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default);
  const size = isSelected ? 48 : 36;
  const anchor = isSelected ? 24 : 18;
  const shadow = isSelected
    ? 'drop-shadow(0px 4px 8px rgba(220,38,38,0.55))'
    : 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))';

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"
              fill="${color}" stroke="white"
              stroke-width="${isSelected ? 1.5 : 2}"
              stroke-linecap="round" stroke-linejoin="round"
              style="filter:${shadow}; transform:translateY(-4px); transition:all 0.2s ease;">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="${isSelected ? 3.5 : 3}" fill="white" stroke="none"/>
          </svg>`,
    iconSize: [size, size],
    iconAnchor: [anchor, size],
    popupAnchor: [0, -size],
  });
};

// ── NEW: fetch driving route from OSRM and fit map bounds ─────────────────────
async function fetchOSRMRoute(fromLat, fromLng, toLat, toLng) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.routes?.length) throw new Error('No route found');

  const route = json.routes[0];
  // GeoJSON coords are [lng, lat] — Leaflet needs [lat, lng]
  const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

  return {
    coords,
    distance_m: route.distance,   // metres
    duration_s: route.duration,   // seconds
  };
}

function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDuration(s) {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── NEW: RouteLayer — renders the polyline + fits map bounds ──────────────────
function RouteLayer({ userLocation, selectedService, onRouteReady, onRouteClear }) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    if (!selectedService) {
      setRouteCoords(null);
      onRouteClear?.();
      return;
    }

    let cancelled = false;

    fetchOSRMRoute(
      userLocation.lat, userLocation.lng,
      selectedService.latitude, selectedService.longitude
    )
      .then((data) => {
        if (cancelled) return;
        setRouteCoords(data.coords);
        onRouteReady?.(data);

        // Fit the whole route in view with padding
        const bounds = L.latLngBounds(data.coords);
        map.fitBounds(bounds, { padding: [48, 48], animate: true, duration: 1.0 });
      })
      .catch((err) => {
        console.warn('Routing failed:', err);
        onRouteClear?.();
      });

    return () => { cancelled = true; };
  }, [selectedService, userLocation, map, onRouteReady, onRouteClear]);

  if (!routeCoords) return null;

  return (
    <>
      {/* Soft white halo under the route */}
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.7 }}
      />
      {/* Main animated dashed route line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: '#3B82F6',
          weight: 4,
          opacity: 0.95,
          dashArray: '10, 6',
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function MapController({ selectedService, markerRefs, userLocation }) {
  const map = useMap();

  useEffect(() => {
    // If no service selected, fly back to user
    if (!selectedService && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true });
    }
    // When selected, RouteLayer handles fitBounds — nothing to do here
  }, [selectedService, map, userLocation]);

  return null;
}

function LocateMeControl({ setUserLocation }) {
  const map = useMap();
  useEffect(() => {
    const control = L.control({ position: 'topright' });
    control.onAdd = function () {
      const container = L.DomUtil.create('div', 'locate-me-control');
      L.DomEvent.disableClickPropagation(container);
      const root = createRoot(container);
      root.render(
        <button
          className="locate-me-btn"
          title="Re-center on my location"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                map.flyTo([loc.lat, loc.lng], 14, { animate: true, duration: 1 });
              },
              () => { },
              { maximumAge: 0, timeout: 10000, enableHighAccuracy: true }
            );
          }}
        >
          <Crosshair size={18} />
        </button>
      );
      return container;
    };
    control.addTo(map);
    return () => control.remove();
  }, [map, setUserLocation]);
  return null;
}

function AddressDisplay({ address, lat, lng }) {
  const [displayAddress, setDisplayAddress] = useState(address);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address === 'Address not available' && lat && lng) {
      setLoading(true);
      getAddressFromCoords(lat, lng).then((res) => {
        if (res) setDisplayAddress(res);
        setLoading(false);
      });
    } else {
      setDisplayAddress(address);
    }
  }, [address, lat, lng]);

  return (
    <p className="text-xs text-muted mt-0.5 flex items-start gap-1">
      <MapPin size={11} className="mt-0.5 shrink-0" />
      {loading
        ? <span className="animate-pulse">Loading exact address...</span>
        : <span className="line-clamp-2 leading-relaxed">{displayAddress}</span>}
    </p>
  );
}

// ── NEW: floating route info card rendered inside the map container ───────────
function RouteInfoCard({ routeInfo, destination, onDismiss }) {
  if (!routeInfo) return null;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]
                 bg-white rounded-2xl shadow-xl border border-blue-100
                 px-4 py-3 flex items-center gap-4 w-[92%] max-w-sm
                 animate-fade-in"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Blue accent bar */}
      <div className="w-1 self-stretch rounded-full bg-blue-500 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mb-1">
          <Route size={11} /> Route to destination
        </p>
        <p className="text-[11px] text-gray-700 truncate font-medium">{destination}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
            <Milestone size={11} className="text-blue-500" />
            {formatDistance(routeInfo.distance_m)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-600 font-semibold">
            <Timer size={11} className="text-blue-500" />
            {formatDuration(routeInfo.duration_s)}
          </span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100
                   flex items-center justify-center shrink-0 transition-colors"
      >
        <X size={13} className="text-gray-500 hover:text-red-500" />
      </button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Essentials() {
  const [categories] = useState(OSM_CATEGORIES);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [userLocation, setUserLocation] = useState(DHAKA_CENTER);
  const [selectedService, setSelectedService] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);   // ── NEW
  const markerRefs = useRef({});

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn('Geolocation error, using fallback:', err),
      { maximumAge: 60000, timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      let queryBody = '';
      if (selectedCategory) {
        const cat = OSM_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat) queryBody = cat.query;
      } else {
        queryBody = OSM_CATEGORIES.map((c) => c.query).join('\n');
      }

      const elements = await fetchOverpassData(userLocation.lat, userLocation.lng, searchRadius, queryBody);

      const parsedServices = elements
        .filter((el) => el.type === 'node' && el.tags)
        .map((el) => {
          const tags = el.tags;
          let catName = 'Service';
          let catId = 'default';
          let Icon = DEFAULT_ICON;

          if (tags.amenity?.match(/hospital|clinic/)) { catName = 'Hospital'; catId = 'hospital'; Icon = Stethoscope; }
          else if (tags.amenity === 'pharmacy') { catName = 'Pharmacy'; catId = 'pharmacy'; Icon = ShoppingBag; }
          else if (tags.amenity?.match(/bank|atm/)) { catName = tags.amenity === 'atm' ? 'ATM' : 'Bank'; catId = 'bank'; Icon = Landmark; }
          else if (tags.amenity?.match(/restaurant|cafe|fast_food/)) { catName = 'Restaurant'; catId = 'restaurant'; Icon = UtensilsCrossed; }
          else if (tags.shop?.match(/supermarket|convenience|grocery/)) { catName = 'Supermarket'; catId = 'supermarket'; Icon = ShoppingBag; }
          else if (tags.amenity === 'fuel') { catName = 'Fuel Station'; catId = 'fuel'; Icon = Fuel; }

          const name = tags.name || tags.operator || tags.brand || `${catName} (Unnamed)`;
          const addressParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean);
          const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

          return {
            id: el.id, name, category_id: catId, category_name: catName, icon: Icon,
            latitude: el.lat, longitude: el.lon, address,
            phone: tags.phone || tags['contact:phone'] || null,
            operating_hours: tags.opening_hours || null,
            distance_km: calculateDistance(userLocation.lat, userLocation.lng, el.lat, el.lon),
          };
        })
        .filter((s) => s.distance_km <= searchRadius)
        .sort((a, b) => a.distance_km - b.distance_km);

      markerRefs.current = {};
      setServices(parsedServices);
    } catch (err) {
      console.error('Failed to fetch essentials:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedCategory, searchRadius]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── NEW: deselect + clear route ────────────────────────────────────────────
  const handleDeselect = useCallback(() => {
    setSelectedService(null);
    setRouteInfo(null);
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl font-heading font-bold text-gray-900">Nearby Essentials</h1>
          <p className="text-sm text-muted mt-0.5">Find pharmacies, hospitals, banks, and more near you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${!selectedCategory ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >All</button>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted">Radius:</span>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="input-field !py-1.5 !px-2 !w-auto text-xs"
            >
              {[1, 2, 3, 5, 10, 20].map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive split-view */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6">

          {/* Map — top on mobile */}
          <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-border
                          h-[280px] sm:h-[360px] lg:h-[calc(100vh-280px)] relative">
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={13}
              scrollWheelZoom={true}
              touchZoom={true}
              doubleClickZoom={true}
              zoomControl={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                selectedService={selectedService}
                markerRefs={markerRefs}
                userLocation={userLocation}
              />
              <LocateMeControl setUserLocation={setUserLocation} />

              {/* ── NEW: draws the route polyline + fits bounds ────────────── */}
              <RouteLayer
                userLocation={userLocation}
                selectedService={selectedService}
                onRouteReady={setRouteInfo}
                onRouteClear={() => setRouteInfo(null)}
              />

              {/* User location marker */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup><strong>You are here</strong></Popup>
              </Marker>

              {/* Service markers — no popup, colour/size driven by selection */}
              <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false}>
                {services.map((s) =>
                  s.latitude && s.longitude ? (
                    <Marker
                      key={s.id}
                      position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                      icon={getMarkerIcon(s.category_id, selectedService?.id === s.id)}
                      ref={(ref) => { if (ref) markerRefs.current[s.id] = ref; }}
                      eventHandlers={{
                        click: () =>
                          setSelectedService((prev) => (prev?.id === s.id ? null : s)),
                      }}
                    />
                  ) : null
                )}
              </MarkerClusterGroup>
            </MapContainer>

            {/* ── NEW: floating route info card (inside map container) ────── */}
            {/* <RouteInfoCard
              routeInfo={routeInfo}
              destination={selectedService?.name}
              onDismiss={handleDeselect}
            /> */}
          </div>

          {/* Service list — below map on mobile */}
          <div className="order-2 lg:order-1 overflow-y-auto space-y-3 pr-1
                          max-h-[420px] sm:max-h-[500px] lg:max-h-[calc(100vh-280px)]">
            <p className="text-sm text-muted mb-2">
              {loading ? 'Searching...' : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
            </p>

            {loading ? (
              <div className="py-2"><EssentialsListSkeleton count={4} /></div>
            ) : services.length > 0 ? (
              services.map((s) => {
                const Icon = s.icon || DEFAULT_ICON;
                const isSelected = selectedService?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (isSelected) { handleDeselect(); }
                      else { setSelectedService(s); setRouteInfo(null); }
                    }}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all animate-fade-in hover:shadow-card ${isSelected
                      ? 'border-red-500 ring-2 ring-red-200'
                      : 'border-border'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-red-100' : 'bg-primary/10'
                        }`}>
                        <Icon size={18} className={isSelected ? 'text-red-500' : 'text-primary'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900">{s.name}</h3>
                        <AddressDisplay address={s.address} lat={s.latitude} lng={s.longitude} />
                        <div className="flex items-center gap-3 mt-2">
                          {s.phone && (
                            <a href={`tel:${s.phone}`} onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700">
                              <Phone size={11} /> {s.phone}
                            </a>
                          )}
                          {s.distance_km != null && (
                            <span className="flex items-center gap-1 text-xs text-accent font-medium">
                              <Navigation size={11} /> {parseFloat(s.distance_km).toFixed(1)} km
                            </span>
                          )}
                          {/* ── NEW: show route distance/duration if this card is selected */}
                          {isSelected && routeInfo && (
                            <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                              <Route size={11} />
                              {formatDistance(routeInfo.distance_m)} · {formatDuration(routeInfo.duration_s)}
                            </span>
                          )}
                        </div>
                        {s.operating_hours && (
                          <p className="flex items-center gap-1 text-[11px] text-muted mt-1.5">
                            <Clock size={10} /> {s.operating_hours}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <MapPin size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-700">No services found</p>
                <p className="text-sm text-muted mt-1">Try increasing the radius or changing category</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
// End of file

// Start of: ./client\src\pages\Home.jsx
// // =============================================
// // Home Page — Hero + Featured + Browse by Type + How It Works
// // =============================================

// import { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   Search, MapPin, Building2, Hotel, Home as HomeIcon,
//   DoorOpen, BedDouble, ArrowRight, CheckCircle2,
//   Map, AlertTriangle, Loader2
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { propertyAPI } from '../api/property.api';
// import useAuthStore from '../store/authStore';
// import PropertyCard from '../components/property/PropertyCard';

// const PROPERTY_TYPES = [
//   { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
//   { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
//   { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50' },
//   { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
//   { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50' },
//   { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50' },
// ];

// const HOW_IT_WORKS = [
//   { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search },
//   { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map },
//   { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2 },
//   { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle },
// ];

// export default function Home() {
//   const { user } = useAuthStore();
//   const [featured, setFeatured] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchCity, setSearchCity] = useState('');
//   const navigate = useNavigate();

//   const handleListPropertyClick = (e) => {
//     if (user && user.role !== 'owner' && user.role !== 'admin') {
//       e.preventDefault();
//       toast.error('You need an Owner account to list properties.');
//       navigate('/dashboard');
//     }
//   };

//   useEffect(() => {
//     const fetchFeatured = async () => {
//       try {
//         const { data } = await propertyAPI.featured(6);
//         setFeatured(data.properties);
//       } catch (err) {
//         console.error('Failed to fetch featured:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchFeatured();
//   }, []);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     navigate(`/listings${searchCity ? `?city=${searchCity}` : ''}`);
//   };

//   return (
//     <div>
//       {/* ══════════════ HERO SECTION ══════════════ */}
//       <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary">
//         {/* Background pattern */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
//           <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
//           <div className="max-w-2xl">
//             <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
//               <MapPin size={14} />
//               Relocating to Bangladesh?
//             </span>

//             <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
//               Find Your Next
//               <span className="block text-accent mt-1">Home Sweet Home</span>
//             </h1>

//             <p className="text-lg text-white/70 mt-5 leading-relaxed max-w-lg">
//               Discover rental properties, nearby essentials, and emergency contacts — all in one place. Your relocation companion in Bangladesh.
//             </p>

//             {/* Search Bar */}
//             <form onSubmit={handleSearch} className="mt-8 flex gap-2">
//               <div className="flex-1 relative">
//                 <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search by city — Dhaka, Chittagong, Sylhet..."
//                   value={searchCity}
//                   onChange={(e) => setSearchCity(e.target.value)}
//                   className="w-full pl-11 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-sm"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="bg-accent hover:bg-accent-hover text-white px-6 py-4 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg active:scale-[0.98]"
//               >
//                 <Search size={18} />
//                 <span className="hidden sm:inline">Search</span>
//               </button>
//             </form>

//             {/* Quick stats */}
//             <div className="flex items-center gap-6 mt-8">
//               {[
//                 { val: '5+', label: 'Property Types' },
//                 { val: '100+', label: 'Listings' },
//                 { val: '24/7', label: 'Emergency Help' },
//               ].map(({ val, label }) => (
//                 <div key={label} className="text-center">
//                   <p className="text-2xl font-heading font-bold text-white">{val}</p>
//                   <p className="text-xs text-white/50 mt-0.5">{label}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ══════════════ BROWSE BY TYPE ══════════════ */}
//       <section className="section">
//         <div className="text-center mb-10">
//           <h2 className="text-3xl font-heading font-bold text-gray-900">Browse by Type</h2>
//           <p className="text-muted mt-2">Find the perfect place that fits your needs</p>
//         </div>

//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
//           {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg }) => (
//             <Link
//               key={value}
//               to={`/listings?type=${value}`}
//               className="group"
//             >
//               <div className={`${bg} rounded-2xl p-5 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1`}>
//                 <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
//                   <Icon size={22} className="text-white" />
//                 </div>
//                 <p className="font-heading font-semibold text-sm text-gray-800">{label}</p>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </section>

//       {/* ══════════════ FEATURED LISTINGS ══════════════ */}
//       <section className="section bg-white">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-3xl font-heading font-bold text-gray-900">Featured Listings</h2>
//             <p className="text-muted mt-1">Handpicked properties for you</p>
//           </div>
//           <Link
//             to="/listings"
//             className="hidden sm:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all"
//           >
//             View all <ArrowRight size={16} />
//           </Link>
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center py-16">
//             <Loader2 size={32} className="animate-spin text-primary" />
//           </div>
//         ) : featured.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {featured.map((property) => (
//               <PropertyCard key={property.id} property={property} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-16 text-muted">
//             <Building2 size={48} className="mx-auto mb-3 opacity-30" />
//             <p>No listings yet. Start the backend server and seed the database.</p>
//           </div>
//         )}

//         <div className="text-center mt-8 sm:hidden">
//           <Link to="/listings" className="btn-secondary inline-flex items-center gap-1">
//             View All Listings <ArrowRight size={16} />
//           </Link>
//         </div>
//       </section>

//       {/* ══════════════ HOW IT WORKS ══════════════ */}
//       <section className="section">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
//           <p className="text-muted mt-2">Four simple steps to settle in your new city</p>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, idx) => (
//             <div key={step} className="relative text-center group">
//               {/* Connector line — hidden on last item and mobile */}
//               {idx < 3 && (
//                 <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
//               )}

//               <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg relative z-10">
//                 <Icon size={30} className="text-white" />
//               </div>

//               <span className="text-accent font-heading font-bold text-sm">Step {step}</span>
//               <h3 className="font-heading font-bold text-lg text-gray-900 mt-1">{title}</h3>
//               <p className="text-muted text-sm mt-1">{desc}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* ══════════════ CTA SECTION ══════════════ */}
//       <section className="bg-gradient-to-r from-accent to-orange-500 py-16">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
//             Own a Property? List It Here!
//           </h2>
//           <p className="text-white/80 mt-3 text-lg max-w-xl mx-auto">
//             Reach thousands of renters looking for their next home. It's free to get started.
//           </p>
//           <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
//             <Link
//               to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
//               onClick={handleListPropertyClick}
//               className="bg-white text-accent font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-lg active:scale-[0.98]"
//             >
//               List Your Property
//             </Link>
//             <Link
//               to="/listings"
//               className="text-white/90 font-medium px-8 py-3.5 rounded-xl border-2 border-white/30 hover:border-white/60 transition-all"
//             >
//               Browse Listings
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }


// =============================================
// Home Page — Enhanced UI/UX with Framer Motion
// All logic & functionality preserved exactly
// =============================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import {
  Search, MapPin, Building2, Hotel, Home as HomeIcon,
  DoorOpen, BedDouble, ArrowRight, CheckCircle2,
  Map, AlertTriangle, Loader2, Star, Shield, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../api/property.api';
import useAuthStore from '../store/authStore';
import PropertyCard from '../components/property/PropertyCard';

// ── Data (unchanged) ──────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
  { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', ring: 'ring-teal-200' },
  { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
  { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search, accent: 'from-primary to-primary-light' },
  { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map, accent: 'from-blue-500 to-indigo-500' },
  { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2, accent: 'from-emerald-500 to-teal-500' },
  { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle, accent: 'from-rose-500 to-red-500' },
];

const STATS = [
  { val: '5+', label: 'Property Types', icon: Building2 },
  { val: '100+', label: 'Active Listings', icon: Star },
  { val: '24/7', label: 'Emergency Help', icon: Shield },
];

// ── Animation Variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

// ── Reusable animated section wrapper ─────────────────────────────────
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function Home() {
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  // ── Unchanged logic ──────────────────────────────────────────────────
  const handleListPropertyClick = (e) => {
    if (user && user.role !== 'owner' && user.role !== 'admin') {
      e.preventDefault();
      toast.error('You need an Owner account to list properties.');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await propertyAPI.featured(6);
        setFeatured(data.properties);
      } catch (err) {
        console.error('Failed to fetch featured:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings${searchCity ? `?city=${searchCity}` : ''}`);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]">

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 right-0 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-7">
                  <MapPin size={13} className="text-accent" />
                  Your Relocation Companion in Bangladesh
                </span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.05] tracking-tight"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <motion.span variants={fadeUp} className="block text-white">
                  Your Perfect
                </motion.span>
                <motion.span variants={fadeUp} className="block text-white">
                  Home is
                </motion.span>
                <motion.span
                  variants={fadeUp}
                  className="block"
                  style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}
                >
                  Waiting for You
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-lg text-slate-400 mt-6 leading-relaxed max-w-[480px]"
                variants={fadeUp}
                custom={3}
                initial="hidden"
                animate="visible"
              >
                Browse verified rentals, discover essentials around your new neighborhood, and access emergency contacts — all in one place.
              </motion.p>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                className="mt-9"
                variants={fadeUp}
                custom={4}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className={`flex gap-2 p-2 rounded-2xl border transition-all duration-300 ${searchFocused
                      ? 'bg-white border-accent shadow-[0_0_0_4px_rgba(249,115,22,0.15)]'
                      : 'bg-white/8 border-white/15 backdrop-blur-sm'
                    }`}
                  animate={{ scale: searchFocused ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-1 relative">
                    <MapPin
                      size={17}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-accent' : 'text-slate-400'}`}
                    />
                    <input
                      type="text"
                      placeholder="Try Dhaka, Chittagong, Sylhet..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className={`w-full pl-10 pr-4 py-3.5 bg-transparent rounded-xl text-sm focus:outline-none transition-colors duration-200 ${searchFocused ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-slate-500'
                        }`}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-accent hover:bg-accent-hover text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-orange-500/25 transition-colors"
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline">Search</span>
                  </motion.button>
                </motion.div>
              </motion.form>

              {/* Stats */}
              <motion.div
                className="flex items-center gap-8 mt-9"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                {STATS.map(({ val, label, icon: Icon }, i) => (
                  <motion.div key={label} variants={fadeUp} custom={5 + i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                      <Icon size={15} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xl font-heading font-bold text-white leading-none">{val}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right — Decorative floating cards */}
            <div className="hidden lg:block relative h-[480px]">
              {/* Main card */}
              <motion.div
                className="absolute top-12 right-0 w-72 bg-white/8 backdrop-blur-xl border border-white/12 rounded-3xl p-5 shadow-2xl"
                initial={{ opacity: 0, x: 40, y: 0 }}
                animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                transition={{ opacity: { duration: 0.7, delay: 0.5 }, x: { duration: 0.7, delay: 0.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                    <HomeIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">2BR Apartment</p>
                    <p className="text-slate-400 text-xs">Gulshan, Dhaka</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Starting from</p>
                    <p className="text-accent font-heading font-bold text-xl">৳18,000<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <CheckCircle2 size={11} />
                    Verified
                  </div>
                </div>
              </motion.div>

              {/* Secondary card */}
              <motion.div
                className="absolute bottom-20 left-4 w-60 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-4 shadow-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                transition={{ opacity: { duration: 0.7, delay: 0.8 }, x: { duration: 0.7, delay: 0.8 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 } }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-yellow-400" />
                  <p className="text-white text-xs font-semibold">Instant Book Available</p>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">Skip the waiting. Confirm your booking right now.</p>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                className="absolute top-56 left-16 bg-gradient-to-br from-accent to-orange-400 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-orange-500/30 text-xs font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: [-2, 2, -2] }}
                transition={{ opacity: { duration: 0.5, delay: 1.1 }, scale: { duration: 0.5, delay: 1.1 }, rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 } }}
              >
                🏠 100+ Listings
              </motion.div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-14 fill-gray-50">
            <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BROWSE BY TYPE
      ══════════════════════════════════════════════════ */}
      <section className="section bg-gray-50">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Find What You Need</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Browse by Type</h2>
            <p className="text-muted mt-2 max-w-md mx-auto">Whether it's a hotel for the night or a flat for the year — we've got you covered.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg, ring }, i) => (
              <motion.div key={value} variants={scaleIn} custom={i}>
                <Link to={`/listings?type=${value}`} className="group block">
                  <div className={`${bg} rounded-2xl p-5 text-center border border-transparent hover:border-current hover:${ring} hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5`}>
                    <div className={`w-13 h-13 w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <p className="font-heading font-bold text-sm text-gray-800 group-hover:text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-500 transition-colors">Explore →</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-1">Handpicked for You</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Featured Listings</h2>
              <p className="text-muted mt-1.5">Our top picks across Bangladesh's most sought-after areas</p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:flex items-center gap-1.5 text-accent font-semibold text-sm hover:gap-3 transition-all duration-200 group"
            >
              View all
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={32} className="text-accent" />
              </motion.div>
              <p className="text-sm text-muted">Finding the best properties for you...</p>
            </div>
          ) : featured.length > 0 ? (
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featured.map((property, i) => (
                <motion.div key={property.id} variants={fadeUp} custom={i}>
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                <Building2 size={36} className="text-gray-300" />
              </div>
              <p className="text-muted text-sm">No listings yet. Start the backend server and seed the database.</p>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-center mt-8 sm:hidden">
            <Link to="/listings" className="btn-secondary inline-flex items-center gap-1.5">
              View All Listings <ArrowRight size={15} />
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="section bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        </div>

        <AnimatedSection>
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
            <p className="text-muted mt-2">From search to settled — four steps is all it takes.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, accent }, idx) => (
              <motion.div
                key={step}
                variants={fadeUp}
                custom={idx}
                className="relative group"
              >
                {/* Connector */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[62%] w-[76%] h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}

                <div className="relative z-10 text-center">
                  {/* Step number bubble */}
                  <div className="relative inline-block mb-5">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}
                    >
                      <Icon size={30} className="text-white" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-accent flex items-center justify-center shadow-sm">
                      <span className="text-accent font-bold text-[9px]">{step}</span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-gray-900">{title}</h3>
                  <p className="text-muted text-sm mt-2 leading-relaxed max-w-[180px] mx-auto">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]" />
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <motion.p variants={fadeUp} className="text-accent font-semibold text-sm uppercase tracking-widest mb-4">
              For Property Owners
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
              Reach Thousands of
              <span className="block" style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
                Verified Renters
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-400 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
              List your property on MoveMate and connect with qualified tenants actively looking for their next home. It's free to get started.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
                  onClick={handleListPropertyClick}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 transition-colors text-sm"
                >
                  List Your Property
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/8 transition-all text-sm backdrop-blur-sm"
                >
                  Browse Listings
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-8 mt-12">
              {[
                { icon: Shield, text: 'Verified Listings' },
                { icon: Zap, text: 'Instant Booking' },
                { icon: Star, text: 'Trusted Reviews' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-slate-500 text-xs">
                  <Icon size={13} className="text-accent" />
                  {text}
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
// End of file

// Start of: ./client\src\pages\Listings.jsx
// =============================================
// Listings Page — Filters + Property Grid + Pagination
// =============================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal, X, Search, MapPin, ChevronLeft, ChevronRight,
  Building2, Loader2, LayoutGrid, LayoutList
} from 'lucide-react';
import { propertyAPI } from '../api/property.api';
import PropertyCard from '../components/property/PropertyCard';
import { PROPERTY_TYPES } from '../utils/constants';

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state — initialized from URL params
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    sort: searchParams.get('sort') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Fetch properties whenever filters change
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Build query params (exclude empty values)
        const params = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params[key] = value;
          }
        });
        params.limit = 12;

        const { data } = await propertyAPI.list(params);
        setProperties(data.properties);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined && !(key === 'page' && value === 1)) {
        params.set(key, value);
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ type: '', city: '', minPrice: '', maxPrice: '', bedrooms: '', sort: '', page: 1 });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, val]) => key !== 'page' && key !== 'sort' && val !== ''
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">Property Listings</h1>
              <p className="text-muted text-sm mt-0.5">
                {loading ? 'Searching...' : `${pagination.total} propert${pagination.total === 1 ? 'y' : 'ies'} found`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field !py-2 !px-3 !w-auto text-sm"
              >
                <option value="">Newest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-secondary !py-2 !px-3 flex items-center gap-1.5 text-sm relative"
              >
                <SlidersHorizontal size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* ══════════ FILTER SIDEBAR ══════════ */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden lg:block'} lg:w-64 shrink-0`}>
            <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto shadow-modal' : ''} lg:static lg:w-auto lg:shadow-none lg:p-0`}>
              {/* Mobile close */}
              {showFilters && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="font-heading font-semibold">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-border p-5 space-y-5 lg:sticky lg:top-24">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm text-gray-800">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-accent hover:text-accent-hover font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Any city"
                      value={filters.city}
                      onChange={(e) => updateFilter('city', e.target.value)}
                      className="input-field !py-2 !pl-9 text-sm"
                    />
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Property Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PROPERTY_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateFilter('type', filters.type === value ? '' : value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.type === value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Price Range (৳)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      className="input-field !py-2 text-sm w-1/2"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      className="input-field !py-2 text-sm w-1/2"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bedrooms (min)</label>
                  <div className="flex gap-1.5">
                    {['', '1', '2', '3', '4'].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateFilter('bedrooms', filters.bedrooms === val ? '' : val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.bedrooms === val
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {val || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply (mobile only) */}
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn-primary w-full lg:hidden text-sm"
                >
                  Show Results
                </button>
              </div>
            </div>
          </aside>

          {/* ══════════ RESULTS GRID ══════════ */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={36} className="animate-spin text-primary" />
              </div>
            ) : properties.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                      .map((page, idx, arr) => (
                        <span key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-1 text-muted">…</span>
                          )}
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, page }))}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pagination.page === page
                              ? 'bg-primary text-white'
                              : 'border border-border hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Building2 size={56} className="mx-auto mb-4 text-gray-300" />
                <h3 className="font-heading font-semibold text-lg text-gray-700">No properties found</h3>
                <p className="text-muted text-sm mt-1">Try adjusting your filters or search a different city</p>
                <button onClick={clearFilters} className="btn-secondary mt-4 text-sm">
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\NotFound.jsx
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

// End of file

// Start of: ./client\src\pages\PropertyDetail.jsx
// =============================================
// Property Detail Page — Assembles All Sub-Components
// =============================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Users, Ruler, Star,
  Wifi, Wind, Car, Utensils, Shield, Zap, ChevronRight,
  Loader2, ArrowLeft, Heart, Share2, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../api/property.api';
import { savedAPI } from '../api/booking.api';
import useAuthStore from '../store/authStore';
import ImageGallery from '../components/property/ImageGallery';
import BookingPanel from '../components/property/BookingPanel';
import OwnerContactCard from '../components/property/OwnerContactCard';
import ReviewSection from '../components/property/ReviewSection';
import MapView from '../components/shared/MapView';

const AMENITY_ICONS = {
  WiFi: Wifi, AC: Wind, Parking: Car, Kitchen: Utensils,
  Security: Shield, Generator: Zap,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await propertyAPI.getById(id);
        setProperty(data.property);

        // Check if saved
        if (user) {
          try {
            const { data: savedData } = await savedAPI.check(id);
            setIsSaved(savedData.isSaved);
          } catch {}
        }
      } catch (err) {
        console.error('Failed to fetch property:', err);
        toast.error('Property not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, user]);

  const toggleSave = async () => {
    if (!user) { toast.error('Login to save listings'); return; }
    setSavingToggle(true);
    try {
      if (isSaved) {
        await savedAPI.unsave(id);
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        await savedAPI.save(id);
        setIsSaved(true);
        toast.success('Saved to your list!');
      }
    } catch (err) {
      toast.error('Failed to update saved list');
    } finally {
      setSavingToggle(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="section text-center py-20">
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Property not found</h2>
        <Link to="/listings" className="text-accent font-medium">Browse listings →</Link>
      </div>
    );
  }

  const {
    title, description, city, address, property_type, booking_model,
    bedrooms, bathrooms, max_guests, area_sqft, base_price, price_unit,
    images, amenities, rules, avg_rating, review_count,
    latitude, longitude,
  } = property;

  const typeLabels = {
    hotel: 'Hotel', flat: 'Flat', apartment: 'Apartment',
    sublet: 'Sublet', tolet: 'To-Let', room: 'Room',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-muted gap-1">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight size={14} />
            <Link to="/listings" className="hover:text-primary">Listings</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Image Gallery */}
        <ImageGallery images={images} />

        {/* Title Row */}
        <div className="flex items-start justify-between mt-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-primary/10 text-primary text-xs">
                {typeLabels[property_type]}
              </span>
              {avg_rating > 0 && (
                <span className="flex items-center gap-1 text-sm">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{parseFloat(avg_rating).toFixed(1)}</span>
                  <span className="text-muted">({review_count} reviews)</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">{title}</h1>
            <p className="flex items-center gap-1.5 text-muted mt-1.5">
              <MapPin size={16} />
              {address}, {city}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSave}
              disabled={savingToggle}
              className={`p-2.5 rounded-xl border transition-all ${
                isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'border-border hover:bg-gray-50 text-gray-500'
              }`}
            >
              <Heart size={20} className={isSaved ? 'fill-red-500' : ''} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-border hover:bg-gray-50 text-gray-500 transition-all"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* ══════════ Main Layout: Content + Sidebar ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: BedDouble, label: 'Bedrooms', value: bedrooms },
                { icon: Bath, label: 'Bathrooms', value: bathrooms },
                { icon: Users, label: 'Max Guests', value: max_guests },
                { icon: Ruler, label: 'Area', value: area_sqft ? `${area_sqft} sqft` : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-4 text-center">
                  <Icon size={22} className="mx-auto mb-2 text-primary" />
                  <p className="text-lg font-heading font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="text-lg font-heading font-bold text-gray-900 mb-3">About this place</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {description || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {amenities && amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((amenity, idx) => {
                    const name = typeof amenity === 'string' ? amenity : amenity.name;
                    const Icon = AMENITY_ICONS[name] || CheckCircle;
                    return (
                      <div key={idx} className="flex items-center gap-2.5 text-sm text-gray-600 py-2">
                        <Icon size={16} className="text-primary shrink-0" />
                        {name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* House Rules */}
            {rules && rules.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">House Rules</h2>
                <div className="space-y-2.5">
                  {rules.map((rule, idx) => {
                    const text = typeof rule === 'string' ? rule : rule.rule_text;
                    return (
                      <p key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-accent font-bold mt-0.5">•</span>
                        {text}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Map */}
            {(latitude || longitude) && (
              <div>
                <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Location</h2>
                <MapView
                  latitude={latitude}
                  longitude={longitude}
                  title={title}
                  className="h-[300px]"
                />
              </div>
            )}

            {/* Reviews */}
            <ReviewSection propertyId={id} />
          </div>

          {/* Right Column — Booking + Owner */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <BookingPanel property={property} />
            <OwnerContactCard property={property} isLoggedIn={!!user} />
          </div>
        </div>
      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\auth\Login.jsx
// =============================================
// Login Page — React Hook Form + Zod Validation
// =============================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

// Zod schema — validates form data before submission
const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // React Hook Form — connects to Zod for validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      toast.success(`Welcome back, ${data.user.name}!`);

      // Redirect to where user was trying to go, or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xl">M</span>
            </div>
            <span className="font-heading font-bold text-2xl text-primary">
              Move<span className="text-accent">Mate</span>
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome back</h1>
          <p className="text-muted mt-1">Sign in to your account to continue</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-danger focus:ring-danger/20' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pr-11 ${errors.password ? 'border-danger focus:ring-danger/20' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent font-medium hover:text-accent-hover">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo accounts hint */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs font-medium text-blue-700 mb-1">🔑 Demo Accounts</p>
          <p className="text-xs text-blue-600">
            <strong>Owner:</strong> owner1@dummyinbox.com / Test@1234
          </p>
          <p className="text-xs text-blue-600">
            <strong>User:</strong> user1@dummyinbox.com / Test@1234
          </p>
        </div>
      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\auth\Register.jsx
// =============================================
// Register Page — Role Selection + React Hook Form + Zod
// =============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Loader2, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth.api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: selectedRole,
      });

      toast.success(`Welcome to MoveMate, ${data.data?.user?.name || formData.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xl">M</span>
            </div>
            <span className="font-heading font-bold text-2xl text-primary">
              Move<span className="text-accent">Mate</span>
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Create your account</h1>
          <p className="text-muted mt-1">Join MoveMate and start exploring</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-elevated p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('user')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedRole === 'user'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-gray-500 hover:border-gray-300'
                }`}
              >
                <User size={18} />
                Find a Place
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('owner')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedRole === 'owner'
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-border text-gray-500 hover:border-gray-300'
                }`}
              >
                <Building2 size={18} />
                List Property
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'border-danger' : ''}`}
                {...register('name')}
              />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-danger' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+880 17XX-XXXXXX"
                className="input-field"
                {...register('phone')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className={`input-field pr-11 ${errors.password ? 'border-danger' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                className={`input-field ${errors.confirmPassword ? 'border-danger' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:text-accent-hover">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\dashboard\BookingDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Mail, Phone, MapPin,
  CreditCard, FileText, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI } from '../../api/booking.api';
import useAuthStore from '../../store/authStore';
import BookingStatusBadge from '../../components/shared/BookingStatusBadge';
import { formatDate } from '../../utils/formatDate';
import { formatPrice } from '../../utils/formatPrice';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await bookingAPI.getById(id);
        setBooking(data.booking);
      } catch (err) {
        console.error('Failed to fetch booking detail:', err);
        toast.error('Booking not found or access denied');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  const handleStatusUpdate = async (status, responseMessage = '') => {
    setActionLoading(true);
    try {
      await bookingAPI.updateStatus(id, { status, owner_response: responseMessage });
      toast.success(`Booking ${status}`);
      setBooking(prev => ({ ...prev, status }));
    } catch (err) {
      toast.error('Failed to update booking status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  const isOwner = user?.id === booking.owner_id;

  return (
    <div className="min-h-screen bg-white pb-16 animate-in fade-in duration-500">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white/90 border-b border-gray-200/80 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:-translate-x-1 active:scale-95 flex items-center justify-center group"
            >
              <ArrowLeft size={20} className="text-gray-700 group-hover:text-gray-900" />
            </button>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-gray-900 hidden sm:block">
              Booking Overview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium hidden sm:block">ID: {booking.id}</span>
            <div className="transition-transform duration-300 hover:scale-105">
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-16">

          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            {/* Large Hero Image with Hover Overlay */}
            <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] rounded-3xl overflow-hidden bg-gray-100 mb-8 shadow-sm group cursor-pointer">
              <img
                src={booking.property_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200'}
                alt={booking.property_title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
            </div>

            {/* Property Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3 tracking-tight">
                <Link
                  to={`/listings/${booking.property_id}`}
                  className="hover:text-primary transition-colors duration-300 relative inline-block group"
                >
                  {booking.property_title}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </h2>
              <p className="flex items-center gap-2 text-sm sm:text-base text-gray-600 font-medium group cursor-pointer w-max">
                <MapPin size={18} className="text-gray-400 group-hover:text-primary transition-colors duration-300" />
                <span className="group-hover:text-gray-900 transition-colors duration-300">{booking.property_address}</span>
              </p>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Airbnb-style Dates Box (Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded-2xl overflow-hidden mb-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Check-in</div>
                <div className="text-gray-900 font-semibold text-base sm:text-lg">
                  {booking.check_in ? formatDate(booking.check_in) : 'Not specified'}
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-white hover:bg-gray-50 transition-colors duration-300 cursor-pointer">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Check-out</div>
                <div className="text-gray-900 font-semibold text-base sm:text-lg">
                  {booking.check_out ? formatDate(booking.check_out) : 'Not specified'}
                </div>
              </div>
            </div>

            {/* Request Message Section */}
            {booking.message && (
              <>
                <div className="mb-8">
                  <h3 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={22} className="text-gray-400" /> Message from Requester
                  </h3>
                  <div className="bg-[#F7F7F9] rounded-2xl p-5 sm:p-6 text-gray-700 text-sm sm:text-base leading-relaxed border border-transparent transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-gray-200 hover:bg-white">
                    "{booking.message}"
                  </div>
                </div>
                <hr className="border-gray-200 my-8" />
              </>
            )}

            {/* Requester / User Details */}
            <div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User size={22} className="text-gray-400" />
                {isOwner ? 'Requester Details' : 'Your Details'}
              </h3>
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl sm:text-2xl shrink-0 transition-transform duration-300 hover:scale-110 hover:bg-primary/20 cursor-pointer">
                  {booking.user_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div>
                    <p className="font-bold text-gray-900 text-base sm:text-lg">{booking.user_name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Booked on {formatDate(booking.created_at)}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <p className="flex items-center gap-2 text-sm text-gray-600 font-medium group">
                      <Mail size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                      <a href={`mailto:${booking.user_email}`} className="hover:text-primary transition-colors hover:underline">
                        {booking.user_email}
                      </a>
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600 font-medium group">
                      <Phone size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                      <a href={`tel:${booking.user_phone}`} className="hover:text-primary transition-colors hover:underline">
                        {booking.user_phone || 'Not provided'}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Column */}
          <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 pb-10 lg:pb-0">
            <div className="sticky top-24 lg:top-28 space-y-6">

              {/* Payment Summary Card */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]">
                <h3 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={24} className="text-primary animate-pulse" /> Price Details
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm sm:text-base text-gray-600 group hover:text-gray-900 transition-colors">
                    <span>{formatPrice(booking.base_price, booking.price_unit)} x {booking.guests} guest(s)</span>
                    <span className="font-medium text-gray-900">{formatPrice(booking.base_price, booking.price_unit)}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200 flex justify-between items-center mb-6">
                  <span className="font-bold text-gray-900 text-base sm:text-lg">Total Amount</span>
                  <span className="font-bold text-primary text-xl sm:text-2xl transition-transform duration-300 hover:scale-105">
                    {booking.total_price ? formatPrice(booking.total_price) : 'TBD'}
                  </span>
                </div>

                {/* Owner Actions */}
                {isOwner && booking.status === 'pending' && (
                  <div className="pt-6 border-t border-gray-200 animate-in slide-in-from-bottom-4 duration-500">
                    <p className="text-sm font-medium text-gray-900 mb-4">Action Required: Review this request</p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleStatusUpdate('confirmed', 'Welcome! Your booking is confirmed.')}
                        disabled={actionLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                        Accept Booking
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('cancelled', 'Sorry, the property is unavailable.')}
                        disabled={actionLoading}
                        className="w-full py-3.5 bg-white text-gray-900 border border-gray-300 hover:border-gray-900 hover:bg-gray-50 rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {actionLoading && <Loader2 size={20} className="animate-spin" />}
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust / Security Badge */}
              <div className="text-center px-4">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5 transition-colors hover:text-gray-700 cursor-default">
                  Your payment information is secure.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// End of file

// Start of: ./client\src\pages\dashboard\OwnerDashboard.jsx
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
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleBookingAction(b.id, 'confirmed')}
                          className="flex-1 bg-green-50 text-green-700 font-medium py-2 rounded-lg text-sm hover:bg-green-100 transition-colors"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleBookingAction(b.id, 'cancelled')}
                          className="flex-1 bg-red-50 text-red-700 font-medium py-2 rounded-lg text-sm hover:bg-red-100 transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                      <Link to={`/bookings/${b.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                        <Eye size={16} /> View Full Booking Details
                      </Link>
                    </div>
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

// End of file

// Start of: ./client\src\pages\dashboard\UserDashboard.jsx
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

// End of file

// Start of: ./client\src\pages\owner\AddListing.jsx
// =============================================
// Add Listing — Multi-Step Property Form
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, BedDouble, DollarSign, Image as ImageIcon,
  CheckCircle, ChevronLeft, ChevronRight, Loader2, Upload, X, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../../api/property.api';
import { PROPERTY_TYPES, BOOKING_MODELS, AMENITIES_LIST } from '../../utils/constants';

const STEPS = [
  { label: 'Basics', icon: Building2 },
  { label: 'Location', icon: MapPin },
  { label: 'Details', icon: BedDouble },
  { label: 'Pricing', icon: DollarSign },
  { label: 'Images', icon: ImageIcon },
  { label: 'Review', icon: CheckCircle },
];

export default function AddListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [form, setForm] = useState({
    title: '', description: '', property_type: 'flat', booking_model: 'long_term',
    city: '', address: '', latitude: '', longitude: '',
    bedrooms: 1, bathrooms: 1, max_guests: 2, area_sqft: '',
    base_price: '', price_unit: 'per_month', instant_book: false,
    amenities: [], rules: [''],
  });

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleAmenity = (name) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(name)
        ? f.amenities.filter(a => a !== name)
        : [...f.amenities, name],
    }));
  };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, ''] }));
  const removeRule = (idx) => setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
  const updateRule = (idx, val) => setForm(f => ({
    ...f, rules: f.rules.map((r, i) => i === idx ? val : r),
  }));

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.city || !form.base_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create property
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price),
        area_sqft: form.area_sqft ? parseInt(form.area_sqft) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        rules: form.rules.filter(r => r.trim()),
      };
      const { data } = await propertyAPI.create(payload);
      const propertyId = data.property.id;

      // 2. Upload images
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(f => formData.append('images', f));
        await propertyAPI.uploadImages(propertyId, formData);
      }

      toast.success('Listing created successfully!');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.title && form.property_type;
    if (step === 1) return form.city;
    if (step === 3) return form.base_price;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-xl font-heading font-bold text-gray-900">Add New Listing</h1>
          <p className="text-sm text-muted">Fill out the details to list your property</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map(({ label, icon: Icon }, idx) => (
              <div key={label} className="flex items-center flex-1">
                <button
                  onClick={() => idx <= step && setStep(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    idx === step ? 'bg-accent text-white' :
                    idx < step ? 'bg-green-100 text-green-700' :
                    'text-gray-400'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${idx < step ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
          {/* ══════════ STEP 0: BASICS ══════════ */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => update('title', e.target.value)}
                  placeholder="Beautiful 2-Bedroom Flat in Dhanmondi" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                  placeholder="Describe your property..." rows={4} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <button key={value} onClick={() => update('property_type', value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.property_type === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Model *</label>
                <div className="grid grid-cols-3 gap-2">
                  {BOOKING_MODELS.map(({ value, label }) => (
                    <button key={value} onClick={() => update('booking_model', value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.booking_model === value ? 'border-accent bg-accent-light text-accent' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 1: LOCATION ══════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <input value={form.city} onChange={(e) => update('city', e.target.value)}
                  placeholder="Dhaka" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address</label>
                <input value={form.address} onChange={(e) => update('address', e.target.value)}
                  placeholder="House 12, Road 5, Dhanmondi" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
                  <input type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)}
                    placeholder="23.8103" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
                  <input type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)}
                    placeholder="90.4125" className="input-field" />
                </div>
              </div>
              <p className="text-xs text-muted">Tip: Get coordinates from Google Maps → Right-click any spot → Copy coordinates</p>
            </div>
          )}

          {/* ══════════ STEP 2: DETAILS ══════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: 'bedrooms', label: 'Bedrooms', max: 10 },
                  { key: 'bathrooms', label: 'Bathrooms', max: 5 },
                  { key: 'max_guests', label: 'Max Guests', max: 20 },
                ].map(({ key, label, max }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <select value={form[key]} onChange={(e) => update(key, parseInt(e.target.value))} className="input-field">
                      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area (sqft)</label>
                  <input type="number" value={form.area_sqft} onChange={(e) => update('area_sqft', e.target.value)}
                    placeholder="800" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(name => (
                    <button key={name} onClick={() => toggleAmenity(name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        form.amenities.includes(name) ? 'bg-primary text-white border-primary' : 'border-border text-gray-500 hover:border-gray-300'
                      }`}>{name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Rules</label>
                {form.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input value={rule} onChange={(e) => updateRule(idx, e.target.value)}
                      placeholder="e.g., No smoking" className="input-field text-sm" />
                    {form.rules.length > 1 && (
                      <button onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addRule} className="text-sm text-accent font-medium flex items-center gap-1 mt-1">
                  <Plus size={14} /> Add Rule
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: PRICING ══════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price (৳) *</label>
                <input type="number" value={form.base_price} onChange={(e) => update('base_price', e.target.value)}
                  placeholder="15000" className="input-field text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Unit</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'per_month', label: 'Per Month' },
                    { value: 'per_night', label: 'Per Night' },
                  ].map(({ value, label }) => (
                    <button key={value} onClick={() => update('price_unit', value)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.price_unit === value ? 'border-accent bg-accent-light text-accent' : 'border-border text-gray-500'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              {form.booking_model === 'short_term' && (
                <label className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" checked={form.instant_book}
                    onChange={(e) => update('instant_book', e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Enable Instant Booking</p>
                    <p className="text-xs text-muted">Renters can book without your approval</p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* ══════════ STEP 4: IMAGES ══════════ */}
          {step === 4 && (
            <div>
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 transition-colors">
                <Upload size={36} className="mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-700 text-sm">Drag & drop or click to upload</p>
                <p className="text-xs text-muted mt-1">JPEG, PNG • Max 5MB each • Up to 10 images</p>
                <input type="file" multiple accept="image/*" onChange={handleImageSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer" style={{ position: 'relative' }} />
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-accent text-white text-[9px] px-1.5 py-0.5 rounded font-bold">PRIMARY</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ STEP 5: REVIEW ══════════ */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-lg">Review Your Listing</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Title', form.title],
                  ['Type', form.property_type],
                  ['Booking Model', form.booking_model.replace('_', ' ')],
                  ['City', form.city],
                  ['Address', form.address || '—'],
                  ['Bedrooms', form.bedrooms],
                  ['Bathrooms', form.bathrooms],
                  ['Max Guests', form.max_guests],
                  ['Price', `৳${form.base_price} ${form.price_unit.replace('_', '/')}`],
                  ['Images', `${imageFiles.length} uploaded`],
                  ['Amenities', form.amenities.length > 0 ? form.amenities.join(', ') : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-medium text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-30">
              <ChevronLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="btn-primary flex items-center gap-1 text-sm">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Creating...' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// End of file

