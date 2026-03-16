// =============================================
// Home Page — Hero + Featured + Browse by Type + How It Works
// =============================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Building2, Hotel, Home as HomeIcon,
  DoorOpen, BedDouble, ArrowRight, CheckCircle2,
  Map, AlertTriangle, Loader2
} from 'lucide-react';
import { propertyAPI } from '../api/property.api';
import PropertyCard from '../components/property/PropertyCard';

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
  { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
  { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50' },
  { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50' },
  { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search },
  { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map },
  { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2 },
  { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await propertyAPI.featured(6);
        setFeatured(data.properties);
      } catch (err) {
        console.error('Failed to fetch featured:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/listings${searchCity ? `?city=${searchCity}` : ''}`);
  };

  return (
    <div>
      {/* ══════════════ HERO SECTION ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <MapPin size={14} />
              Relocating to Bangladesh?
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
              Find Your Next
              <span className="block text-accent mt-1">Home Sweet Home</span>
            </h1>

            <p className="text-lg text-white/70 mt-5 leading-relaxed max-w-lg">
              Discover rental properties, nearby essentials, and emergency contacts — all in one place. Your relocation companion in Bangladesh.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-2">
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by city — Dhaka, Chittagong, Sylhet..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-accent hover:bg-accent-hover text-white px-6 py-4 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg active:scale-[0.98]"
              >
                <Search size={18} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Quick stats */}
            <div className="flex items-center gap-6 mt-8">
              {[
                { val: '5+', label: 'Property Types' },
                { val: '100+', label: 'Listings' },
                { val: '24/7', label: 'Emergency Help' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-heading font-bold text-white">{val}</p>
                  <p className="text-xs text-white/50 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ BROWSE BY TYPE ══════════════ */}
      <section className="section">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold text-gray-900">Browse by Type</h2>
          <p className="text-muted mt-2">Find the perfect place that fits your needs</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg }) => (
            <Link
              key={value}
              to={`/listings?type=${value}`}
              className="group"
            >
              <div className={`${bg} rounded-2xl p-5 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <p className="font-heading font-semibold text-sm text-gray-800">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURED LISTINGS ══════════════ */}
      <section className="section bg-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-heading font-bold text-gray-900">Featured Listings</h2>
            <p className="text-muted mt-1">Handpicked properties for you</p>
          </div>
          <Link
            to="/listings"
            className="hidden sm:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>No listings yet. Start the backend server and seed the database.</p>
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <Link to="/listings" className="btn-secondary inline-flex items-center gap-1">
            View All Listings <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="section">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
          <p className="text-muted mt-2">Four simple steps to settle in your new city</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, idx) => (
            <div key={step} className="relative text-center group">
              {/* Connector line — hidden on last item and mobile */}
              {idx < 3 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
              )}

              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg relative z-10">
                <Icon size={30} className="text-white" />
              </div>

              <span className="text-accent font-heading font-bold text-sm">Step {step}</span>
              <h3 className="font-heading font-bold text-lg text-gray-900 mt-1">{title}</h3>
              <p className="text-muted text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ CTA SECTION ══════════════ */}
      <section className="bg-gradient-to-r from-accent to-orange-500 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Own a Property? List It Here!
          </h2>
          <p className="text-white/80 mt-3 text-lg max-w-xl mx-auto">
            Reach thousands of renters looking for their next home. It's free to get started.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="bg-white text-accent font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-lg active:scale-[0.98]"
            >
              List Your Property
            </Link>
            <Link
              to="/listings"
              className="text-white/90 font-medium px-8 py-3.5 rounded-xl border-2 border-white/30 hover:border-white/60 transition-all"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
