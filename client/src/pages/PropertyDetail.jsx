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
