// =============================================
// Booking Panel — 3 Booking Flows in One Component
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Users, CreditCard, Send, CheckCircle, Clock,
  Loader2, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI } from '../../api/booking.api';
import useAuthStore from '../../store/authStore';
import { formatPrice } from '../../utils/formatPrice';

export default function BookingPanel({ property }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    checkIn: '', checkOut: '', guests: 1, message: '',
  });

  const { booking_model, base_price, price_unit, instant_book, title } = property;

  // Calculate nights and total
  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;

  const total = price_unit === 'per_night' ? base_price * nights : base_price;

  const handleBook = async (bookingType) => {
    if (!user) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    if ((booking_model === 'hotel_style' || booking_model === 'short_term') && (!form.checkIn || !form.checkOut)) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const { data } = await bookingAPI.create({
        property_id: property.id,
        booking_type: bookingType,
        check_in: form.checkIn || null,
        check_out: form.checkOut || null,
        guests: form.guests,
        total_price: total || base_price,
        message: form.message || null,
      });

      toast.success('Booking created successfully!');
      navigate(`/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  // ══════════ HOTEL STYLE FLOW ══════════
  if (booking_model === 'hotel_style') {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-2xl font-heading font-bold text-gray-900">
              {formatPrice(base_price, price_unit)}
            </span>
          </div>
          <span className="badge bg-violet-100 text-violet-700">Hotel</span>
        </div>

        {/* Date Picker */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={form.checkIn}
                onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="input-field !py-2.5 !pl-9 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={form.checkOut}
                onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
                min={form.checkIn || new Date().toISOString().split('T')[0]}
                className="input-field !py-2.5 !pl-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
          <div className="relative">
            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={form.guests}
              onChange={(e) => setForm(f => ({ ...f, guests: parseInt(e.target.value) }))}
              className="input-field !py-2.5 !pl-9 text-sm"
            >
              {Array.from({ length: property.max_guests || 4 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Breakdown */}
        {nights > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>৳{base_price.toLocaleString()} × {nights} night{nights > 1 ? 's' : ''}</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-border pt-2">
              <span>Total</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleBook('hotel_pay_now')}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Pay Now
          </button>
          <button
            onClick={() => handleBook('hotel_pay_at_property')}
            disabled={loading}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Clock size={16} />
            Pay at Property
          </button>
        </div>
      </div>
    );
  }

  // ══════════ SHORT TERM FLOW ══════════
  if (booking_model === 'short_term') {
    return (
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-2xl font-heading font-bold text-gray-900">
            {formatPrice(base_price, price_unit)}
          </span>
          <span className="badge bg-blue-100 text-blue-700">
            {instant_book ? 'Instant Book' : 'Request'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="input-field !py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
              min={form.checkIn || new Date().toISOString().split('T')[0]}
              className="input-field !py-2.5 text-sm"
            />
          </div>
        </div>

        {!instant_book && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Message to owner</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell the owner about yourself..."
              rows={3}
              className="input-field text-sm resize-none"
            />
          </div>
        )}

        {nights > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total ({nights} night{nights > 1 ? 's' : ''})</span>
              <span>৳{total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => handleBook(instant_book ? 'short_term_instant' : 'short_term_request')}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : (
            instant_book ? <CheckCircle size={16} /> : <Send size={16} />
          )}
          {instant_book ? 'Book Instantly' : 'Send Booking Request'}
        </button>

        {instant_book && (
          <p className="text-xs text-center text-muted mt-2">✓ Confirmed instantly — no approval needed</p>
        )}
      </div>
    );
  }

  // ══════════ LONG TERM FLOW ══════════
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-2xl font-heading font-bold text-gray-900">
          {formatPrice(base_price, price_unit)}
        </span>
        <span className="badge bg-emerald-100 text-emerald-700">Long Term</span>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 mb-5 text-sm text-emerald-700">
        <p className="font-medium mb-1">How it works:</p>
        <ol className="list-decimal list-inside space-y-1 text-emerald-600">
          <li>Express your interest</li>
          <li>Owner schedules a property visit</li>
          <li>Meet, negotiate, sign agreement</li>
        </ol>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Your message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
          placeholder="Introduce yourself — profession, family size, preferred move-in date..."
          rows={4}
          className="input-field text-sm resize-none"
        />
      </div>

      <button
        onClick={() => handleBook('long_term_inquiry')}
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
        Express Interest
      </button>

      <p className="text-xs text-center text-muted mt-2">
        The owner will review and contact you within 24 hours
      </p>
    </div>
  );
}
