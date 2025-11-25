## Overview
- Build a modern, animated web UI using Vanilla JavaScript (no React) hosted in `frontEnd/`.
- ESP32 connects to PC hotspot SSID `LabExpert_1.0`, password `11111111` and exposes REST + WebSocket APIs.
- Browser app communicates with ESP32 for commands and real-time signals; all branding, logos, and animations run in the frontend.

## Network & Communication
- ESP32: Wi‑Fi STA connects to `LabExpert_1.0` with auto‑reconnect; enable mDNS (`esp32.local`).
- APIs: REST for commands/config and WebSocket for real‑time events.
- CORS: Allow cross‑origin requests from local files or dev server.

## ESP32 Firmware (Scope)
- Keep existing buzzer/LED logic and 10‑participant interrupts.
- REST endpoints:
  - `GET /api/health` → status (ip, ssid, uptime).
  - `POST /api/game/start` → `{ durationMs }` starts countdown.
  - `POST /api/game/reset` → clears state.
  - `POST /api/buzzer/pattern` → `{ pattern }` set pattern.
  - `GET /api/status` → `{ gameActive, remainingMs, pressOrder }`.
- WebSocket (`/ws`): push `press`, `countdown`, `result` events.
- Minimal config persistence (optional) in NVS for default buzzer pattern.

## Frontend App (Vanilla JS)
- Structure in `frontEnd/`:
  - `index.html` (router shell), `login.html`, `config.html`, `main.html`.
  - `css/` (Tailwind-like utility CSS or custom modern styles, glassmorphism, gradients).
  - `js/app.js` (routing/init), `js/api.js` (REST/WS), `js/state.js` (store), `js/ui/*.js` (pages/components), `assets/` (logos/fonts).
- Storage: Save config in `localStorage`; on Begin, send duration/pattern to ESP32.

## Pages & Features
### 1) Login Page
- Hardcoded credentials; gate access to Config & Main.
- Animated logo on login (GIF/SVG), subtle blur/glow, button press effects.

### 2) Configuration Panel (Main Control Center)
- i. Custom Logo Management: upload/select PNG/GIF; preview and animated render (CSS filters, keyframes).
- ii. Logo Description & Quotes: input header text; live preview; stored and used on Main.
- iii. Question Timer Settings: per‑question duration; countdown style selection; timeout behavior.
- iv. Team Management (up to 10, pick fewer if needed): name entry, logo assignment, visual cards with color badges.
- v. Buzzer Pattern Configuration: dropdown to pick ESP32 patterns; test button to send temporary pattern to ESP32.
- Save/Apply: persist to `localStorage`; push pattern/duration to ESP32 as needed.

### 3) Main Game Dashboard
- Header: configured logo with animated display (intro reveal, pulse glow).
- Quote: brand message under header.
- Controls: Begin (starts countdown via REST), Reset (clears via REST).
- Countdown: radial SVG ring animation; live updates via WS.
- Live Leaderboard: real‑time all team ranking from `press` events.
- Timeout result: show only Top 3 with podium animation; below, a prominent Begin button for next question.

## Animations & Modern UI
- Use CSS keyframes and transitions for performance; optional GSAP for finer control.
- Effects: glassmorphism panels, gradient accents, neon glows, parallax on header, springy transitions for leaderboard entries.
- Animated logos: GIF support; optional Lottie (JSON) if desired (hosted locally).

## State & Data Flow
- Frontend maintains full UI config: teams, logos, quotes, duration.
- On Begin: send `{ durationMs, pattern }` to ESP32; subscribe to WS for presses and countdown.
- Compute leaderboard and Top 3 client‑side after timeout.

## Build & Run
- Simple static hosting (open `index.html`) or lightweight dev server.
- `.env.js` holding `ESP32_BASE_URL` defaulting to `http://esp32.local`.
- Asset size control: compress images; lazy‑load logos.

## Verification
- ESP32 connects to hotspot; `esp32.local` resolves.
- Login → Config → set teams/logos → Main → Begin; observe buzzer/presses reflect in UI via WS.
- After timeout, only Top 3 shown with animation; Reset and start next question.

If this plan matches your requirements, I will implement the ESP32 APIs (STA/mDNS/CORS/REST/WS) and scaffold the `frontEnd/` Vanilla JS app with pages, state, and modern animations.