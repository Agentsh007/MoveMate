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