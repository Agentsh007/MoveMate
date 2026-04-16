
// // =============================================
// // Home Page — Enhanced UI/UX with Framer Motion
// // All logic & functionality preserved exactly
// // =============================================

// import { lazy, Suspense, useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion, useInView, AnimatePresence } from 'framer-motion';
// import { useRef } from 'react';
// import {
//   Search, MapPin, Building2, Hotel, Home as HomeIcon,
//   DoorOpen, BedDouble, ArrowRight, CheckCircle2,
//   Map, AlertTriangle, Loader2, Star, Shield, Zap
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { propertyAPI } from '../api/property.api';
// import useAuthStore from '../store/authStore';
// import PropertyCard from '../components/property/PropertyCard';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// // ── Data (unchanged) ──────────────────────────────────────────────────
// const PROPERTY_TYPES = [
//   { value: 'hotel', label: 'Hotels', icon: Hotel, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
//   { value: 'flat', label: 'Flats', icon: Building2, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
//   { value: 'apartment', label: 'Apartments', icon: Building2, color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-50', ring: 'ring-teal-200' },
//   { value: 'sublet', label: 'Sublets', icon: HomeIcon, color: 'from-orange-500 to-red-500', bg: 'bg-orange-50', ring: 'ring-orange-200' },
//   { value: 'tolet', label: 'To-Lets', icon: DoorOpen, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
//   { value: 'room', label: 'Rooms', icon: BedDouble, color: 'from-amber-500 to-yellow-600', bg: 'bg-amber-50', ring: 'ring-amber-200' },
// ];

// const HOW_IT_WORKS = [
//   { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search, accent: 'from-primary to-primary-light' },
//   { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map, accent: 'from-blue-500 to-indigo-500' },
//   { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2, accent: 'from-emerald-500 to-teal-500' },
//   { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle, accent: 'from-rose-500 to-red-500' },
// ];

// const STATS = [
//   { val: '5+', label: 'Property Types', icon: Building2 },
//   { val: '100+', label: 'Active Listings', icon: Star },
//   { val: '24/7', label: 'Emergency Help', icon: Shield },
// ];

// // ── Animation Variants ────────────────────────────────────────────────
// const fadeUp = {
//   hidden: { opacity: 0, y: 32 },
//   visible: (i = 0) => ({
//     opacity: 1,
//     y: 0,
//     transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
//   }),
// };

// const stagger = {
//   hidden: {},
//   visible: { transition: { staggerChildren: 0.08 } },
// };

// const scaleIn = {
//   hidden: { opacity: 0, scale: 0.88 },
//   visible: (i = 0) => ({
//     opacity: 1,
//     scale: 1,
//     transition: { duration: 0.45, delay: i * 0.07, ease: [0.34, 1.56, 0.64, 1] },
//   }),
// };

// // ── Reusable animated section wrapper ─────────────────────────────────
// function AnimatedSection({ children, className = '' }) {
//   const ref = useRef(null);
//   const inView = useInView(ref, { once: true, margin: '-80px' });
//   return (
//     <motion.div
//       ref={ref}
//       initial="hidden"
//       animate={inView ? 'visible' : 'hidden'}
//       variants={stagger}
//       className={className}
//     >
//       {children}
//     </motion.div>
//   );
// }
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000,
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//   },
// });
// // ✅ Prefetch OUTSIDE the component so it runs once at module load time
// queryClient.prefetchQuery({
//   queryKey: ['listings'],          // must match the key used in your Listings page
//   queryFn: () => propertyAPI.getAll(),
// });

// // ═══════════════════════════════════════════════════════════════════════
// export default function Home() {
//   const { user } = useAuthStore();
//   const [featured, setFeatured] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchCity, setSearchCity] = useState('');
//   const [searchFocused, setSearchFocused] = useState(false);
//   const navigate = useNavigate();

//   // ── Unchanged logic ──────────────────────────────────────────────────
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

//   // ── Render ────────────────────────────────────────────────────────────
//   return (
//     <QueryClientProvider client={queryClient}>
//       <div className="overflow-x-hidden">

//         {/* ══════════════════════════════════════════════════
//           HERO
//       ══════════════════════════════════════════════════ */}
//         <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]">

//           {/* Ambient glows */}
//           <div className="pointer-events-none absolute inset-0 overflow-hidden">
//             <motion.div
//               className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
//               style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }}
//               animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
//               transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
//             />
//             <motion.div
//               className="absolute -bottom-40 right-0 w-[700px] h-[700px] rounded-full"
//               style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
//               animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
//               transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
//             />
//             {/* Grid overlay */}
//             <div
//               className="absolute inset-0 opacity-[0.04]"
//               style={{
//                 backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
//                 backgroundSize: '60px 60px',
//               }}
//             />
//           </div>

//           <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
//             <div className="grid lg:grid-cols-2 gap-12 items-center">

//               {/* Left — Text */}
//               <div>
//                 <motion.div
//                   initial={{ opacity: 0, y: -12 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.6, delay: 0.1 }}
//                 >
//                   <span className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/10 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-7">
//                     <MapPin size={13} className="text-accent" />
//                     Your Relocation Companion in Bangladesh
//                   </span>
//                 </motion.div>

//                 <motion.h1
//                   className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.05] tracking-tight"
//                   variants={stagger}
//                   initial="hidden"
//                   animate="visible"
//                 >
//                   <motion.span variants={fadeUp} className="block text-white">
//                     Your Perfect
//                   </motion.span>
//                   <motion.span variants={fadeUp} className="block text-white">
//                     Home is
//                   </motion.span>
//                   <motion.span
//                     variants={fadeUp}
//                     className="block"
//                     style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}
//                   >
//                     Waiting for You
//                   </motion.span>
//                 </motion.h1>

//                 <motion.p
//                   className="text-lg text-slate-400 mt-6 leading-relaxed max-w-[480px]"
//                   variants={fadeUp}
//                   custom={3}
//                   initial="hidden"
//                   animate="visible"
//                 >
//                   Browse verified rentals, discover essentials around your new neighborhood, and access emergency contacts — all in one place.
//                 </motion.p>

//                 {/* Search Bar */}
//                 <motion.form
//                   onSubmit={handleSearch}
//                   className="mt-9"
//                   variants={fadeUp}
//                   custom={4}
//                   initial="hidden"
//                   animate="visible"
//                 >
//                   <motion.div
//                     className={`flex gap-2 p-2 rounded-2xl border transition-all duration-300 ${searchFocused
//                       ? 'bg-white border-accent shadow-[0_0_0_4px_rgba(249,115,22,0.15)]'
//                       : 'bg-white/8 border-white/15 backdrop-blur-sm'
//                       }`}
//                     animate={{ scale: searchFocused ? 1.01 : 1 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <div className="flex-1 relative">
//                       <MapPin
//                         size={17}
//                         className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${searchFocused ? 'text-accent' : 'text-slate-400'}`}
//                       />
//                       <input
//                         type="text"
//                         placeholder="Try Dhaka, Chittagong, Sylhet..."
//                         value={searchCity}
//                         onChange={(e) => setSearchCity(e.target.value)}
//                         onFocus={() => setSearchFocused(true)}
//                         onBlur={() => setSearchFocused(false)}
//                         className={`w-full pl-10 pr-4 py-3.5 bg-transparent rounded-xl text-sm focus:outline-none transition-colors duration-200 ${searchFocused ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-slate-500'
//                           }`}
//                       />
//                     </div>
//                     <motion.button
//                       type="submit"
//                       whileHover={{ scale: 1.03 }}
//                       whileTap={{ scale: 0.97 }}
//                       className="bg-accent hover:bg-accent-hover text-white px-6 py-3.5 rounded-xl font-semibold flex items-center gap-2 text-sm shadow-lg shadow-orange-500/25 transition-colors"
//                     >
//                       <Search size={16} />
//                       <span className="hidden sm:inline">Search</span>
//                     </motion.button>
//                   </motion.div>
//                 </motion.form>

//                 {/* Stats */}
//                 <motion.div
//                   className="flex items-center gap-8 mt-9"
//                   variants={stagger}
//                   initial="hidden"
//                   animate="visible"
//                 >
//                   {STATS.map(({ val, label, icon: Icon }, i) => (
//                     <motion.div key={label} variants={fadeUp} custom={5 + i} className="flex items-center gap-3">
//                       <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
//                         <Icon size={15} className="text-accent" />
//                       </div>
//                       <div>
//                         <p className="text-xl font-heading font-bold text-white leading-none">{val}</p>
//                         <p className="text-xs text-slate-500 mt-0.5">{label}</p>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </motion.div>
//               </div>

//               {/* Right — Decorative floating cards */}
//               <div className="hidden lg:block relative h-[480px]">
//                 {/* Main card */}
//                 <motion.div
//                   className="absolute top-12 right-0 w-72 bg-white/8 backdrop-blur-xl border border-white/12 rounded-3xl p-5 shadow-2xl"
//                   initial={{ opacity: 0, x: 40, y: 0 }}
//                   animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
//                   transition={{ opacity: { duration: 0.7, delay: 0.5 }, x: { duration: 0.7, delay: 0.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
//                 >
//                   <div className="flex items-center gap-3 mb-4">
//                     <div className="w-11 h-11 bg-gradient-to-br from-accent to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
//                       <HomeIcon size={20} className="text-white" />
//                     </div>
//                     <div>
//                       <p className="text-white font-semibold text-sm">2BR Apartment</p>
//                       <p className="text-slate-400 text-xs">Gulshan, Dhaka</p>
//                     </div>
//                   </div>
//                   <div className="flex items-end justify-between">
//                     <div>
//                       <p className="text-xs text-slate-500 mb-0.5">Starting from</p>
//                       <p className="text-accent font-heading font-bold text-xl">৳18,000<span className="text-xs text-slate-400 font-normal">/mo</span></p>
//                     </div>
//                     <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">
//                       <CheckCircle2 size={11} />
//                       Verified
//                     </div>
//                   </div>
//                 </motion.div>

//                 {/* Secondary card */}
//                 <motion.div
//                   className="absolute bottom-20 left-4 w-60 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl p-4 shadow-xl"
//                   initial={{ opacity: 0, x: -30 }}
//                   animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
//                   transition={{ opacity: { duration: 0.7, delay: 0.8 }, x: { duration: 0.7, delay: 0.8 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 } }}
//                 >
//                   <div className="flex items-center gap-2 mb-2">
//                     <Zap size={14} className="text-yellow-400" />
//                     <p className="text-white text-xs font-semibold">Instant Book Available</p>
//                   </div>
//                   <p className="text-slate-400 text-xs leading-relaxed">Skip the waiting. Confirm your booking right now.</p>
//                 </motion.div>

//                 {/* Floating badge */}
//                 <motion.div
//                   className="absolute top-56 left-16 bg-gradient-to-br from-accent to-orange-400 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-orange-500/30 text-xs font-bold"
//                   initial={{ opacity: 0, scale: 0.5 }}
//                   animate={{ opacity: 1, scale: 1, rotate: [-2, 2, -2] }}
//                   transition={{ opacity: { duration: 0.5, delay: 1.1 }, scale: { duration: 0.5, delay: 1.1 }, rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 } }}
//                 >
//                   🏠 100+ Listings
//                 </motion.div>
//               </div>
//             </div>
//           </div>

//           {/* Wave divider */}
//           <div className="absolute bottom-0 left-0 right-0">
//             <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-14 fill-gray-50">
//               <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
//             </svg>
//           </div>
//         </section>

//         {/* ══════════════════════════════════════════════════
//           BROWSE BY TYPE
//       ══════════════════════════════════════════════════ */}
//         <section className="section bg-gray-50">
//           <AnimatedSection>
//             <motion.div variants={fadeUp} className="text-center mb-12">
//               <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Find What You Need</p>
//               <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Browse by Type</h2>
//               <p className="text-muted mt-2 max-w-md mx-auto">Whether it's a hotel for the night or a flat for the year — we've got you covered.</p>
//             </motion.div>

//             <motion.div
//               variants={stagger}
//               className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
//             >
//               {PROPERTY_TYPES.map(({ value, label, icon: Icon, color, bg, ring }, i) => (
//                 <motion.div key={value} variants={scaleIn} custom={i}>
//                   <Link to={`/listings?type=${value}`} className="group block">
//                     <div className={`${bg} rounded-2xl p-5 text-center border border-transparent hover:border-current hover:${ring} hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5`}>
//                       <div className={`w-13 h-13 w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
//                         <Icon size={22} className="text-white" />
//                       </div>
//                       <p className="font-heading font-bold text-sm text-gray-800 group-hover:text-gray-900">{label}</p>
//                       <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-500 transition-colors">Explore →</p>
//                     </div>
//                   </Link>
//                 </motion.div>
//               ))}
//             </motion.div>
//           </AnimatedSection>
//         </section>

//         {/* ══════════════════════════════════════════════════
//           FEATURED LISTINGS
//       ══════════════════════════════════════════════════ */}
//         <section className="section bg-white">
//           <AnimatedSection>
//             <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
//               <div>
//                 <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-1">Handpicked for You</p>
//                 <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">Featured Listings</h2>
//                 <p className="text-muted mt-1.5">Our top picks across Bangladesh's most sought-after areas</p>
//               </div>
//               <Link
//                 to="/listings"
//                 className="hidden sm:flex items-center gap-1.5 text-accent font-semibold text-sm hover:gap-3 transition-all duration-200 group"
//               >
//                 View all
//                 <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
//               </Link>
//             </motion.div>

//             {loading ? (
//               <div className="flex flex-col items-center justify-center py-20 gap-3">
//                 <motion.div
//                   animate={{ rotate: 360 }}
//                   transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
//                 >
//                   <Loader2 size={32} className="text-accent" />
//                 </motion.div>
//                 <p className="text-sm text-muted">Finding the best properties for you...</p>
//               </div>
//             ) : featured.length > 0 ? (
//               <motion.div
//                 variants={stagger}
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
//               >
//                 {featured.map((property, i) => (
//                   <motion.div key={property.id} variants={fadeUp} custom={i}>
//                     <PropertyCard property={property} />
//                   </motion.div>
//                 ))}
//               </motion.div>
//             ) : (
//               <motion.div variants={fadeUp} className="text-center py-20">
//                 <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
//                   <Building2 size={36} className="text-gray-300" />
//                 </div>
//                 <p className="text-muted text-sm">No listings yet. Start the backend server and seed the database.</p>
//               </motion.div>
//             )}

//             <motion.div variants={fadeUp} className="text-center mt-8 sm:hidden">
//               <Link to="/listings" className="btn-secondary inline-flex items-center gap-1.5">
//                 View All Listings <ArrowRight size={15} />
//               </Link>
//             </motion.div>
//           </AnimatedSection>
//         </section>

//         {/* ══════════════════════════════════════════════════
//           HOW IT WORKS
//       ══════════════════════════════════════════════════ */}
//         <section className="section bg-gray-50 relative overflow-hidden">
//           {/* Background decoration */}
//           <div className="pointer-events-none absolute inset-0">
//             <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
//               style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
//           </div>

//           <AnimatedSection>
//             <motion.div variants={fadeUp} className="text-center mb-14">
//               <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-2">Simple Process</p>
//               <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">How MoveMate Works</h2>
//               <p className="text-muted mt-2">From search to settled — four steps is all it takes.</p>
//             </motion.div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//               {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon, accent }, idx) => (
//                 <motion.div
//                   key={step}
//                   variants={fadeUp}
//                   custom={idx}
//                   className="relative group"
//                 >
//                   {/* Connector */}
//                   {idx < 3 && (
//                     <div className="hidden lg:block absolute top-10 left-[62%] w-[76%] h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
//                   )}

//                   <div className="relative z-10 text-center">
//                     {/* Step number bubble */}
//                     <div className="relative inline-block mb-5">
//                       <motion.div
//                         whileHover={{ scale: 1.1, rotate: 5 }}
//                         transition={{ type: 'spring', stiffness: 300 }}
//                         className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}
//                       >
//                         <Icon size={30} className="text-white" />
//                       </motion.div>
//                       <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-accent flex items-center justify-center shadow-sm">
//                         <span className="text-accent font-bold text-[9px]">{step}</span>
//                       </div>
//                     </div>

//                     <h3 className="font-heading font-bold text-lg text-gray-900">{title}</h3>
//                     <p className="text-muted text-sm mt-2 leading-relaxed max-w-[180px] mx-auto">{desc}</p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </AnimatedSection>
//         </section>

//         {/* ══════════════════════════════════════════════════
//           CTA
//       ══════════════════════════════════════════════════ */}
//         <section className="relative overflow-hidden py-24">
//           {/* Background */}
//           <div className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#1a2840] to-[#0f1923]" />
//           <div className="pointer-events-none absolute inset-0">
//             <motion.div
//               className="absolute top-0 left-1/3 w-96 h-96 rounded-full opacity-20"
//               style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
//               animate={{ scale: [1, 1.2, 1] }}
//               transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
//             />
//             <div
//               className="absolute inset-0 opacity-[0.03]"
//               style={{
//                 backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
//                 backgroundSize: '40px 40px',
//               }}
//             />
//           </div>

//           <div className="relative max-w-4xl mx-auto px-4 text-center">
//             <AnimatedSection>
//               <motion.p variants={fadeUp} className="text-accent font-semibold text-sm uppercase tracking-widest mb-4">
//                 For Property Owners
//               </motion.p>
//               <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-heading font-bold text-white leading-tight">
//                 Reach Thousands of
//                 <span className="block" style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
//                   Verified Renters
//                 </span>
//               </motion.h2>
//               <motion.p variants={fadeUp} custom={2} className="text-slate-400 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
//                 List your property on MoveMate and connect with qualified tenants actively looking for their next home. It's free to get started.
//               </motion.p>

//               <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
//                 <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
//                   <Link
//                     to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
//                     onClick={handleListPropertyClick}
//                     className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 transition-colors text-sm"
//                   >
//                     List Your Property
//                     <ArrowRight size={16} />
//                   </Link>
//                 </motion.div>
//                 <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
//                   <Link
//                     to="/listings"
//                     className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/8 transition-all text-sm backdrop-blur-sm"
//                   >
//                     Browse Listings
//                   </Link>
//                 </motion.div>
//               </motion.div>

//               {/* Trust badges */}
//               <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-8 mt-12">
//                 {[
//                   { icon: Shield, text: 'Verified Listings' },
//                   { icon: Zap, text: 'Instant Booking' },
//                   { icon: Star, text: 'Trusted Reviews' },
//                 ].map(({ icon: Icon, text }) => (
//                   <div key={text} className="flex items-center gap-2 text-slate-500 text-xs">
//                     <Icon size={13} className="text-accent" />
//                     {text}
//                   </div>
//                 ))}
//               </motion.div>
//             </AnimatedSection>
//           </div>
//         </section>

//       </div>
//     </QueryClientProvider>
//   );
// }

// =============================================
// Home Page — Premium Light Theme Redesign
// All logic & functionality preserved exactly
// =============================================
// =============================================
// Home Page — Minimalist Light Theme
// Palette: Pure White · Cool Stone · Slate Blue
// All logic & functionality preserved exactly
// =============================================
// =============================================
// Home Page — Elegant Minimalist Light Theme
// Gentleman Font + Larger Icons + Smooth UX
// All functionalities preserved exactly
// =============================================
// =============================================
// Home Page — Elegant Minimalist (Fully Responsive)
// Gentleman Font + Smart Mobile Fixes + Larger Desktop Icons
// All functionalities preserved exactly
// =============================================

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Search, MapPin, Building2, Hotel, Home as HomeIcon,
  DoorOpen, BedDouble, ArrowRight, CheckCircle2,
  Map, AlertTriangle, Loader2, Star, Shield, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { propertyAPI } from '../api/property.api';
import useAuthStore from '../store/authStore';
import PropertyCard from '../components/property/PropertyCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotels', icon: Hotel },
  { value: 'flat', label: 'Flats', icon: Building2 },
  { value: 'apartment', label: 'Apartments', icon: Building2 },
  { value: 'sublet', label: 'Sublets', icon: HomeIcon },
  { value: 'tolet', label: 'To-Lets', icon: DoorOpen },
  { value: 'room', label: 'Rooms', icon: BedDouble },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', desc: 'Browse properties by type, price, and location', icon: Search },
  { step: '02', title: 'Discover', desc: 'Find nearby pharmacies, banks, and restaurants', icon: Map },
  { step: '03', title: 'Book', desc: 'Book instantly or request a visit', icon: CheckCircle2 },
  { step: '04', title: 'Stay Safe', desc: 'Access emergency contacts anytime, anywhere', icon: AlertTriangle },
];

const STATS = [
  { val: '5+', label: 'Property Types', icon: Building2 },
  { val: '100+', label: 'Active Listings', icon: Star },
  { val: '24/7', label: 'Emergency Help', icon: Shield },
];

// Animation Variants (smooth & lightweight)
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Home() {
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white overflow-x-hidden font-sans">

        {/* HERO - Fully Responsive */}
        <section className="relative min-h-screen flex items-center bg-zinc-50 pt-16 lg:pt-0">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">

            {/* Left Content - Mobile First */}
            <div className="space-y-8 lg:space-y-10">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-600 px-5 py-2 rounded-3xl text-sm font-medium shadow-sm"
              >
                <MapPin size={16} className="text-blue-600" />
                Your Relocation Companion in Bangladesh
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold tracking-tighter leading-none text-zinc-900"
              >
                <motion.span variants={fadeUp} className="block">Find Your</motion.span>
                <motion.span variants={fadeUp} className="block">Perfect Home</motion.span>
                <motion.span variants={fadeUp} className="block text-blue-600">in Bangladesh</motion.span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={3}
                initial="hidden"
                animate="visible"
                className="text-base sm:text-lg text-zinc-600 max-w-md"
              >
                Verified rentals • Local essentials • Emergency help — all in one elegant place.
              </motion.p>

              {/* Search Bar - Responsive */}
              <motion.form
                onSubmit={handleSearch}
                variants={fadeUp}
                custom={4}
                initial="hidden"
                animate="visible"
                className="w-full"
              >
                <div
                  className={`flex items-center bg-white border rounded-3xl p-2 shadow-sm transition-all duration-300 ${searchFocused ? 'border-blue-300 shadow-blue-100' : 'border-zinc-200'
                    }`}
                >
                  <div className="flex-1 relative">
                    <MapPin size={20} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <input
                      type="text"
                      placeholder="Try Dhaka, Chittagong, Sylhet..."
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="w-full pl-12 pr-4 py-5 bg-transparent text-base focus:outline-none placeholder-zinc-400"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="bg-zinc-900 hover:bg-black text-white px-7 py-5 rounded-3xl font-medium flex items-center gap-2 transition-all text-sm sm:text-base whitespace-nowrap"
                  >
                    <Search size={19} />
                    <span className="hidden xs:inline">Search Homes</span>
                  </motion.button>
                </div>
              </motion.form>

              {/* Stats - Responsive */}
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center gap-8 lg:gap-10"
              >
                {STATS.map(({ val, label, icon: Icon }, i) => (
                  <motion.div key={label} variants={fadeUp} custom={5 + i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center shadow-sm">
                      <Icon size={22} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-semibold text-zinc-900">{val}</p>
                      <p className="text-xs sm:text-sm text-zinc-500">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Visual - Hidden on mobile, elegant on desktop */}
            <div className="relative hidden lg:block h-[520px]">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
                transition={{ duration: 0.8, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
                className="absolute top-12 right-0 bg-white border border-zinc-100 rounded-3xl p-7 shadow-xl w-80"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <HomeIcon size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-zinc-900">2BR Apartment • Gulshan</p>
                    <p className="text-sm text-zinc-500">৳18,000 / month</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center text-xs">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl">Verified</span>
                  <span className="text-emerald-600 font-medium">Instant Book ✓</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, y: [0, 12, 0] }}
                transition={{ delay: 0.4, duration: 0.8, y: { duration: 5, repeat: Infinity } }}
                className="absolute bottom-20 left-8 bg-white border border-zinc-100 rounded-3xl p-6 shadow-lg w-64"
              >
                <div className="flex items-center gap-3">
                  <Zap size={26} className="text-amber-500" />
                  <p className="font-medium">Instant booking available</p>
                </div>
                <p className="text-sm text-zinc-500 mt-3">Confirm your new home in seconds.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* BROWSE BY TYPE - Responsive */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="text-center mb-10 lg:mb-12">
                <span className="text-blue-600 text-sm font-medium tracking-widest">FIND WHAT YOU NEED</span>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-zinc-900 mt-2">Browse by Type</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                {PROPERTY_TYPES.map(({ value, label, icon: Icon }, i) => (
                  <motion.div key={value} variants={fadeUp} custom={i}>
                    <Link
                      to={`/listings?type=${value}`}
                      className="group block bg-zinc-50 hover:bg-white border border-transparent hover:border-zinc-200 rounded-3xl p-6 lg:p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1"
                    >
                      <div className="w-14 h-14 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Icon size={28} className="text-blue-600" />
                      </div>
                      <p className="mt-6 font-medium text-zinc-900 text-sm lg:text-base">{label}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FEATURED LISTINGS - Responsive */}
        <section className="py-16 lg:py-20 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 lg:mb-10 gap-3">
                <div>
                  <span className="text-blue-600 text-sm font-medium tracking-widest">HANDPICKED FOR YOU</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-zinc-900 mt-1">Featured Listings</h2>
                </div>
                <Link to="/listings" className="flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all text-sm sm:text-base">
                  View all <ArrowRight size={18} />
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
              ) : featured.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {featured.map((property, i) => (
                    <motion.div key={property.id} variants={fadeUp} custom={i}>
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-zinc-500 py-20">No featured listings yet.</p>
              )}
            </AnimatedSection>
          </div>
        </section>

        {/* HOW IT WORKS - Responsive */}
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="text-center mb-12">
                <span className="text-blue-600 text-sm font-medium tracking-widest">SIMPLE PROCESS</span>
                <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-zinc-900 mt-2">How MoveMate Works</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
                  <motion.div key={step} variants={fadeUp} custom={i} className="text-center group">
                    <div className="w-16 h-16 mx-auto bg-blue-50 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon size={32} className="text-blue-600" />
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-zinc-900 text-white text-xs font-mono rounded-2xl mb-4">{step}</div>
                    <h3 className="font-semibold text-xl text-zinc-900">{title}</h3>
                    <p className="text-zinc-500 mt-3 text-sm leading-relaxed px-4">{desc}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* FINAL CTA - Responsive */}
        <section className="py-16 lg:py-24 bg-zinc-900 text-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <AnimatedSection>
              <span className="text-blue-400 text-sm font-medium">FOR PROPERTY OWNERS</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold mt-4 leading-tight">
                Reach thousands of verified renters
              </h2>
              <p className="mt-6 text-zinc-400 max-w-md mx-auto text-base">
                List your property for free and connect with people actively looking for their next home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <Link
                  to={user ? (user.role === 'owner' || user.role === 'admin' ? '/owner/listings/new' : '/dashboard') : '/register'}
                  onClick={handleListPropertyClick}
                  className="bg-white text-zinc-900 font-medium px-10 py-5 rounded-3xl flex items-center justify-center gap-3 hover:shadow-2xl transition-all text-base"
                >
                  List Your Property <ArrowRight size={20} />
                </Link>
                <Link
                  to="/listings"
                  className="border border-white/30 hover:border-white/50 font-medium px-10 py-5 rounded-3xl flex items-center justify-center gap-3 transition-all text-base"
                >
                  Browse All Homes
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </QueryClientProvider>
  );
}