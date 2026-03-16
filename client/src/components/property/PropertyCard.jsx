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
