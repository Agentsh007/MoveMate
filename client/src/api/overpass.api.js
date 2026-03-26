import axios from 'axios';
import api from './axiosInstance';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function getBoundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos(lat * (Math.PI / 180)));
  
  return `${lat - latDelta},${lng - lngDelta},${lat + latDelta},${lng + lngDelta}`;
}

export const fetchOverpassData = async (lat, lng, radiusKm, categoryQuery) => {
  const bbox = getBoundingBox(lat, lng, radiusKm);
  const query = `
    [out:json][timeout:25];
    (
      ${categoryQuery.replace(/{{bbox}}/g, bbox)}
    );
    out body;
    >;
    out skel qt;
  `;
  
  try {
    const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.elements || [];
  } catch (error) {
    console.error('Overpass API error:', error);
    throw error;
  }
};

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Global queue to ensure Nominatim 1 request/sec rate limit
let geocodeQueue = Promise.resolve();

export const getAddressFromCoords = (lat, lng) => {
  return new Promise((resolve) => {
    geocodeQueue = geocodeQueue.then(async () => {
      try {
        const response = await api.get('/essentials/geocode', { params: { lat, lng } });
        
        // Respect Nominatim strict limits even across client updates
        await new Promise(r => setTimeout(r, 1100));

        const addr = response.data.address;
        if (addr) {
           const parts = [addr.house_number, addr.road, addr.neighbourhood, addr.suburb, addr.city || addr.town || addr.village].filter(Boolean);
           resolve(parts.length > 0 ? parts.join(', ') : response.data.display_name);
           return;
        }
        resolve(null);
      } catch (err) {
        console.error("Geocoding error", err);
        await new Promise(r => setTimeout(r, 1100));
        resolve(null);
      }
    });
  });
};
