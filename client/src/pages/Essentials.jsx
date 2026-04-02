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