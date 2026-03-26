// =============================================
// Essentials Page — Split-View Map + Service List
// =============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import {
  MapPin, Phone, Clock, Navigation, Crosshair,
  Building2, Stethoscope, Landmark, Fuel, UtensilsCrossed, ShoppingBag
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
  hospital: '#EF4444', // Red
  pharmacy: '#EF4444', // Red
  restaurant: '#F97316', // Orange
  supermarket: '#3B82F6', // Blue
  bank: '#A855F7', // Purple
  fuel: '#EAB308', // Yellow
  default: '#6B7280' // Gray
};

const getMarkerIcon = (categoryId) => {
  const color = CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default;
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3)); transform: translateY(-4px);">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
    </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

function MapController({ selectedService, markerRefs, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedService && markerRefs.current[selectedService.id]) {
      const marker = markerRefs.current[selectedService.id];
      // Fly to zoom level 18 for max clarity
      map.flyTo([selectedService.latitude, selectedService.longitude], 18, { animate: true, duration: 1.2 });
      
      const timeout = setTimeout(() => {
        if (markerRefs.current[selectedService.id]) {
          markerRefs.current[selectedService.id].openPopup();
        }
      }, 1250); // slight delay to allow flyTo to finish settling
      
      return () => clearTimeout(timeout);
    } else if (!selectedService && userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { animate: true });
    }
  }, [selectedService, map, markerRefs, userLocation]);
  
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
              () => {},
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
      getAddressFromCoords(lat, lng).then(res => {
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
      {loading ? <span className="animate-pulse">Loading exact address...</span> : <span className="line-clamp-2 leading-relaxed">{displayAddress}</span>}
    </p>
  );
}

export default function Essentials() {
  const [categories] = useState(OSM_CATEGORIES);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchRadius, setSearchRadius] = useState(5);
  const [userLocation, setUserLocation] = useState(DHAKA_CENTER);
  const [selectedService, setSelectedService] = useState(null);
  const markerRefs = useRef({});

  // Get user location with cached GPS and high accuracy (longer timeout to allow permission grant)
  useEffect(() => {
    const options = { maximumAge: 60000, timeout: 10000, enableHighAccuracy: true };
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn('Geolocation error or timeout, using fallback location:', err);
        // fallback already set to DHAKA_CENTER
      },
      options
    );
  }, []);

  // Fetch nearby services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      let queryBody = '';
      if (selectedCategory) {
        const cat = OSM_CATEGORIES.find(c => c.id === selectedCategory);
        if (cat) queryBody = cat.query;
      } else {
        queryBody = OSM_CATEGORIES.map(c => c.query).join('\n');
      }

      const elements = await fetchOverpassData(userLocation.lat, userLocation.lng, searchRadius, queryBody);
      
      const parsedServices = elements
        .filter(el => el.type === 'node' && el.tags)
        .map(el => {
          const tags = el.tags;
          let catName = 'Service';
          let catId = 'default';
          let Icon = DEFAULT_ICON;
          
          if (tags.amenity && tags.amenity.match(/hospital|clinic/)) { catName = 'Hospital'; catId = 'hospital'; Icon = Stethoscope; }
          else if (tags.amenity === 'pharmacy') { catName = 'Pharmacy'; catId = 'pharmacy'; Icon = ShoppingBag; }
          else if (tags.amenity && tags.amenity.match(/bank|atm/)) { catName = tags.amenity==='atm'?'ATM':'Bank'; catId = 'bank'; Icon = Landmark; }
          else if (tags.amenity && tags.amenity.match(/restaurant|cafe|fast_food/)) { catName = 'Restaurant'; catId = 'restaurant'; Icon = UtensilsCrossed; }
          else if (tags.shop && tags.shop.match(/supermarket|convenience|grocery/)) { catName = 'Supermarket'; catId = 'supermarket'; Icon = ShoppingBag; }
          else if (tags.amenity === 'fuel') { catName = 'Fuel Station'; catId = 'fuel'; Icon = Fuel; }
          
          const name = tags.name || tags.operator || tags.brand || `${catName} (Unnamed)`;
          const addressParts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean);
          const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

          return {
            id: el.id,
            name,
            category_id: catId,
            category_name: catName,
            icon: Icon,
            latitude: el.lat,
            longitude: el.lon,
            address,
            phone: tags.phone || tags['contact:phone'] || null,
            operating_hours: tags.opening_hours || null,
            distance_km: calculateDistance(userLocation.lat, userLocation.lng, el.lat, el.lon)
          };
        })
        .filter(s => s.distance_km <= searchRadius)
        .sort((a,b) => a.distance_km - b.distance_km);

      // Reset marker refs on new fetch
      markerRefs.current = {};
      setServices(parsedServices);
    } catch (err) {
      console.error('Failed to fetch essentials:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedCategory, searchRadius]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

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
              const Icon = cat.icon;
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
              <div className="py-2">
                <EssentialsListSkeleton count={4} />
              </div>
            ) : services.length > 0 ? (
              services.map((s) => {
                const Icon = s.icon || DEFAULT_ICON;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`bg-white rounded-xl border p-4 cursor-pointer transition-all animate-fade-in hover:shadow-card ${
                      selectedService?.id === s.id ? 'border-primary ring-2 ring-primary/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
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
              <MapController
                selectedService={selectedService}
                markerRefs={markerRefs}
                userLocation={userLocation}
              />
              <LocateMeControl setUserLocation={setUserLocation} />

              {/* User marker */}
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup><strong>You are here</strong></Popup>
              </Marker>

              {/* Service markers */}
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={40}
                showCoverageOnHover={false}
              >
                {services.map((s) => s.latitude && s.longitude && (
                  <Marker 
                    key={s.id} 
                    position={[parseFloat(s.latitude), parseFloat(s.longitude)]}
                    icon={getMarkerIcon(s.category_id)}
                    eventHandlers={{
                      mouseover: (e) => { const el = e.target.getElement(); if (el) el.classList.add('hovered-marker'); },
                      mouseout: (e) => { const el = e.target.getElement(); if (el) el.classList.remove('hovered-marker'); }
                    }}
                    ref={(ref) => {
                      if (ref) markerRefs.current[s.id] = ref;
                    }}
                  >
                    <Popup className="enhanced-popup">
                      <div style={{ minWidth: 180, fontFamily: 'DM Sans, sans-serif' }}>
                        <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>{s.name}</strong>
                        <span style={{ display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 12, background: (CATEGORY_COLORS[s.category_id] || '#6B7280') + '18', color: CATEGORY_COLORS[s.category_id] || '#6B7280', fontWeight: 600, marginBottom: 6 }}>{s.category_name}</span>
                        <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0' }}>{s.address}</p>
                        {s.distance_km != null && <p style={{ fontSize: 11, color: '#F97316', fontWeight: 500, margin: '2px 0' }}>📍 {parseFloat(s.distance_km).toFixed(1)} km away</p>}
                        {s.phone && <p style={{ fontSize: 11, margin: '2px 0' }}><a href={`tel:${s.phone}`} style={{ color: '#10B981', fontWeight: 500 }}>📞 {s.phone}</a></p>}
                        {s.operating_hours && <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0' }}>🕐 {s.operating_hours}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
