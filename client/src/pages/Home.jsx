// // =============================================
// // Home Page — Hero + Featured + Browse by Type + How It Works
// // =============================================

// import { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   Search, MapPin, Building2, Hotel, Home as HomeIcon,
//   DoorOpen, BedDouble, ArrowRight, CheckCircle2,
//   Map, AlertTriangle, Loader2
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { propertyAPI } from '../api/property.api';
// import useAuthStore from '../store/authStore';
// import PropertyCard from '../components/property/PropertyCard';

// const PROPERTY_TYPES = [
//   { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
//   { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
//   { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50' },
//   { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
//   { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50' },
//   { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50' },
// ];

// const HOW_IT_WORKS = [
//   { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search },
//   { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map },
//   { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2 },
//   { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle },
// ];

// export default function Home() {
//   const { user } = useAuthStore();
//   const [featured, setFeatured] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchCity, setSearchCity] = useState('');
//   const navigate = useNavigate();

//   const handleListPropertyClick = (e) => {
//     if (user && user.role !== 'owner' && user.role !== 'admin') {
//       e.preventDefault();
//       toast.error('You need an Owner account to list properties.');
//       navigate('/dashboard');
//     }
//   };

//   useEffect(() => {
//     const fetchFeatured = async () => {
//       try {
//         const { data } = await propertyAPI.featured(6);
//         setFeatured(data.properties);
//       } catch (err) {
//         console.error('Failed to fetch featured:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchFeatured();
//   }, []);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     navigate(`/listings${searchCity ? `?city=${searchCity}` : ''}`);
//   };

//   return (
//     <div>
//       {/* ══════════════ HERO SECTION ══════════════ */}
//       <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary">
//         {/* Background pattern */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
//           <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
//           <div className="max-w-2xl">
//             <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
//               <MapPin size={14} />
//               Relocating to Bangladesh?
//             </span>

//             <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
//               Find Your Next
//               <span className="block text-accent mt-1">Home Sweet Home</span>
//             </h1>

//             <p className="text-lg text-white/70 mt-5 leading-relaxed max-w-lg">
//               Discover rental properties, nearby essentials, and emergency contacts — all in one place. Your relocation companion in Bangladesh.
//             </p>

//             {/* Search Bar */}
//             <form onSubmit={handleSearch} className="mt-8 flex gap-2">
//               <div className="flex-1 relative">
//                 <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search by city — Dhaka, Chittagong, Sylhet..."
//                   value={searchCity}
//                   onChange={(e) => setSearchCity(e.target.value)}
//                   className="w-full pl-11 pr-4 py-4 bg-white rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg text-sm"
//                 />
//               </div>
//               <button
//                 type="submit"
//                 className="bg-accent hover:bg-accent-hover text-white px-6 py-4 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg active:scale-[0.98]"
//               >
//                 <Search size={18} />
//                 <span className="hidden sm:inline">Search</span>
//               </button>
//             </form>

//             {/* Quick stats */}
//             <div className="flex items-center gap-6 mt-8">
//               {[
//                 { val: '5+', label: 'Property Types' },
//                 { val: '100+', label: 'Listings' },
//                 { val: '24/7', label: 'Emergency Help' },
//               ].map(({ val, label }) => (
//                 <div key={label} className="text-center">
//                   <p className="text-2xl font-heading font-bold text-white">{val}</p>
//                   <p className="text-xs text-white/50 mt-0.5">{label}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ══════════════ BROWSE BY TYPE ══════════════ */}
//       <section className="section">
//         <div className="text-center mb-10">
//           <h2 className="text-3xl font-heading font-bold text-gray-900">Browse by Type</h2>
//           <p className="text-muted mt-2">Find the perfect place that fits your needs</p>
//         </div>

//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
//           {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg }) => (
//             <Link
//               key={value}
//               to={`/listings?type=${value}`}
//               className="group"
//             >
//               <div className={`${bg} rounded-2xl p-5 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1`}>
//                 <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
//                   <Icon size={22} className="text-white" />
//                 </div>
//                 <p className="font-heading font-semibold text-sm text-gray-800">{label}</p>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </section>

//       {/* ══════════════ FEATURED LISTINGS ══════════════ */}
//       <section className="section bg-white">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-3xl font-heading font-bold text-gray-900">Featured Listings</h2>
//             <p className="text-muted mt-1">Handpicked properties for you</p>
//           </div>
//           <Link
//             to="/listings"
//             className="hidden sm:flex items-center gap-1 text-accent font-medium text-sm hover:gap-2 transition-all"
//           >
//             View all <ArrowRight size={16} />
//           </Link>
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center py-16">
//             <Loader2 size={32} className="animate-spin text-primary" />
//           </div>
//         ) : featured.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {featured.map((property) => (
//               <PropertyCard key={property.id} property={property} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-16 text-muted">
//             <Building2 size={48} className="mx-auto mb-3 opacity-30" />
//             <p>No listings yet. Start the backend server and seed the database.</p>
//           </div>
//         )}

//         <div className="text-center mt-8 sm:hidden">
//           <Link to="/listings" className="btn-secondary inline-flex items-center gap-1">
//             View All Listings <ArrowRight size={16} />
//           </Link>
//         </div>
//       </section>

//       {/* ══════════════ HOW IT WORKS ══════════════ */}
//       <section className="section">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
//           <p className="text-muted mt-2">Four simple steps to settle in your new city</p>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, idx) => (
//             <div key={step} className="relative text-center group">
//               {/* Connector line — hidden on last item and mobile */}
//               {idx < 3 && (
//                 <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
//               )}

//               <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg relative z-10">
//                 <Icon size={30} className="text-white" />
//               </div>

//               <span className="text-accent font-heading font-bold text-sm">Step {step}</span>
//               <h3 className="font-heading font-bold text-lg text-gray-900 mt-1">{title}</h3>
//               <p className="text-muted text-sm mt-1">{desc}</p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* ══════════════ CTA SECTION ══════════════ */}
//       <section className="bg-gradient-to-r from-accent to-orange-500 py-16">
//         <div className="max-w-4xl mx-auto px-4 text-center">
//           <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
//             Own a Property? List It Here!
//           </h2>
//           <p className="text-white/80 mt-3 text-lg max-w-xl mx-auto">
//             Reach thousands of renters looking for their next home. It's free to get started.
//           </p>
//           <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
//             <Link
//               to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
//               onClick={handleListPropertyClick}
//               className="bg-white text-accent font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-lg active:scale-[0.98]"
//             >
//               List Your Property
//             </Link>
//             <Link
//               to="/listings"
//               className="text-white/90 font-medium px-8 py-3.5 rounded-xl border-2 border-white/30 hover:border-white/60 transition-all"
//             >
//               Browse Listings
//             </Link>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }


// =============================================
// Home Page — Enhanced UI/UX with Framer Motion
// All logic & functionality preserved exactly
// =============================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import {
  Search, MapPin, Building2, Hotel, Home as HomeIcon,
  DoorOpen, BedDouble, ArrowRight, CheckCircle2,
  Map, AlertTriangle, Loader2, Star, Shield, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../api/property.api';
import useAuthStore from '../store/authStore';
import PropertyCard from '../components/property/PropertyCard';

// ── Data (unchanged) ──────────────────────────────────────────────────
const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
  { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', ring: 'ring-teal-200' },
  { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
  { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search, accent: 'from-primary to-primary-light' },
  { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map, accent: 'from-blue-500 to-indigo-500' },
  { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2, accent: 'from-emerald-500 to-teal-500' },
  { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle, accent: 'from-rose-500 to-red-500' },
];

const STATS = [
  { val: '5+', label: 'Property Types', icon: Building2 },
  { val: '100+', label: 'Active Listings', icon: Star },
  { val: '24/7', label: 'Emergency Help', icon: Shield },
];

// ── Animation Variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

// ── Reusable animated section wrapper ─────────────────────────────────
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
export default function Home() {
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  // ── Unchanged logic ──────────────────────────────────────────────────
  const handleListPropertyClick = (e) => {
    if (user && user.role !== 'owner' && user.role !== 'admin') {
      e.preventDefault();
      toast.error('You need an Owner account to list properties.');
      navigate('/dashboard');
    }
  };

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

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]">

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 right-0 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-7">
                  <MapPin size={13} className="text-accent" />
                  Your Relocation Companion in Bangladesh
                </span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.05] tracking-tight"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <motion.span variants={fadeUp} className="block text-white">
                  Your Perfect
                </motion.span>
                <motion.span variants={fadeUp} className="block text-white">
                  Home is
                </motion.span>
                <motion.span
                  variants={fadeUp}
                  className="block"
                  style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}
                >
                  Waiting for You
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-lg text-slate-400 mt-6 leading-relaxed max-w-[480px]"
                variants={fadeUp}
                custom={3}
                initial="hidden"
                animate="visible"
              >
                Browse verified rentals, discover essentials around your new neighborhood, and access emergency contacts — all in one place.
              </motion.p>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                className="mt-9"
                variants={fadeUp}
                custom={4}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className={`flex gap-2 p-2 rounded-2xl border transition-all duration-300 ${searchFocused
                      ? 'bg-white border-accent shadow-[0_0_0_4px_rgba(249,115,22,0.15)]'
                      : 'bg-white/8 border-white/15 backdrop-blur-sm'
                    }`}
                  animate={{ scale: searchFocused ? 1.01 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-1 relative">
                    <MapPin
                      size={17}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-accent' : 'text-slate-400'}`}
                    />
                    <input
                      type="text"
                      placeholder="Try Dhaka, Chittagong, Sylhet..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className={`w-full pl-10 pr-4 py-3.5 bg-transparent rounded-xl text-sm focus:outline-none transition-colors duration-200 ${searchFocused ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-slate-500'
                        }`}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-accent hover:bg-accent-hover text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-orange-500/25 transition-colors"
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline">Search</span>
                  </motion.button>
                </motion.div>
              </motion.form>

              {/* Stats */}
              <motion.div
                className="flex items-center gap-8 mt-9"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                {STATS.map(({ val, label, icon: Icon }, i) => (
                  <motion.div key={label} variants={fadeUp} custom={5 + i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                      <Icon size={15} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-xl font-heading font-bold text-white leading-none">{val}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right — Decorative floating cards */}
            <div className="hidden lg:block relative h-[480px]">
              {/* Main card */}
              <motion.div
                className="absolute top-12 right-0 w-72 bg-white/8 backdrop-blur-xl border border-white/12 rounded-3xl p-5 shadow-2xl"
                initial={{ opacity: 0, x: 40, y: 0 }}
                animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                transition={{ opacity: { duration: 0.7, delay: 0.5 }, x: { duration: 0.7, delay: 0.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                    <HomeIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">2BR Apartment</p>
                    <p className="text-slate-400 text-xs">Gulshan, Dhaka</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Starting from</p>
                    <p className="text-accent font-heading font-bold text-xl">৳18,000<span className="text-xs text-slate-400 font-normal">/mo</span></p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <CheckCircle2 size={11} />
                    Verified
                  </div>
                </div>
              </motion.div>

              {/* Secondary card */}
              <motion.div
                className="absolute bottom-20 left-4 w-60 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-4 shadow-xl"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                transition={{ opacity: { duration: 0.7, delay: 0.8 }, x: { duration: 0.7, delay: 0.8 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 } }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-yellow-400" />
                  <p className="text-white text-xs font-semibold">Instant Book Available</p>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">Skip the waiting. Confirm your booking right now.</p>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                className="absolute top-56 left-16 bg-gradient-to-br from-accent to-orange-400 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-orange-500/30 text-xs font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: [-2, 2, -2] }}
                transition={{ opacity: { duration: 0.5, delay: 1.1 }, scale: { duration: 0.5, delay: 1.1 }, rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 } }}
              >
                🏠 100+ Listings
              </motion.div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-14 fill-gray-50">
            <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BROWSE BY TYPE
      ══════════════════════════════════════════════════ */}
      <section className="section bg-gray-50">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Find What You Need</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Browse by Type</h2>
            <p className="text-muted mt-2 max-w-md mx-auto">Whether it's a hotel for the night or a flat for the year — we've got you covered.</p>
          </motion.div>

          <motion.div
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg, ring }, i) => (
              <motion.div key={value} variants={scaleIn} custom={i}>
                <Link to={`/listings?type=${value}`} className="group block">
                  <div className={`${bg} rounded-2xl p-5 text-center border border-transparent hover:border-current hover:${ring} hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5`}>
                    <div className={`w-13 h-13 w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <p className="font-heading font-bold text-sm text-gray-800 group-hover:text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-500 transition-colors">Explore →</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════════════ */}
      <section className="section bg-white">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-1">Handpicked for You</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Featured Listings</h2>
              <p className="text-muted mt-1.5">Our top picks across Bangladesh's most sought-after areas</p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:flex items-center gap-1.5 text-accent font-semibold text-sm hover:gap-3 transition-all duration-200 group"
            >
              View all
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={32} className="text-accent" />
              </motion.div>
              <p className="text-sm text-muted">Finding the best properties for you...</p>
            </div>
          ) : featured.length > 0 ? (
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featured.map((property, i) => (
                <motion.div key={property.id} variants={fadeUp} custom={i}>
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
                <Building2 size={36} className="text-gray-300" />
              </div>
              <p className="text-muted text-sm">No listings yet. Start the backend server and seed the database.</p>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-center mt-8 sm:hidden">
            <Link to="/listings" className="btn-secondary inline-flex items-center gap-1.5">
              View All Listings <ArrowRight size={15} />
            </Link>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section className="section bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
        </div>

        <AnimatedSection>
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
            <p className="text-muted mt-2">From search to settled — four steps is all it takes.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, accent }, idx) => (
              <motion.div
                key={step}
                variants={fadeUp}
                custom={idx}
                className="relative group"
              >
                {/* Connector */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[62%] w-[76%] h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
                )}

                <div className="relative z-10 text-center">
                  {/* Step number bubble */}
                  <div className="relative inline-block mb-5">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}
                    >
                      <Icon size={30} className="text-white" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-accent flex items-center justify-center shadow-sm">
                      <span className="text-accent font-bold text-[9px]">{step}</span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-gray-900">{title}</h3>
                  <p className="text-muted text-sm mt-2 leading-relaxed max-w-[180px] mx-auto">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]" />
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <motion.p variants={fadeUp} className="text-accent font-semibold text-sm uppercase tracking-widest mb-4">
              For Property Owners
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
              Reach Thousands of
              <span className="block" style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
                Verified Renters
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-400 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
              List your property on MoveMate and connect with qualified tenants actively looking for their next home. It's free to get started.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
                  onClick={handleListPropertyClick}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 transition-colors text-sm"
                >
                  List Your Property
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/listings"
                  className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/8 transition-all text-sm backdrop-blur-sm"
                >
                  Browse Listings
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-8 mt-12">
              {[
                { icon: Shield, text: 'Verified Listings' },
                { icon: Zap, text: 'Instant Booking' },
                { icon: Star, text: 'Trusted Reviews' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-slate-500 text-xs">
                  <Icon size={13} className="text-accent" />
                  {text}
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}