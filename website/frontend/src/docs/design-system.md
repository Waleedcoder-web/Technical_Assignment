# HavenKey - Estate Modern Design System

Extracted directly from Stitch Project ID: **`5329307085948375889`**

---

## 1. Brand Identity & Personality

* **Aesthetic Movement:** Warm Corporate Modernism meets Editorial Spatial Minimal.
* **Core Personality:** Architectural & Authoritative, Calm Clarity, Understated Precision.
* **Palette Roles:**
  * **Primary Anchor:** Maritime Deep Navy (`#001637` / `#172b4d`)
  * **Accent Horizon:** Muted Teal (`#076a64` / `#3c8d87` / `#a1f1e9`)
  * **Canvas:** Soft Plaster Neutral (`#f8f9fb` / `#edeef0` / `#ffffff`)
  * **Text:** Sharp Dark Slate (`#191c1e` / `#202b3c`) & Balanced Slate (`#44474e` / `#75777f`)

---

## 2. Color Tokens

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `primary` | `#001637` | Core headers, authoritative anchors, primary buttons |
| `primary-container` | `#172b4d` | Card headers, toggles, elevated containers |
| `on-primary` | `#ffffff` | Text on primary containers |
| `secondary` | `#076a64` | Primary brand accent, verified badges, action buttons |
| `secondary-container`| `#a1f1e9` | High-visibility badges, status pills, accent glow |
| `on-secondary-container`| `#15706b` | Text on secondary container pills |
| `surface` | `#f8f9fb` | Main canvas background |
| `surface-container-lowest` | `#ffffff` | Card surfaces, modal sheets |
| `surface-container-low` | `#f2f4f6` | Section alternating backgrounds, inputs |
| `surface-container` | `#edeef0` | Subtle dividers, toggle tracks |
| `outline` | `#75777f` | Standard borders |
| `outline-variant` | `#c5c6cf` | Subtle card borders |

---

## 3. Typography Hierarchy

* **Headings, Display & Metrics:** `Plus Jakarta Sans` (weights 600, 700)
* **Body, Forms, Micro-copy, & Data:** `Inter` (weights 400, 500, 600)
* **Icons:** `Google Material Symbols Outlined`

---

## 4. Frontend Route Architecture

```
d:/patronecs/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # [Public] Homepage
│   │   ├── properties/
│   │   │   ├── page.tsx                 # [Public/User] Property Listings
│   │   │   └── [id]/page.tsx            # [Public/User] Property Details & Booking
│   │   ├── ai-assistant/
│   │   │   └── page.tsx                 # [User] AI Real Estate Copilot
│   │   ├── user/
│   │   │   └── dashboard/page.tsx       # [User Side] Customer Dashboard
│   │   └── admin/
│   │       └── dashboard/page.tsx       # [Admin Side] Admin Operations Dashboard
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   └── ui/
│   │       ├── property-card.tsx
│   │       └── search-terminal.tsx
│   └── lib/
│       └── mock-data.ts
```
