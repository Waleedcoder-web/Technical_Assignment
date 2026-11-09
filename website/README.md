# HavenKey Website Platform

Full-stack real estate web application built with Next.js 16, React 19, Tailwind CSS, Express.js REST API, Supabase PostgreSQL, and local ONNX AI assistant.

---

## Prerequisites

Ensure the following tools are installed on your system:

1. Node.js version 20.0.0 or higher
2. npm version 9.0.0 or higher
3. Git

Check your installations:

```bash
node -v
npm -v
```

---

## Installation Steps

1. Clone or open the repository on your machine:

```bash
cd website
```

2. Install all dependencies for both frontend and backend monorepo workspaces:

```bash
npm install
```

3. Download local AI inference models (Embeddings and Qwen LLM):

```bash
npm run setup:ai
```

---

## Environment Configuration

### Frontend Environment File

Ensure the file `website/frontend/.env.local` contains the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_app_password
SMTP_FROM=your_email@gmail.com
```

### Backend Environment File

Ensure the file `website/backend/.env` contains:

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:3000
```

---

## Running the Application

### Option 1: Run Full Monorepo Concurrently

Run both frontend and backend together with a single command from the `website` directory:

```bash
cd website
npm run dev
```

- Frontend interface will be available at: http://localhost:3000
- Backend REST API will be available at: http://localhost:5000

---

### Option 2: Run Frontend and Backend Separately

To run the Next.js frontend alone:

```bash
cd website/frontend
npm run dev
```

To run the Express.js backend alone:

```bash
cd website/backend
npm run dev
```

---

## Production Build

To verify and generate optimized production builds:

```bash
cd website
npm run build
```

To start the production server:

```bash
npm run start
```

---

## Available Application Routes

1. Landing Page: http://localhost:3000
2. Property Catalog: http://localhost:3000/properties
3. Add Property: http://localhost:3000/properties/add
4. AI Real Estate Assistant: http://localhost:3000/ai-assistant
5. User Reservations & Departures: http://localhost:3000/reservations
6. Maintenance Complaints Portal: http://localhost:3000/complaints
7. User Personal Dashboard: http://localhost:3000/user/dashboard
8. Administrator Operations Console: http://localhost:3000/admin/dashboard
9. User Authentication (Login): http://localhost:3000/login
10. User Registration (Signup): http://localhost:3000/signup
