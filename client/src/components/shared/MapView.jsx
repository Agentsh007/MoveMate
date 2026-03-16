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
