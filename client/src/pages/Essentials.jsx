// =============================================
// Essentials Page — Split-View Map + Service List
// =============================================

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  Search, MapPin, Loader2, Phone, Clock, Navigation,
  Building2, Stethoscope, Landmark, Fuel, UtensilsCrossed, ShoppingBag, X
} from 'lucide-react';
import { essentialsAPI } from '../api/location.api';
import { DHAKA_CENTER } from '../utils/constants';

const CATEGORY_ICONS = {
  Hospital: Stethoscope, Pharmacy: ShoppingBag, Bank: Landmark,
  Restaurant: UtensilsCrossed, 'Fuel Station': Fuel, Default: Building2,
};

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function Essentials() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [userLocation, setUserLocation] = useState(DHAKA_CENTER);
  const [selectedService, setSelectedService] = useState(null);

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log('Location denied, using Dhaka center')
    );
  }, []);

  // Fetch categories
  useEffect(() => {
    essentialsAPI.getCategories().then(({ data }) => setCategories(data.categories || [])).catch(console.error);
  }, []);

  // Fetch nearby services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: searchRadius,
      };
      if (selectedCategory) params.category = selectedCategory;
      const { data } = await essentialsAPI.getNearby(params);
      setServices(data.services || []);
    } catch (err) {
      console.error('Failed to fetch essentials:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedCategory, searchRadius]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const getIcon = (categoryName) => {
    const Icon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.Default;
    return Icon;
  };

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
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const Icon = getIcon(cat.name);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Radius */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted">Radius:</span>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="input-field !py-1.5 !px-2 !w-auto text-xs"
            >
              {[1, 2, 3, 5, 10, 20].map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
          {/* Service List */}
          <div className="overflow-y-auto space-y-3 pr-2">
            <p className="text-sm text-muted mb-2">
              {loading ? 'Searching...' : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : services.length > 0 ? (
              services.map((s) => {
                const Icon = getIcon(s.category_name);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-card ${
                      selectedService?.id === s.id ? 'border-primary ring-2 ring-primary/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900">{s.name}</h3>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {s.address}
                        </p>
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

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-border h-full min-h-[400px]">
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap
                lat={selectedService?.latitude || userLocation.lat}
                lng={selectedService?.longitude || userLocation.lng}
              />

              {/* User marker */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup><strong>You are here</strong></Popup>
              </Marker>

              {/* Service markers */}
              {services.map((s) => s.latitude && s.longitude && (
                <Marker key={s.id} position={[parseFloat(s.latitude), parseFloat(s.longitude)]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{s.name}</strong>
                      <br /><span className="text-gray-500">{s.category_name}</span>
                      {s.phone && <><br /><a href={`tel:${s.phone}`} className="text-blue-600">{s.phone}</a></>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
