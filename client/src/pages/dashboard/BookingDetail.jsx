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
