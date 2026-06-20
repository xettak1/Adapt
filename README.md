# Adapt — Virtual RF Engineering Laboratory

Adapt is a browser-based RF lab platform for engineering students. It provides 7 virtual instruments, an adaptive AI tutor, gamified progression, and an instructor analytics dashboard. The frontend is a React + Vite SPA that runs entirely on mock data out of the box — no backend required.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8 |
| State | Zustand 5 (persisted), TanStack React Query 5 |
| UI | Tailwind CSS 3, Framer Motion 12, Recharts, dnd-kit |
| AI | Google Gemini 2.5 Flash (optional) + built-in offline tutor |
| Server | Nginx 1.27 (Alpine), Docker + Docker Compose |
| Backend (optional) | Spring Boot + PostgreSQL 16 |

## Getting Started

```bash
npm install
npm run dev          # http://localhost:5173
```

Copy `.env.example` to `.env.local` to override defaults. With `VITE_USE_MOCK=true` (the default) no backend is needed.

### Docker

```bash
cp .env.example .env

# Postgres only — run the frontend locally
docker compose --profile backend up -d
npm run dev

# Postgres + Nginx frontend
docker compose --profile backend --profile frontend up --build -d
# Frontend at http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | *(empty)* | Enables cloud AI tutor when set. Leave empty for offline tutor. |
| `VITE_USE_MOCK` | `true` | Set `false` to connect to the Spring Boot API. |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Backend base URL (used when mock is off). |
| `APP_PORT` | `3000` | Nginx container port. |
| `POSTGRES_DB / USER / PASSWORD` | `adapt / adapt / adapt_dev_password` | PostgreSQL credentials. |

## Virtual Instruments

All instruments share a live bench state managed by `WorkbenchCore`. Switching instruments is instant and state persists for the session.

| Instrument | Key Features |
|---|---|
| **RF Signal Generator** | 1 Hz – 6 GHz, Sine/Square/Triangle/Sawtooth/Pulse, AM/FM/PM modulation |
| **Oscilloscope** | Dual-channel, Volts/div, trigger, cursors, auto-measurements (Vpp, Vrms, freq, rise time) |
| **Spectrum Analyzer** | Harmonic display, peak detection, noise floor |
| **VNA** | S11/S21, Band-Pass/Low-Pass/High-Pass/Notch DUT filters |
| **Power Supply** | 3 configurable channels with current limiting |
| **Multimeter** | DC/AC voltage, resistance, continuity |
| **Logic Analyzer** | Multi-channel digital capture |

## AI Tutor

The tutor panel is embedded in the workbench and adapts to the student's mastery level (Beginner / Intermediate / Advanced). Six teach-mode buttons let students choose the type of help: **Teach Me**, **Explain This**, **Why?**, **Show Example**, **Simplify**, **Go Deeper**.

- **Offline engine** (`src/utils/tutorEngine.js`) — knowledge base covering all instruments, progressive 4-level hints, reactive coaching on parameter changes, proactive tips on instrument switch. No API key needed.
- **Gemini mode** (`src/utils/geminiService.js`) — enabled by setting `VITE_GEMINI_API_KEY`. Rate-limited to 12 req/60 s, 5-minute response cache, auto-falls back to offline on error.

## Gamification

XP, levels, streaks, per-module mastery (0–100%), badges (e.g. `trigger-master`, `spectrum-hunter`), and a peer leaderboard. Progress is stored in Zustand with localStorage persistence.

## Experiments & Challenges

7 guided experiments (Oscilloscope Fundamentals, Signal Generation, Frequency Measurement, Harmonic Analysis, Filter Characterization, Noise Analysis, RF Signal Observation) and 3 auto-graded challenges that validate live bench state against a goal — e.g. "output a 2 MHz square wave."

## Roles

| Role | Access |
|---|---|
| **Student** | Workbench, lessons, challenges, personal dashboard |
| **Instructor** | Class heatmap, per-student drill-down, weak-skill identification |

**Demo credentials** (mock mode): `student@knust.edu.gh` / `instructor@knust.edu.gh` — password `password`.

Onboarding (module selection + diagnostic quiz) is gated before students access the lab.

## Database

```
host: localhost  port: 5432  db: adapt  user: adapt  password: adapt_dev_password
```

Inside Docker network (Spring Boot): `jdbc:postgresql://db:5432/adapt`. Schema is owned by the backend; SQL in `docker/postgres/init/` runs once on first volume creation.

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # Production build → /dist
npm run preview   # Serve /dist locally
npm run lint      # ESLint
```
