<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
</p>

# 🏠 MoveMate — Your Relocation Companion

> A full-stack multi-service platform for people relocating to a new city in Bangladesh. Find rental properties, discover nearby essential services, and access emergency contacts — all in one place.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**MoveMate** solves the pain of relocating to a new city. Instead of juggling multiple apps for housing, pharmacies, banks, and emergency numbers, MoveMate combines everything into one platform.

### Two User Roles

| Role | Description |
|------|-------------|
| **Renter** | Search, filter, and book rental properties. Discover nearby services and access emergency contacts. |
| **Property Owner** | List properties, manage bookings, respond to inquiries, and track earnings. |

### Three Booking Flows

| Flow | Use Case | How It Works |
|------|----------|-------------|
| 🏨 **Hotel Style** | Hotels, guest houses | Select dates → Price breakdown → Pay Now or Pay at Property |
| 📅 **Short Term** | Sublets, apartments | Instant Book (auto-confirmed) or Request (owner approves) |
| 📝 **Long Term** | Flats, to-lets | Express Interest → Owner Schedules Visit → Sign Agreement |

---

## ✨ Features

### 🏘️ Property Listings
- Browse by type: Hotel, Flat, Apartment, Sublet, To-Let, Room
- Dynamic filters: price range, city, bedrooms, guests, location radius
- Image galleries with Cloudinary CDN
- Owner contact gating (phone/email visible only to authenticated users)

### 📍 Nearby Essentials
- Find pharmacies, hospitals, grocery stores, banks, restaurants, fuel stations
- Location-based radius search using PostgreSQL `earthdistance` extension
- Category filtering with distance calculations

### 🆘 Emergency Contacts
- Police, Fire, Ambulance, Gas Leak, Women's & Child Helplines
- Public access — no login required
- Location-aware and city-based fallback
- Designed for offline caching via `localStorage`

### 🔔 Notifications
- In-app notification bell with unread count
- Email notifications via Nodemailer (Ethereal Email for dev)
- Triggers: booking requests, confirmations, reviews, visits, payments

### 🔐 Authentication
- JWT-based with access token (15 min) + refresh token (7 days)
- Role-based access control: User, Owner, Admin
- Automatic token refresh on 401 via Axios interceptor

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20** | Runtime |
| **Express.js 4** | REST API framework |
| **PostgreSQL 16** | Database with `earthdistance` extension |
| **pg (node-postgres)** | Raw SQL driver — no ORM |
| **JWT** | Authentication (access + refresh tokens) |
| **bcryptjs** | Password hashing (12 salt rounds) |
| **Cloudinary** | Image storage and CDN |
| **Nodemailer** | Email notifications |
| **Multer** | File upload handling |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library |
| **Vite 8** | Build tool and dev server |
| **Tailwind CSS 3** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Zustand** | State management (with localStorage persistence) |
| **TanStack React Query** | Server state caching |
| **Axios** | HTTP client with JWT interceptors |
| **Leaflet + OpenStreetMap** | Maps (free, no API key) |
| **Lucide React** | Icons |
| **React Hook Form + Zod** | Form handling and validation |

---

## 🏗 Architecture

```
MoveMateV1/
├── server/              ← Express REST API (Port 5000)
│   ├── migrations/      ← 8 SQL migration files
│   ├── seeds/           ← Development seed data
│   └── src/
│       ├── config/      ← Database, Cloudinary, Email
│       ├── middleware/   ← Auth, Error Handler, Upload
│       ├── queries/     ← Raw parameterized SQL
│       ├── controllers/ ← Business logic
│       └── routes/      ← Express route definitions
│
├── client/              ← React SPA (Port 5173)
│   └── src/
│       ├── api/         ← Axios API modules
│       ├── store/       ← Zustand state stores
│       ├── components/  ← Shared UI components
│       ├── pages/       ← Route page components
│       └── utils/       ← Helpers and constants
```

### Key Design Principles

1. **Owner contact gating** — Owner phone/email stripped at the SQL query level for unauthenticated requests
2. **Parameterized SQL everywhere** — All queries use `$1, $2` placeholders, never string interpolation
3. **Spatial queries** — PostgreSQL `earthdistance` with GiST indexes for radius-based searches
4. **Separate booking flows** — Three genuinely different flows, never merged into one generic handler
5. **Offline emergency** — Emergency contacts designed for `localStorage` caching

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 16
- **npm** ≥ 9
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/Agentsh007/MoveMate.git
cd MoveMate
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create the database:
```sql
CREATE DATABASE movemate;
```

Configure environment variables (see [Environment Variables](#-environment-variables)), then run:

```bash
node migrate.js        # Create tables and indexes
node seeds/seed.js     # Seed development data
npm run dev            # Start server at http://localhost:5000
```

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev            # Start at http://localhost:5173
```

### 4. Verify

```bash
# Health check
curl http://localhost:5000/api/health

# Login with seed account
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner1@ethereal.email","password":"Test@1234"}'
```

---

## 🔑 Environment Variables

### `server/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/movemate

# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Ethereal for development)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_ethereal_user
EMAIL_PASS=your_ethereal_pass

# Payment (stubbed)
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄 Database Schema

8 migration files create the following structure:

| Table | Description |
|-------|-------------|
| `users` | User accounts with role enum (user/owner/admin) |
| `user_profiles` | Avatars, location, city |
| `properties` | Listings with type, booking model, price, coordinates |
| `property_images` | CDN image URLs with primary flag |
| `property_amenities` | WiFi, AC, Parking, etc. |
| `property_rules` | No smoking, quiet hours, etc. |
| `bookings` | Reservations with 6-type enum and status workflow |
| `booking_requests` | Owner approval flow for short-term |
| `rental_visits` | Scheduled visits for long-term |
| `rental_agreements` | Contract details for long-term |
| `payments` | bKash, Nagad, card, cash with status tracking |
| `reviews` | 1–5 star ratings linked to completed bookings |
| `essential_categories` | Pharmacy, Hospital, Bank, etc. |
| `essential_services` | Nearby services with spatial index |
| `emergency_categories` | Police, Fire, Ambulance, etc. |
| `emergency_contacts` | Emergency numbers with spatial index |
| `notifications` | In-app notifications with JSONB payload |
| `saved_listings` | User bookmarks |
| `moving_waitlist` | Email collection for future features |

### PostgreSQL Extensions Used

- `uuid-ossp` — UUID generation for primary keys
- `cube` + `earthdistance` — Efficient radius-based spatial queries

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Create new account |
| `POST` | `/auth/login` | — | Login, receive JWT tokens |
| `POST` | `/auth/logout` | 🔒 | Logout |
| `GET` | `/auth/me` | 🔒 | Get current user profile |
| `POST` | `/auth/refresh` | — | Refresh access token |
| `PUT` | `/auth/profile` | 🔒 | Update user profile |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+8801700000000",
  "password": "SecurePass123",
  "role": "user"
}
```

**Login Response:**
```json
{
  "success": true,
  "user": { "id": "uuid", "name": "John", "email": "...", "role": "user" },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Properties

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/properties` | — | List with filters |
| `GET` | `/properties/featured` | — | Featured listings |
| `GET` | `/properties/:id` | Optional | Detail (contact gated) |
| `POST` | `/properties` | 🔒 Owner | Create listing |
| `PUT` | `/properties/:id` | 🔒 Owner | Update listing |
| `DELETE` | `/properties/:id` | 🔒 Owner | Delete listing |
| `GET` | `/properties/owner/my-listings` | 🔒 Owner | Owner's listings |
| `POST` | `/properties/:id/images` | 🔒 Owner | Upload images |
| `DELETE` | `/properties/:id/images/:imgId` | 🔒 Owner | Delete image |

**Filter Query Parameters:**
```
GET /properties?type=flat&city=Dhaka&minPrice=10000&maxPrice=30000&bedrooms=2&guests=4&lat=23.81&lng=90.41&radius=5&sort=price_low&page=1&limit=12
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `hotel`, `flat`, `apartment`, `sublet`, `tolet`, `room` |
| `city` | string | City name filter |
| `minPrice` / `maxPrice` | number | Price range |
| `bedrooms` | number | Minimum bedrooms |
| `guests` | number | Minimum guest capacity |
| `lat` / `lng` / `radius` | number | Location radius search (km) |
| `sort` | string | `price_low`, `price_high`, `rating` |
| `page` / `limit` | number | Pagination |

---

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bookings` | 🔒 | Create booking |
| `GET` | `/bookings` | 🔒 | List user/owner bookings |
| `GET` | `/bookings/:id` | 🔒 | Booking detail |
| `PUT` | `/bookings/:id/status` | 🔒 Owner | Accept/reject booking |
| `POST` | `/bookings/:id/pay` | 🔒 | Process payment |
| `POST` | `/bookings/:id/visit` | 🔒 Owner | Schedule visit (long-term) |
| `POST` | `/bookings/:id/agreement` | 🔒 Owner | Create agreement (long-term) |

**Booking Types:**
```
hotel_pay_now | hotel_pay_at_property | short_term_instant | short_term_request | long_term_inquiry
```

**Create Booking Request:**
```json
{
  "property_id": "uuid",
  "booking_type": "hotel_pay_now",
  "check_in": "2025-12-01",
  "check_out": "2025-12-05",
  "guests": 2,
  "total_price": 14000,
  "message": "Looking forward to staying!"
}
```

---

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/reviews` | 🔒 | Submit review (requires booking) |
| `GET` | `/reviews/property/:propertyId` | — | Get property reviews + breakdown |

**Review Response includes:**
```json
{
  "reviews": [...],
  "summary": {
    "count": 15,
    "average": "4.3",
    "breakdown": { "1": 0, "2": 1, "3": 2, "4": 5, "5": 7 }
  }
}
```

---

### Nearby Essentials

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/essentials?lat=23.81&lng=90.41&radius=5` | — | Nearby services |
| `GET` | `/essentials?lat=...&lng=...&category=uuid` | — | Filter by category |
| `GET` | `/essentials/categories` | — | List categories |
| `POST` | `/essentials/report` | — | Report incorrect info |

**Response includes distance:**
```json
{
  "name": "Square Hospital",
  "address": "Panthapath, Dhaka",
  "phone": "+880-2-8159457",
  "distance_km": 1.23,
  "category_name": "Hospital",
  "category_icon": "Hospital"
}
```

---

### Emergency Contacts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/emergency?lat=23.81&lng=90.41` | — | By location |
| `GET` | `/emergency?city=Dhaka` | — | By city (fallback) |
| `GET` | `/emergency/categories` | — | List categories |
| `POST` | `/emergency/report` | — | Report wrong number |

> ⚠️ All emergency endpoints are **public** — no authentication required.

---

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | 🔒 | List notifications + unread count |
| `PUT` | `/notifications/:id/read` | 🔒 | Mark as read |
| `PUT` | `/notifications/read-all` | 🔒 | Mark all as read |

---

### Saved Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/saved-listings` | 🔒 | List saved properties |
| `POST` | `/saved-listings` | 🔒 | Save a property |
| `DELETE` | `/saved-listings/:propertyId` | 🔒 | Remove from saved |
| `GET` | `/saved-listings/check/:propertyId` | 🔒 | Check if saved |

---

### Other

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Server health check |
| `POST` | `/moving-waitlist` | — | Join waitlist (email) |

---

## 📁 Project Structure

<details>
<summary><strong>Backend</strong> — <code>server/</code></summary>

```
server/
├── package.json
├── server.js                     # Entry point
├── migrate.js                    # Migration runner
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_properties.sql
│   ├── 003_create_bookings.sql
│   ├── 004_create_payments.sql
│   ├── 005_create_reviews.sql
│   ├── 006_create_essentials.sql
│   ├── 007_create_emergency.sql
│   └── 008_create_notifications.sql
├── seeds/
│   └── seed.js                   # Dev seed data (Dhaka)
└── src/
    ├── app.js                    # Express app config
    ├── config/
    │   ├── db.js                 # PostgreSQL pool
    │   ├── cloudinary.js         # Image CDN
    │   └── email.js              # Nodemailer (Ethereal)
    ├── middleware/
    │   ├── auth.js               # JWT + role guards
    │   ├── errorHandler.js       # Global error handler
    │   └── upload.js             # Multer config
    ├── queries/
    │   ├── user.queries.js
    │   ├── property.queries.js
    │   ├── booking.queries.js
    │   └── location.queries.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── property.controller.js
    │   ├── booking.controller.js
    │   ├── review.controller.js
    │   ├── essentials.controller.js
    │   ├── emergency.controller.js
    │   └── notification.controller.js
    └── routes/
        ├── auth.routes.js
        ├── property.routes.js
        ├── booking.routes.js
        ├── review.routes.js
        ├── essentials.routes.js
        ├── emergency.routes.js
        └── notification.routes.js
```

</details>

<details>
<summary><strong>Frontend</strong> — <code>client/</code></summary>

```
client/
├── index.html
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                   # Router + providers
    ├── index.css                 # Design system + Tailwind
    ├── api/
    │   ├── axiosInstance.js       # JWT interceptor
    │   ├── auth.api.js
    │   ├── property.api.js
    │   ├── booking.api.js
    │   └── location.api.js
    ├── store/
    │   ├── authStore.js          # Zustand (persisted)
    │   └── notificationStore.js
    ├── utils/
    │   ├── constants.js
    │   ├── formatPrice.js
    │   └── formatDate.js
    ├── components/shared/
    │   ├── Navbar.jsx
    │   ├── Footer.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── NotificationBell.jsx
    │   └── BookingStatusBadge.jsx
    └── pages/
        ├── Home.jsx
        ├── Listings.jsx
        ├── PropertyDetail.jsx
        ├── Essentials.jsx
        ├── Emergency.jsx
        ├── auth/ (Login, Register)
        ├── dashboard/ (UserDashboard, OwnerDashboard)
        └── owner/ (AddListing)
```

</details>

---

## 🧪 Test Accounts

After running `node seeds/seed.js`:

| Email | Password | Role |
|-------|----------|------|
| `owner1@ethereal.email` – `owner5@ethereal.email` | `Test@1234` | Owner |
| `user1@ethereal.email` – `user2@ethereal.email` | `Test@1234` | User |

**Seed data includes:** 15 properties across all types, essential services (pharmacies, hospitals, banks in Dhaka), and emergency contacts.

---

## 📧 Email Testing

Development uses **Ethereal Email** (fake SMTP — emails are captured, never delivered).

1. Go to [https://ethereal.email/login](https://ethereal.email/login)
2. Login with the credentials from your `server/.env`
3. View all notification emails in the inbox

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ for making relocation easier in Bangladesh
</p>
