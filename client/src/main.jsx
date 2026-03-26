import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import useAuthStore from './store/authStore';

// Fix Leaflet's default marker icon issue with Vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Initialize Supabase auth session listener before rendering
useAuthStore.getState().initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
