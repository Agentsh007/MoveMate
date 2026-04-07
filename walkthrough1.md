# MoveMate — Build Walkthrough

## Phase 1: Backend Foundation ✅
**25 source files + 8 SQL migrations** — Express REST API

```
server/
├── .env, .gitignore, package.json
├── server.js, migrate.js
├── migrations/ (001–008 SQL)
├── seeds/seed.js
└── src/
    ├── app.js
    ├── config/ (db, cloudinary, email)
    ├── middleware/ (auth, errorHandler, upload)
    ├── queries/ (user, property, booking, location)
    ├── controllers/ (7 files)
    └── routes/ (7 files)
```

**Setup:** Create DB `movemate` → update [.env](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/server/.env) → `node migrate.js` → `node seeds/seed.js` → `npm run dev`

---

## Phase 2: Frontend Foundation ✅
**30+ source files** — React + Vite + Tailwind v3 + React Router

```
client/
├── index.html (Sora + DM Sans fonts, SEO meta)
├── .env (VITE_API_URL)
├── tailwind.config.js (design system: colors, fonts, shadows)
├── postcss.config.js
└── src/
    ├── main.jsx, App.jsx (React Router v6 + React Query + Toaster)
    ├── index.css (Tailwind + design tokens + component classes + animations)
    ├── api/
    │   ├── axiosInstance.js (JWT interceptor + auto refresh)
    │   ├── auth.api.js, property.api.js
    │   ├── booking.api.js, location.api.js
    ├── store/
    │   ├── authStore.js (Zustand + persist to localStorage)
    │   └── notificationStore.js
    ├── utils/ (formatPrice, formatDate, constants)
    ├── components/shared/
    │   ├── Navbar.jsx (responsive, auth-aware, notification bell, profile dropdown)
    │   ├── Footer.jsx (4-column grid, MoveMate branding)
    │   ├── ProtectedRoute.jsx (+ OwnerRoute)
    │   ├── NotificationBell.jsx (polling, dropdown, mark read)
    │   └── BookingStatusBadge.jsx
    └── pages/ (10 placeholder stubs ready for Phase 3+)
```

### Build Verification
```
✅ npm run build — SUCCESS
   2162 modules transformed in 852ms
   index.css: 30.42 KB (gzip: 10.39 KB)
   index.js: 336.42 KB (gzip: 108.85 KB)
```

### Key Architecture

| Layer | Technology |
|-------|-----------|
| Routing | React Router v6 — 10 routes with auth guards |
| API | Axios + JWT auto-attach + 401 refresh interceptor |
| State | Zustand — authStore (persisted), notificationStore |
| Caching | React Query — 5min stale time |
| Styling | Tailwind v3 + design tokens (primary, accent, surface) |
| Icons | Lucide React |
| Toasts | react-hot-toast |

### Routes

| Path | Component | Auth |
|------|-----------|------|
| `/` | Home | Public |
| `/listings` | Listings | Public |
| `/listings/:id` | PropertyDetail | Public |
| `/essentials` | Essentials | Public |
| `/emergency` | Emergency | Public |
| `/login`, `/register` | Login, Register | Public |
| `/dashboard` | UserDashboard | Protected |
| `/owner` | OwnerDashboard | Owner only |
| `/owner/listings/new` | AddListing | Owner only |
| `/bookings/:id` | BookingDetail | Protected |

## ✅ Phase F: Quality Assurance & Bug Fixes
- **Data Disconnection Fixed**: Solved the issue where the frontend would unexpectedly drop data and show a "Start the backend server" message. This was caused by the `express-rate-limit` configuration being too low (100 reqs/15m) for a React Single Page Application (which polls and routes heavily). Expanded the limit to 1000 requests to properly support development and heavy web navigation without returning 429 Timeouts.
- **Interactive Booking Requests**: Created the [BookingDetail.jsx](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/pages/dashboard/BookingDetail.jsx) page and routed it to `/bookings/:id`. Booking request cards in both the User and Owner dashboards now feature a "View Booking Details" link that exposes the property information alongside the requester's profile details.
- **Interactive Notifications**: Upgraded the Notification Bell dropdown items to parse their internal payload and automatically route the user to the relevant detailed Booking view when clicked.
- **Auth Redirects for CTA**: Fixed the logic on the "List Your Property" call-to-action buttons in the Home page and Footer so that logged-in Owners are routed straight to `/owner/listings/new`, logged-in users receive a helpful warning toast redirecting to their dashboard, and logged-out users predictably go to `/register`.

## ✨ Phase G: Dashboard UX & Services Enhancements
- **Interactive Map Initialization Fixed**: Resolved an underlying Vite bundler issue with `react-leaflet` by overriding and correctly resolving default Map Marker icons at runtime in [main.jsx](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/main.jsx).
- **National Emergency Scope**: The Emergency contacts page now incorporates an aesthetically distinct "National Emergency Lines" section covering nationwide services like 999, Women & Child Abuse, Disaster Management, and Govt. Info right alongside local categorized results.
- **Polished UX & Skeletons**: Replaced rigid single-spinner loading instances with detailed, animated skeletal loaders natively mimicking the shape of the content to be loaded ([EmergencyCardSkeleton](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/components/shared/LoadingSkeleton.jsx#56-69), [EssentialsListSkeleton](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/components/shared/LoadingSkeleton.jsx#70-91)). Also added custom graceful `animate-fade-in` enter transitions to newly loaded lists and items for a premium-feeling application state.

## 🗺️ Phase H: Overpass API Essentials Map
- **Live Local Data via OpenStreetMap**: Completely decoupled the [Essentials.jsx](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/pages/Essentials.jsx) dashboard from static backend stubs and integrated it directly with the **Overpass API**. This allows the app to dynamically crawl real OpenStreetMap nodes around the user's GPS coordinates.
- **Robust Geospatial Parsing**: Implemented dynamic geographic bounding box generation derived off a user's location + search radius to supply precise Overpass queries. Filtered `node["amenity"~"..."]` tags map correctly to standardized internal categories.
- **Marker Clustering**: Installed `react-leaflet-cluster` and implemented dense map marker clustering (`<MarkerClusterGroup>`). The map neatly avoids clutter by collapsing nearby places into singular numbered nodes as you zoom out.
- **List & Map Sync**: The sidebar list correctly plots calculated distance to the user, translates raw map tags to readable addresses, and binds [onClick](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/components/shared/NotificationBell.jsx#60-75) events tightly to the Leaflet map bounds using `useMap().flyTo()`.
- **Dynamic Colored Markers**: Extracted Leaflet's default pins and integrated dynamically styled SVGs using `L.divIcon`. Essential categories are now color-coded natively (e.g. Red for Hospitals, Orange for Restaurants, Purple for Banks).
- **Programmatic Max Zoom Popups**: Upgraded the [MapController](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/pages/Essentials.jsx#53-76) so that clicking a location card not only gracefully `.flyTo()`s the coordinate, but it automatically zooms deeply to **level 18**. It unpacks any dense clusters and securely fires `.openPopup()` so details are instantly visible without a second click.
- **Nominatim Reverse Geocoding Proxy**: Built an [AddressDisplay](file:///d:/Others/FILES/Academic/4th%20year/4-2%20%28NEW%29/WE/Lab/MoveMateV1/client/src/pages/Essentials.jsx#112-135) lazy-loading component that intercepts OSM nodes missing street metadata. It pings a secure, rate-limited (1s queued delays) backend proxy route (`/api/essentials/geocode`) which safely authenticates the application `User-Agent` to the Nominatim reverse geocoding API, protecting the client from CORS and strict IP bans.

![Overpass API User Testing Flow](C:\Users\shant\.gemini\antigravity\brain\542bb707-cd23-4ec9-a8c7-1a7cd54e529f\overpass_api_test_1773724438888.webp)
![Marker Focus & Colors Test](C:\Users\shant\.gemini\antigravity\brain\542bb707-cd23-4ec9-a8c7-1a7cd54e529f\marker_popup_zoom_test_1773725599310.webp)
![Nominatim Address Resolutions](C:\Users\shant\.gemini\antigravity\brain\542bb707-cd23-4ec9-a8c7-1a7cd54e529f\resolved_addresses_list_1773727713846.png)

## 🎯 Phase 9: Map Performance & Interactivity Polish
- **Instant Location Resolution Fixed**: The GPS fetching logic was heavily upgraded. By passing `maximumAge: 60000`, `timeout: 10000`, and `enableHighAccuracy: true`, the browser skips long hardware polling delays (using cached recent GPS data if available) while leaving enough time so user location permission prompts don't erroneously trigger the fallback "Dhaka" state.
- **Locate Me Map Control**: Re-implemented a robust custom Leaflet Control (`<LocateMeControl>`) holding a dynamic button layered right within the map. Clicking it cleanly interrupts map states and re-fetches the user's highest accuracy coordinates (`maximumAge: 0`), enforcing a smooth `flyTo([lat, lng], 14)` to re-center the canvas seamlessly.
![Essentials Map Enhancements Verification](C:\Users\shant\.gemini\antigravity\brain\542bb707-cd23-4ec9-a8c7-1a7cd54e529f\map_verify_final_1774536152511.webp)

## 🚑 Phase 10: Emergency Dashboard Fixes
- **GPS Fallback Correction:** Repaired a severe timeout bug across Desktop platforms wherein the `getCurrentPosition` sequence would abruptly fail before receiving geolocation authorization, dumping users to a fallback radius that possessed 0 local contacts. By overriding the browser to track `enableHighAccuracy: true` combined with an extended 10,000ms heartbeat, rigorous 50km geospatial radiuses now accurately execute against correct `latitude`/`longitude` markers.
- **Dynamic Category Mapping:** Debugged a mismatch string error causing categories like `Fire Service` to silently drop to gray SVG generic fallback objects. Replaced the `CATEGORY_ICONS` logic internally to pair cleanly with seeded database enumerators yielding vivid, appropriately highlighted interface cards.

![Emergency Dashboard Location Sync Test](C:\Users\shant\.gemini\antigravity\brain\542bb707-cd23-4ec9-a8c7-1a7cd54e529f\emergency_dashboard_populated_1774537081310.png)

### Run Frontend
```bash
cd client
npm run dev
```
→ Opens at `http://localhost:5173`
