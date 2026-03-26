# MoveMate — Your Relocation Companion

MoveMate is a comprehensive, full-stack platform designed to simplify the relocation process. Whether you are searching for a new home, booking professional movers, discovering local essential services, or keeping emergency contacts handy, MoveMate acts as your all-in-one digital companion for settling into a new area.

![MoveMate Cover](client/public/logo.svg) <!-- Add a real cover image here if available -->

## 🚀 Features

### 🏡 Property Listings & Booking
- **Dynamic Property Browsing:** Browse curated property listings with advanced filtering and pagination.
- **Multiple Booking Models:** Supports traditional long-term rentals, short-term stays, and instant hotel-style bookings.
- **Interactive Maps:** View property locations with embedded Leaflet maps.

### 📍 Location-Aware Dashboards
- **Essentials Map:** Find nearby hospitals, pharmacies, restaurants, grocery stores, and ATMs using real-time OpenStreetMap/Overpass API data. 
- **Geo-Radius Parsing:** Micro-interactions natively pull data around a 5km radius based on your hardware-level GPS coordinate fix.
- **Offline-First Emergency Directory:** Access color-coded, nationwide and local emergency contacts. Uses cached local storage to ensure users can reach help even with poor connectivity.

### 👥 User & Owner Portals
- **Role-based Authentication:** Secure Supabase-backed authentication isolating standard Users and Property Owners.
- **Owner Dashboard:** Manage properties, view incoming booking requests, and track financial overviews.
- **Notifications Hub:** Real-time polling notification bell to alert users of booking updates, payment status, and system alerts.

## 🛠️ Technology Stack

**Frontend (Client)**
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **State Management:** Zustand, React Query
- **Styling:** Tailwind CSS v3, Custom CSS modules, Lucide React (Icons)
- **Maps:** Leaflet, React-Leaflet, React-Leaflet-Cluster

**Backend (Server)**
- **Environment:** Node.js + Express
- **Database:** PostgreSQL (Hosted on Supabase)
- **Auth & Storage:** Supabase Auth, Supabase Storage
- **Security:** Helmet, CORS, Express-Rate-Limit

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (or a Supabase project)

### 1. Database Setup
1. Create a Supabase project and grab your connection strings.
2. In the `server/` directory, create a `.env` file referencing the provided `.env.example`:
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
3. Run the database migrations & seeds:
```bash
cd server
node migrate.js
npm run seed
```

### 2. Run the Backend
```bash
cd server
npm i
npm run dev
```

### 3. Run the Frontend
```bash
cd client
npm i
npm run dev
```

Visit `http://localhost:5173` to explore the platform. Test accounts are automatically generated during the `npm run seed` phase (e.g., `user1@dummyinbox.com`, `owner1@dummyinbox.com`, password: `Test@1234`).

## 🤝 Contribution
Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.

## 📜 License
This project is licensed under the MIT License.
