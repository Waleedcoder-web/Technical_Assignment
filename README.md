# Technical_Assignment

# HavenKey - Next-Gen Real Estate & Sovereign Property Platform

A full-stack, enterprise-grade real estate ecosystem built with **Next.js 16 (Turbopack, React 19, Tailwind CSS v4)** and **Express.js (TypeScript, Supabase PostgreSQL, Bcrypt)**.

---

## 🌟 Key Features

1. **Enterprise Authentication & Strict Validation:**
   - Strict A-to-Z field-level validation for Legal Name (alphabets and spaces only), Pakistani Mobile (+92 / 03), CNIC (NADRA standard `XXXXX-XXXXXXX-X`), Address, 5-digit Postal Code, and 5-point Password Complexity.
   - Secure **Bcrypt (cost factor 10)** password encryption before saving to database.
   - Role-based access control with conditional navbar displaying authenticated user avatar initials and admin dashboard access.

2. **Frontend (Next.js 16 App Router):**
   - High-fidelity UI built with modern Stitch design tokens.
   - Property Search Terminal with filters (city, type, Marla size, budget PKR).
   - Dynamic Property detail pages (`/properties/[id]`) with interactive gallery, floor plans, and biometric landlord verification badges.
   - AI Concierge Assistant (`/ai-assistant`) for real-time rental estimates, lease advisory, and tenant-landlord mediation.
   - Role-specific dashboards for Admin operations and Tenant/Landlord portfolio management.

3. **Backend (Express.js & TypeScript):**
   - Direct, streamlined REST architecture (`/api/users`, `/api/properties`, `/api/complaints`, `/api/roles`, `/api/chatsmessage`, `/api/agreement`).
   - Integrated with Supabase PostgreSQL with schema definitions for `roles` and `users`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** or **yarn**

### 2. Installation
Install dependencies for both frontend and backend from the root directory:
```bash
npm install
```

### 3. Running the Project

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run individually:
```bash
# Frontend (http://localhost:3000)
cd frontend
npm run dev

# Backend (http://localhost:5000)
cd backend
npm run dev
```

---

## 📁 Project Structure

```
├── frontend/                  # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── app/               # Routes: /, /login, /signup, /properties, /ai-assistant, /admin
│   │   ├── components/        # UI components (Navbar, Footer, PropertyCard, Search)
│   │   └── lib/               # Mock data & Supabase client
│   ├── requirements.txt
│   └── package.json
│
├── backend/                   # Express.js TypeScript backend
│   ├── src/
│   │   ├── lib/               # Types, Supabase client, seed data
│   │   └── server.ts          # Express API server & routes
│   ├── database/
│   │   └── schema.sql         # Supabase PostgreSQL schema script
│   ├── requirements.txt
│   └── package.json
│
├── package.json               # Monorepo runner
└── README.md
```
