# HavenKey Sovereign Real Estate Platform

HavenKey is an end-to-end real estate solution consisting of a full-stack web platform and a Flutter cross-platform mobile application.

---

## Repository Structure

```
patronecs/
├── website/
│   ├── frontend/        # Next.js 16 Web Application with Local AI Assistant
│   ├── backend/         # Express.js REST API with Supabase PostgreSQL
│   ├── package.json     # Monorepo Workspace Configuration
│   ├── requirements.txt # Complete Dependencies List
│   └── README.md        # Website Setup and Execution Guide
└── mobile app/
    ├── lib/             # Flutter Application Code (Dart)
    ├── android/         # Android Native Project Scaffold
    ├── ios/             # iOS Native Project Scaffold
    ├── pubspec.yaml     # Flutter Dependencies Specification
    ├── requirements.txt # Complete Mobile Requirements List
    └── README.md        # Mobile App Setup and Execution Guide
```

---

## Quick Start Guide

### 1. Web Application Setup and Execution

Prerequisites: Node.js 20.0.0 or higher.

```bash
cd website
npm install
npm run setup:ai
npm run dev
```

- Frontend URL: http://localhost:3000
- Backend API URL: http://localhost:5000

---

### 2. Mobile Application Setup and Execution

Prerequisites: Flutter SDK 3.0.0 or higher, Android Studio or VS Code with an emulator or physical device.

```bash
cd "mobile app"
flutter pub get
flutter run
```

To run the mobile app on Chrome:

```bash
cd "mobile app"
flutter run -d chrome
```

---

## Detailed Documentation

Refer to the individual documentation files for detailed configurations, environment variables, and screen lists:

- Website Documentation: website/README.md
- Mobile App Documentation: mobile app/README.md
