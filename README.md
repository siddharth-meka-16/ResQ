# 🛡️ ResQ — Real-Time Disaster Intelligence, Autonomous Dispatch & Continuous Learning Platform

> **"Converting chaotic disaster signals into prioritized, life-saving rescue operations in real time."**

ResQ is an enterprise-grade disaster coordination and decision-support ecosystem built for Municipal Corporations, State Disaster Management Authorities (SDMA), and National Rescue Forces (NDRF/SDRF). It bridges the critical 120-minute "Golden Hours" window by combining real-time citizen SOS signals, live geospatial telemetry, and an autonomous multi-factor dispatch engine powered by Google Gemini AI.

---

## 🌟 Key Differentiators & Innovation Highlights

| Capability | Traditional Emergency Dispatch | Generic GIS Maps | **ResQ Platform** |
|---|:---:|:---:|:---:|
| **Citizen SOS Ingestion** | 112 Phone Call Queue (Overloaded) | Static Web Forms | **Zero-Login PWA (<10s) + Offline SMS Gateway** |
| **Operational Situational Map** | Siloed Radio Dispatch | Static Pins | **Live WebSocket Streaming (<100ms updates)** |
| **Resource Allocation Engine** | Manual Operator Discretion | Simple Distance Sorting | **Multi-Factor Algorithmic Scoring (Cutters/Boats/Fatigue)** |
| **Dynamic Hazard Replanning** | Navigation Fails on Collapsed Roads | Static Road Maps | **Real-Time Road Severance & Instant Fleet Rerouting** |
| **Hospital Telemetry & Diverts** | Paramedics Arrive at Saturated ERs | Phone Directory | **Live ICU Bed & Oxygen Telemetry with Auto-Diverts** |
| **Family Reunification** | Missing Persons Chalkboard Lists | Unlinked Spreadsheets | **Centralized Auto-Match Roster Across All City Shelters** |
| **AI Commander & Learning Loop**| None (Purely Reactive) | None | **Gemini 2.0 AI Copilot + Predictive Pre-Positioning** |

---

## 👥 4-Tier Role-Based Access Architecture

```
+-----------------------------------------------------------------------------------+
|                                  RESQ PLATFORM                                    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  1. CITIZEN             2. OPERATOR             3. FIELD SQUAD      4. SHELTER    |
|  (Trapped / Family)    (Incident Commander)     (NDRF / Fire / EMS)   (Relief Mgr)|
|       |                     |                         |                  |        |
|  [/report, /reunite]   [/dashboard, /map]           [/team]      [/shelter-manage]|
|       |                     |                         |                  |        |
|  Instant SOS          Multi-Factor Dispatch     Turn-by-Turn GPS   Camp Inventory |
|  Family Reunite       Gemini AI Copilot         Hazard Rerouting   Survivor Intake|
|  Open Shelters        Predictive Learning       On-Scene Triage    Auto-Match DB  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 1. Citizen (`CITIZEN` — `/report`, `/citizen`, `/reunite`)
- **Instant SOS**: Zero-login emergency reporting with GPS geolocation, hazard category (*Flood, Fire, Structural Collapse, Landslide, Medical*), and trapped casualty count in under 10 seconds.
- **Live Status Tracker**: Real-time progress updates (`VALIDATED` → `EN_ROUTE` → `ON_SCENE`).
- **Family Reunite**: Submit missing person inquiries and search survivor intakes across all city relief camps.

### 2. Control Room Operator (`OPERATOR` — `/dashboard`, `/dashboard/map`, `/dashboard/analytics`)
- **Tactical Command Map**: 360° operational situation picture on OpenStreetMap with interactive cluster heatmaps.
- **Autonomous Dispatch Engine**: Ranks top 3 best-suited rescue squads using multi-factor optimization:
  $$\text{Match Score} = \text{Haversine Distance} + \text{Equipment Capability Match} + \text{Squad Availability/Capacity}$$
- **Gemini AI Commander Copilot**: Real-time situational threat analysis, priority directives, and hospital saturation alerts.
- **Continuous Learning & Predictive Staging**: Analyzes past incident telemetry to pre-stage Zodiac boats and heavy rescue gear **12 hours before** forecasted cyclone or flood impacts.

### 3. Field Rescue Squad (`FIELD_TEAM` — `/team`)
- **Mobile-First Mission Console**: Mounted in rescue trucks or ruggedized mobile devices.
- **Dynamic Replanning & Rerouting**: Real-time road hazard detection that automatically recalculates routes around collapsed bridges or flooded underpasses.
- **On-Scene Casualty Triage**: 1-tap lifecycle progression (`PENDING` → `ACKNOWLEDGED` → `EN_ROUTE` → `ON_SCENE` → `COMPLETED`).
- **Direct Hospital Telemetry**: Telemetry lookup of verified ICU beds and oxygen capacity to divert trauma casualties to open facilities.

### 4. Relief Shelter & Camp Manager (`SHELTER_MANAGER` — `/shelter-manage`)
- **Live Bed Capacity & Census**: 1-tap census controls (`+1`, `+5`, `+10`, `-5`) updating camp status (`OPEN`, `FILLING`, `NEAR_CAPACITY`, `FULL`).
- **Relief Stock Inventory**: Real-time tracking of 8 essential supply categories (Food rations, Drinking water, Medical trauma kits, Blankets, Sanitation).
- **Survivor Registry**: Entry intake that cross-references the centralized reunification database to reconcile missing family reports automatically.

---

## 🤖 Google Gemini AI & Continuous Learning

ResQ integrates Google Gemini (`gemini-2.0-flash`) via a universal dual-tier engine with deterministic local fallback:
1. **AI Situational Copilot (`/api/ai/copilot`)**: Synthesizes active emergencies, fleet fatigue, and road hazard closures into actionable strategic directives for commanders.
2. **AI After-Action Review (`/api/ai/aar`)**: Audits closed disaster missions, evaluating triage accuracy and route friction to generate actionable municipal disaster policy recommendations.
3. **Predictive Pre-Positioning (`/dashboard/analytics`)**: Analyzes digital elevation models and historical incident frequency to pinpoint vulnerability hotspots (e.g. Ward 12 masonry collapse risk, Sector 3 lowlands).
4. **Closed-Loop Feedback Weight Tuning**: Recalibrates travel friction factors (+35% in floods) based on post-mission travel time telemetry.

---

## 🏛️ System Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                       CLIENT LAYER                          │
   │   Next.js 16 (Turbopack) · React 19 · TailwindCSS · Leaflet  │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │                             │
                   ▼                             ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────┐
   │      REST / API LAYER       │ │    REALTIME WEBSOCKETS      │
   │  Allocation · Replanning    │ │  Supabase Postgres Changes  │
   │  Gemini AI Copilot & AAR    │ │  Instant <100ms State Sync  │
   └───────────────┬─────────────┘ └─────────────┬───────────────┘
                   │                             │
                   ▼                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    SUPABASE / POSTGRESQL                    │
   │   PostGIS Geospatial · RLS Security · Automated Triggers    │
   └─────────────────────────────────────────────────────────────┘
```

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS, Lucide Icons.
- **Backend & Database**: Supabase (PostgreSQL, PostGIS, Realtime WebSockets, Row Level Security).
- **Mapping & Geodesy**: Leaflet, React-Leaflet, OpenStreetMap, Haversine Distance Matrix.
- **Artificial Intelligence**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) + Deterministic Tactical AI Engine.
- **Audio Synthesizer**: Web Audio API tactical sound generator (0 external assets, 100% offline-ready).

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd resq

# Install dependencies
npm install

# Configure environment variables (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# GEMINI_API_KEY=... (optional; built-in tactical engine works out of the box)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Configured Demo Accounts

All demo accounts use password: **`ResQ@2026!`**  
*(Or click the **⚡ 1-Click Demo Login** buttons on `/login` to sign in instantly!)*

| Role | Email | Target Console | Focus |
|---|---|---|---|
| **Incident Commander** | `operator@resq.gov` | `/dashboard` | Tactical Map, Dispatch Queue, Gemini Copilot |
| **Field Rescue Squad** | `field@resq.gov` | `/team` | Live Navigation, Roadblock Rerouting, Triage |
| **Shelter Manager** | `shelter@resq.gov` | `/shelter-manage` | Bed Capacity, Relief Stocks, Survivor Intake |
| **Citizen** | `citizen@resq.org` | `/report` & `/citizen` | Zero-Login SOS, Family Reunification |

---

## 🧪 Automated Testing & Verification Suite

```bash
# Run unit tests (Distance calculations, allocation engine, SMS parser)
npm run test

# Run TypeScript type verification
npx tsc --noEmit
```

---

## 📄 License

This project is licensed under the MIT License.
