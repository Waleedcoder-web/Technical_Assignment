# HavenKey Mobile App

Flutter mobile application for the HavenKey Real Estate platform.

---

## Prerequisites

Install the following software before running the application:

1. Flutter SDK version 3.0.0 or higher
2. Dart SDK version 3.0.0 or higher
3. Android Studio with Android SDK and an Android Virtual Device (AVD) or a physical Android/iOS device
4. VS Code with Flutter extension or Android Studio

Verify your Flutter installation:

```bash
flutter doctor
```

---

## Installation Steps

1. Open a terminal and navigate to the mobile app directory:

```bash
cd "mobile app"
```

2. Download all project dependencies:

```bash
flutter pub get
```

3. Verify connected devices:

```bash
flutter devices
```

---

## Running the Application

### Option 1: Run on an Android Emulator or Physical Device

1. Start your Android emulator or connect a physical device via USB with USB debugging enabled.
2. Launch the application:

```bash
flutter run
```

### Option 2: Run via Android Studio

1. Open Android Studio.
2. Click File then Open and select the folder path:
   `d:\patronecs\mobile app`
3. Wait for Gradle sync and Flutter indexing to complete.
4. Select your target device or emulator from the device dropdown.
5. Click the Run button or press Shift + F10.

### Option 3: Run via VS Code

1. Open the folder `mobile app` in VS Code.
2. Open `lib/main.dart`.
3. Press F5 or click Run Without Debugging.
4. Select your running emulator from the device picker.

### Option 4: Run on Web Browser

```bash
flutter run -d chrome
```

---

## Project Structure

```
mobile app/
├── lib/
│   ├── main.dart
│   ├── constants/
│   │   ├── api_constants.dart
│   │   ├── app_colors.dart
│   │   └── app_typography.dart
│   ├── models/
│   │   ├── agreement_model.dart
│   │   ├── chat_model.dart
│   │   ├── complaint_model.dart
│   │   ├── property_model.dart
│   │   └── user_model.dart
│   ├── providers/
│   │   ├── app_state.dart
│   │   └── auth_provider.dart
│   ├── screens/
│   │   ├── admin_dashboard_screen.dart
│   │   ├── ai_assistant_screen.dart
│   │   ├── customer_dashboard_screen.dart
│   │   ├── home_screen.dart
│   │   ├── login_screen.dart
│   │   ├── main_shell.dart
│   │   ├── property_details_screen.dart
│   │   ├── property_listings_screen.dart
│   │   ├── register_screen.dart
│   │   ├── saved_properties_screen.dart
│   │   └── splash_screen.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   └── mock_data.dart
│   └── widgets/
│       ├── bottom_nav_bar.dart
│       ├── escrow_chart.dart
│       ├── filter_drawer.dart
│       ├── property_card.dart
│       ├── search_hero.dart
│       └── top_header.dart
├── pubspec.yaml
└── requirements.txt
```

---

## Screen List

1. Mobile Home: Featured verified properties, quick search, and market highlights.
2. Property Listings: Omni-search with city and price filters for houses, apartments, and plots.
3. Property Details: Photo galleries, specifications, pricing, and reservation options.
4. AI Real Estate Assistant: Real-time chat assistant for properties and tenancy policies.
5. User Login: Authentication supporting email, phone, and role switching.
6. User Registration: User sign-up with CNIC formatting and role assignment.
7. Customer Dashboard: Leased properties, rent escrow tracking, and maintenance tickets.
8. Admin Operations Dashboard: System verification, property management, and complaint triage.
