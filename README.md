# PakiPark — Smart Parking Reservation System

> **Smart Parking Ecosystem** · Stack: **Next.js (App Router)** + **Express.js (Node.js)** + **PostgreSQL**

PakiPark is a comprehensive parking management and reservation platform designed to streamline the parking experience for both drivers and facility operators. It features real-time slot tracking, automated billing, and a modern, mascot-driven user interface.

## 🏗️ Project Structure

```
PakiPark/
├── src/
│   ├── Frontend/          ← Next.js 15 App Router (React 18 + TypeScript)
│   │   ├── src/
│   │   │   ├── app/       ← Pages (Home, Help Center, Auth)
│   │   │   ├── components/ ← UI Components (Hero, LandingFAQ, Navbar)
│   │   │   └── services/  ← API communication layer
│   │   └── public/assets/ ← Mascot images, Hero video, & static files
│   │
│   └── Backend/           ← Express.js API (Node.js)
│       ├── controllers/   ← Request handlers (Bookings, Slots, Users)
│       ├── models/        ← Sequelize Database Models
│       ├── routes/        ← API Endpoints
│       ├── middleware/    ← Auth & Validation
│       ├── scripts/       ← DB Sync & Maintenance
│       └── server.js      ← Entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase instance)

### 1. Install Dependencies

```bash
# Backend
cd src/Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment

**Backend:** Create `src/Backend/.env` with your Supabase/PostgreSQL connection string.
**Frontend:** Create `src/Frontend/.env.local` pointing `NEXT_PUBLIC_API_URL` to `http://localhost:5000/api`.

### 3. Run in Development

```bash
# Terminal 1 — Backend (Port 5000)
cd src/Backend
npm run dev

# Terminal 2 — Frontend (Port 3000)
cd src/Frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | **Next.js 15** (React 18) |
| Backend  | **Express.js** (Node.js) |
| Database | **PostgreSQL** (via Sequelize ORM) |
| UI/UX    | Tailwind CSS, Lucide Icons, Framer Motion |
| Storage  | **Supabase** |

## 💡 Key Features

- **Real-Time Reservations** — Tap and reserve parking spots in advance.
- **Smart Hero Section** — Interactive intro video and mascot-driven storytelling.
- **Advanced FAQ System** — Categorized help center with modern animations.
- **Operator Dashboard** — Manage facility hours, parking slots, and transactions.
- **Fair Billing** — Ceiling-based pricing (₱15/hr) with initial free grace periods.
- **Mascot Identity** — Brand-integrated mascot for a friendly user experience.

## 📋 Features Checklist

- [x] Modern Hero with Video Background
- [x] Framed Mascot Avatar Design System
- [x] Multi-Category FAQ with search
- [x] Responsive "How It Works" illustrations
- [x] JWT-based Authentication
- [x] Sequelize Database Synchronization

---
