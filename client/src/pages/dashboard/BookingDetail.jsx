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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white rounded-full border border-border hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 flex items-center gap-3">
              Booking Details
              <BookingStatusBadge status={booking.status} />
            </h1>
            <p className="text-muted text-sm mt-1">ID: {booking.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Property Card */}
            <div className="bg-white rounded-2xl border border-border p-5 flex flex-col sm:flex-row gap-5 shadow-sm">
              <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={booking.property_image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                  alt={booking.property_title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-heading font-bold text-gray-900 mb-1">
                  <Link to={`/listings/${booking.property_id}`} className="hover:text-primary transition-colors">
                    {booking.property_title}
                  </Link>
                </h2>
                <p className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                  <MapPin size={16} className="text-muted" /> {booking.property_address}
                </p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted block text-xs">Check-in</span>
                    <span className="font-medium text-gray-900">{booking.check_in ? formatDate(booking.check_in) : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted block text-xs">Check-out</span>
                    <span className="font-medium text-gray-900">{booking.check_out ? formatDate(booking.check_out) : 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Message */}
            {booking.message && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Request Message
                </h3>
                <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-xl italic">
                  "{booking.message}"
                </p>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && booking.status === 'pending' && (
              <div className="bg-gradient-to-r from-primary/5 to-primary-light/5 border border-primary/20 rounded-2xl p-6 shadow-sm">
                <h3 className="font-heading font-semibold text-gray-900 mb-4">Action Required</h3>
                <p className="text-sm text-gray-600 mb-5">Review the booking details and choose to accept or reject this request.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleStatusUpdate('confirmed', 'Welcome! Your booking is confirmed.')}
                    disabled={actionLoading}
                    className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Accept Booking
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('cancelled', 'Sorry, the property is unavailable.')}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border border-red-200"
                  >
                    {actionLoading && <Loader2 size={18} className="animate-spin" />}
                    Reject Booking
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Requester Profile Profile (Visible to Owner, or show Owner info to User) */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" /> 
                {isOwner ? 'Requester Details' : 'Your Details'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {booking.user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{booking.user_name}</p>
                    <p className="text-xs text-muted">Booked on {formatDate(booking.created_at)}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-muted" />
                    <a href={`mailto:${booking.user_email}`} className="hover:text-primary transition-colors">{booking.user_email}</a>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} className="text-muted" />
                    <a href={`tel:${booking.user_phone}`} className="hover:text-primary transition-colors">{booking.user_phone || 'Not provided'}</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Payment Summary
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base Price</span>
                  <span>{formatPrice(booking.base_price, booking.price_unit)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Guests</span>
                  <span>{booking.guests}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-primary">{booking.total_price ? formatPrice(booking.total_price) : 'TBD'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
