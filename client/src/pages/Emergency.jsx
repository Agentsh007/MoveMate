// =============================================
// Emergency Page — Tap-to-Call + Offline-First
// =============================================
// OFFLINE STRATEGY:
// 1. On first load: fetch from API → store in localStorage
// 2. On subsequent loads: show localStorage first (instant), then refresh from API
// 3. If API fails: gracefully fall back to cached data
// =============================================

import { useState, useEffect } from 'react';
import {
  Phone, MapPin, AlertTriangle, Shield, Flame, Ambulance,
  Zap, Baby, Loader2, RefreshCw, WifiOff, Search
} from 'lucide-react';
import { emergencyAPI } from '../api/location.api';
import { DHAKA_CENTER } from '../utils/constants';

const CATEGORY_ICONS = {
  Police: Shield, Fire: Flame, Ambulance: Ambulance,
  'Gas Leak': Zap, "Women's Helpline": Phone, "Child Helpline": Baby,
  Default: AlertTriangle,
};

const CATEGORY_COLORS = {
  Police: 'from-blue-500 to-blue-700',
  Fire: 'from-red-500 to-red-700',
  Ambulance: 'from-green-500 to-green-700',
  'Gas Leak': 'from-amber-500 to-amber-700',
  "Women's Helpline": 'from-pink-500 to-pink-700',
  "Child Helpline": 'from-purple-500 to-purple-700',
  Default: 'from-gray-500 to-gray-700',
};

const CACHE_KEY = 'movemate_emergency_cache';

export default function Emergency() {
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Load from cache first, then API
  useEffect(() => {
    // Step 1: Load from cache immediately
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setContacts(data.contacts || []);
        setCategories(data.categories || []);
        setLoading(false);
      } catch {}
    }

    // Step 2: Fetch from API
    fetchFromAPI();
  }, []);

  const fetchFromAPI = async () => {
    try {
      // Get user location for location-aware results
      let lat = DHAKA_CENTER.lat, lng = DHAKA_CENTER.lng;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation?.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      const [catRes, contactRes] = await Promise.all([
        emergencyAPI.getCategories(),
        emergencyAPI.getContacts({ lat, lng }),
      ]);

      const categories = catRes.data.categories || [];
      const contacts = contactRes.data.contacts || [];

      setCategories(categories);
      setContacts(contacts);
      setIsOffline(false);

      // Cache for offline use
      localStorage.setItem(CACHE_KEY, JSON.stringify({ categories, contacts, cachedAt: Date.now() }));
    } catch (err) {
      console.error('Emergency fetch failed:', err);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name) => CATEGORY_ICONS[name] || CATEGORY_ICONS.Default;
  const getColor = (name) => CATEGORY_COLORS[name] || CATEGORY_COLORS.Default;

  // Filter contacts
  const filtered = contacts.filter(c => {
    const matchesSearch = !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);
    const matchesCategory = !selectedCategory || c.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = {};
  filtered.forEach(c => {
    const cat = c.category_name || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">Emergency Contacts</h1>
              <p className="text-white/70 text-sm">Tap to call — works offline</p>
            </div>
          </div>

          {isOffline && (
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mt-3">
              <WifiOff size={14} className="text-white/70" />
              <span className="text-xs text-white/70">Showing cached data — tap to refresh</span>
              <button onClick={fetchFromAPI} className="ml-auto text-white/90 hover:text-white">
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field !pl-10"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                !selectedCategory ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => {
              const Icon = getIcon(cat.name);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={12} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-red-500" />
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(grouped).map(([categoryName, categoryContacts]) => {
              const Icon = getIcon(categoryName);
              const color = getColor(categoryName);
              return (
                <div key={categoryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <h2 className="font-heading font-bold text-gray-900">{categoryName}</h2>
                    <span className="text-xs text-muted">({categoryContacts.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryContacts.map(contact => (
                      <a
                        key={contact.id}
                        href={`tel:${contact.phone}`}
                        className="bg-white rounded-xl border border-border p-4 hover:shadow-elevated hover:border-red-200 transition-all group active:scale-[0.98]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors">
                              {contact.name}
                            </h3>
                            {contact.address && (
                              <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                                <MapPin size={10} /> {contact.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 bg-red-50 rounded-lg p-2.5 group-hover:bg-red-100 transition-colors">
                          <Phone size={16} className="text-red-600 shrink-0" />
                          <span className="text-red-700 font-bold text-sm">{contact.phone}</span>
                          <span className="ml-auto text-xs text-red-500 font-medium">TAP TO CALL</span>
                        </div>

                        {contact.available_24h && (
                          <p className="text-[10px] text-green-600 font-medium mt-2">● Available 24/7</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-border">
            <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-heading font-semibold text-gray-700">No contacts found</p>
            <p className="text-sm text-muted mt-1">Try clearing your search filters</p>
          </div>
        )}

        {/* Emergency Banner */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-heading font-bold text-lg">🚨 In case of extreme emergency</p>
          <a href="tel:999" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl mt-3 font-bold text-lg hover:bg-red-700 transition-colors active:scale-[0.98]">
            <Phone size={20} />
            Call 999
          </a>
          <p className="text-xs text-red-500 mt-2">National Emergency Number — Free from any phone</p>
        </div>
      </div>
    </div>
  );
}
