<p align="center">
  <img src="https://img.shields.io/badge/ESP32-Firmware-blue?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32"/>
  <img src="https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/PlatformIO-IDE-F5822A?style=for-the-badge&logo=platformio&logoColor=white" alt="PlatformIO"/>
</p>

# ⚡ Quiz Bowl Buzzer System

> A **full-stack quiz competition buzzer system** featuring an ESP32-based hardware module with 10 participant buzzers and a modern React web interface. Designed for live quiz bowl events, academic competitions, and interactive game shows.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Hardware — Firmware](#-hardware--firmware)
  - [Components](#components)
  - [ESP32 GPIO Pinout](#esp32-gpio-pinout)
  - [Circuit Notes](#circuit-notes)
  - [Firmware Features](#firmware-features)
  - [REST API Endpoints](#rest-api-endpoints)
  - [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Frontend — Web Application](#-frontend--web-application)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Pages & Screens](#pages--screens)
  - [Key Frontend Features](#key-frontend-features)
  - [Context & State Management](#context--state-management)
  - [Utility Modules](#utility-modules)
- [Getting Started](#-getting-started)
  - [Firmware Setup](#firmware-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage Workflow](#-usage-workflow)
- [Configuration Import / Export](#-configuration-import--export)
- [Repository Structure](#-repository-structure)
- [License](#-license)

---

## 🧩 Overview

The **Quiz Bowl Buzzer System** is a competition-grade buzzer platform built for events supporting **up to 10 participants (teams)**. The system is split into two main modules:

| Module | Description |
|--------|-------------|
| **Main Module Firmware** | ESP32-based hardware controller managing 10 push-button buzzers, 10 indicator LEDs, and a piezo buzzer. Hosts a WiFi web server with REST API and SSE for real-time communication. |
| **FrontEnd (Web App)** | React 19 + TypeScript single-page application served via Vite. Provides the quiz master's control panel, live game display, countdown timer, leaderboard, podium results, and full branding configuration. |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUIZ MASTER (Laptop/PC)                  │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │              React Web App (Vite Dev Server)          │     │
│   │                                                       │     │
│   │   Login ──► Dashboard ──► Configuration Page          │     │
│   │                              │                        │     │
│   │                              ▼                        │     │
│   │                         Main Quiz Page                │     │
│   │                    (Timer, Leaderboard, Podium)        │     │
│   └──────────────────┬────────────────────────────────────┘     │
│                      │  HTTP REST + SSE (EventSource)           │
│                      ▼                                          │
│   ┌───────────────────────────────────────────────────────┐     │
│   │           ESP32 Web Server (Port 80)                  │     │
│   │       WiFi Station Mode ─── mDNS: esp32.local         │     │
│   └──────────────────┬────────────────────────────────────┘     │
└──────────────────────┼──────────────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │    ESP32 NodeMCU    │
            │    (Main Module)    │
            ├─────────────────────┤
            │ 10x Push Buttons    │──── GPIO Interrupts (FALLING)
            │ 10x Indicator LEDs  │──── Digital Output
            │  1x Piezo Buzzer    │──── PWM (LEDC Channel 0)
            └─────────────────────┘
```

---

## ✨ Features

### Hardware
- ⚡ **10-Participant Support** — simultaneous buzzer input via hardware interrupts
- 🔔 **PWM Buzzer** — multi-phase audio effects on buzzer press (2 kHz tone)
- 💡 **Per-Participant LED Indicators** — ranked blink patterns (1st/2nd/3rd place effects)
- 🌐 **WiFi Web Server** — built-in HTTP REST API on the ESP32
- 📡 **Server-Sent Events (SSE)** — real-time push of buzzer presses to the frontend
- 🔒 **Hardware Debouncing** — 50 ms ISR-level debounce with verification reads
- 🔄 **Auto WiFi Reconnect** — persistent connection with automatic recovery
- 📟 **mDNS Discovery** — accessible at `http://esp32.local`

### Software
- 🎨 **Neon-Gold Dark Theme** — premium UI with Orbitron & Rajdhani fonts, glassmorphism
- ⏱️ **Live Countdown Timer** — configurable duration with animated progress bar
- 🏆 **Podium Results View** — top-3 display with Gold/Silver/Bronze styling
- ⌨️ **Keyboard Scoring** — `Enter` = correct (+10/+7/+5), `→` = wrong (-5), `←` = navigate
- 🔊 **Browser Sound Effects** — Web Audio API synth tones or custom audio file uploads
- 🖼️ **Full Branding Customization** — custom logos, titles, subtitles, and background GIFs
- 👥 **Team Management** — add up to 10 teams with logos, names, and inline editing
- 💾 **Config Persistence** — localStorage auto-save with quota-safe fallback
- 📤 **Import/Export Settings** — full configuration backup as `.quizcfg.json` files
- 🔐 **Session Authentication** — protected routes with login flow
- 📱 **Responsive Design** — adaptive layouts for large screens and tablets

---

## 🔧 Hardware — Firmware

### Components

| Component | Specification | Qty |
|-----------|---------------|-----|
| ESP32 NodeMCU-32S | Dual-core 240 MHz, WiFi + BT | 1 |
| Push Button (Momentary) | Normally Open, wired to GND | 10 |
| LED (5mm / SMD) | Any color, with 220Ω–330Ω resistor | 10 |
| Piezo Buzzer | Active or passive (PWM driven) | 1 |
| 10KΩ Resistor | External pull-up for input-only GPIOs | 4 |
| 220Ω–330Ω Resistor | Current limiting for LEDs | 10 |

### ESP32 GPIO Pinout

#### 🔘 Buzzer Switch Inputs

| Participant | GPIO | Pull-Up | Notes |
|-------------|------|---------|-------|
| 1 | GPIO 34 | ⚠️ **External 10KΩ** | Input-only pin, no internal pull-up |
| 2 | GPIO 35 | ⚠️ **External 10KΩ** | Input-only pin, no internal pull-up |
| 3 | GPIO 36 (SVP) | ⚠️ **External 10KΩ** | Input-only pin, no internal pull-up |
| 4 | GPIO 39 (SVN) | ⚠️ **External 10KΩ** | Input-only pin, no internal pull-up |
| 5 | GPIO 32 | Internal `INPUT_PULLUP` | — |
| 6 | GPIO 33 | Internal `INPUT_PULLUP` | — |
| 7 | GPIO 25 | Internal `INPUT_PULLUP` | — |
| 8 | GPIO 26 | Internal `INPUT_PULLUP` | — |
| 9 | GPIO 27 | Internal `INPUT_PULLUP` | — |
| 10 | GPIO 14 | Internal `INPUT_PULLUP` | — |

> **Wiring:** Each switch connects between the GPIO pin and **GND**. The interrupt triggers on the **FALLING** edge (HIGH → LOW).

#### 💡 LED Outputs

| Participant | GPIO | Notes |
|-------------|------|-------|
| 1 | GPIO 12 | — |
| 2 | GPIO 13 | — |
| 3 | GPIO 15 | Pulled-up at boot (brief HIGH pulse is normal) |
| 4 | GPIO 2 | Built-in LED on some boards |
| 5 | GPIO 4 | — |
| 6 | GPIO 16 | — |
| 7 | GPIO 17 | — |
| 8 | GPIO 5 | Pulled-up at boot (brief HIGH pulse is normal) |
| 9 | GPIO 18 | — |
| 10 | GPIO 19 | — |

#### 🔔 Buzzer Output

| Function | GPIO | Method |
|----------|------|--------|
| Piezo Buzzer | GPIO 23 | PWM via `ledcWriteTone()` (LEDC Channel 0, 5 kHz base, 8-bit resolution) |

#### 🛡️ Boot Protection

| GPIO | Purpose |
|------|---------|
| GPIO 0 | Set to `INPUT_PULLUP` to prevent accidental download-mode entry during boot |

### Circuit Notes

- **GPIO 34, 35, 36, 39** are input-only pins on the ESP32 — they have **no internal pull-up resistors**. You **must** add an external **10KΩ pull-up resistor** from each pin to **3.3V**.
- All other switch pins (GPIO 32, 33, 25, 26, 27, 14) use the ESP32's internal `INPUT_PULLUP`.
- LEDs should include a **220Ω–330Ω current-limiting resistor** in series.
- The buzzer is driven via **PWM** (LEDC peripheral) for variable-frequency tone generation.
- GPIO 0 must remain HIGH during boot to avoid entering flash download mode.

### Firmware Features

| Feature | Description |
|---------|-------------|
| **WiFi Station Mode** | Connects to a configured access point (`LabExpert_1.0` / `11111111`) |
| **mDNS** | Registers as `esp32.local` on the network |
| **HTTP Web Server** | Runs on port 80, serves REST API with CORS headers |
| **SSE (Server-Sent Events)** | Real-time buzzer press notifications (up to 4 concurrent clients) |
| **ISR Debouncing** | 50 ms interrupt debounce + digital read verification |
| **Press Order Tracking** | Records timestamp and order number for each participant |
| **LED Effects** | Ranked blink patterns — 1st: fast triple blink, 2nd: double blink, 3rd: slow blink, 4th+: solid ON |
| **Game Duration Timer** | Configurable via API (default 10 s), auto-sends results when expired |
| **Auto Reconnect** | WiFi disconnection handler with up to 10 reconnect attempts |

### REST API Endpoints

All endpoints support CORS (`Access-Control-Allow-Origin: *`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Returns `{ ok, ssid, ip }` |
| `GET` | `/api/status` | Returns `{ gameActive, remainingMs, pressOrder[] }` |
| `GET` | `/api/game/config` | Returns `{ durationMs }` |
| `POST` | `/api/game/config` | Set game duration: `{ durationMs: number }` |
| `POST` | `/api/game/start` | Start a new game round |
| `POST` | `/api/game/reset` | Reset the game state and clear all data |

### Server-Sent Events (SSE)

Connect to `GET /events` for real-time updates.

| Event | Payload | Trigger |
|-------|---------|---------|
| `buzzer` | `{ type, teamIndex, timestamp, orderNo, pressCount }` | When a participant presses their buzzer |
| `result` | `{ type, top3: [index, ...] }` | When the game timer expires |

---

## 🖥 Frontend — Web Application

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | ~5.8.2 | Type-safe development |
| **Vite** | ^6.2.0 | Dev server & build tool |
| **React Router DOM** | 6.22.3 | Client-side routing (MemoryRouter) |
| **TailwindCSS** | CDN (latest) | Utility-first styling |
| **Lucide React** | — | Icon library (Settings, Play, Square, etc.) |
| **Google Fonts** | Orbitron + Rajdhani | Display & body typography |

### Project Structure

```
FrontEndTS/
├── index.html              # Entry HTML with Tailwind config & custom theme
├── index.tsx               # React DOM root mount
├── App.tsx                 # Router & route definitions
├── types.ts                # TypeScript interfaces (User, Team, AppConfig)
├── vite.config.ts          # Vite configuration with React plugin
├── tsconfig.json           # TypeScript compiler options
├── package.json            # Dependencies and scripts
├── metadata.json           # Project metadata
│
├── pages/
│   ├── Login.tsx            # Authentication screen
│   ├── DashboardHome.tsx    # Welcome dashboard with action tiles
│   ├── MainQuizPage.tsx     # 🎯 Core quiz game interface
│   ├── ConfigurationPage.tsx# ⚙️ Full system configuration panel
│   ├── MainPresentation.tsx # Presentation mode view
│   ├── Config.tsx           # Legacy config page
│   ├── About.tsx            # About page
│   └── History.tsx          # History page
│
├── components/
│   ├── DashboardLayout.tsx  # Dashboard shell with nav header
│   └── NeonInput.tsx        # Reusable neon-styled input components
│
├── context/
│   ├── AuthContext.tsx       # Authentication state provider
│   └── ConfigContext.tsx     # App config state + localStorage persistence
│
└── utils/
    ├── espApi.ts            # ESP32 API client (REST + SSE)
    └── imageUtils.ts        # Image compression & Base64 conversion
```

### Pages & Screens

#### 🔐 Login Page (`Login.tsx`)
- Premium dark glassmorphism card with gold accent styling
- Username/password form with any non-empty input accepted (demo mode)
- Animated background blurs and gradients
- Redirects to the Dashboard upon successful login

#### 🏠 Dashboard Home (`DashboardHome.tsx`)
- Welcome banner with gradient background and status badge
- Two large action tiles:
  - **Configuration** — navigate to the system configuration panel
  - **Let's Start** — launch the main quiz presentation page
- Hover effects with animated underlines and icon transitions

#### 🎯 Main Quiz Page (`MainQuizPage.tsx`)
The core game interface with **four distinct states**:

| State | Screen | Description |
|-------|--------|-------------|
| **IDLE** | "READY?" splash | Full-screen neon animated start button with settings access |
| **READY** | Question display | Shows "Question N" with optional background GIF, team grid on the right |
| **RUNNING** | Live countdown | Large timer (MM:SS format), animated progress bar, live leaderboard with press-order ranking |
| **FINISHED** | Podium view | Top 3 winners with Gold/Silver/Bronze cards, keyboard-driven scoring with animated feedback |

**Keyboard Controls (FINISHED state):**
| Key | Action |
|-----|--------|
| `Enter` | Award points: 1st = +10, 2nd = +7, 3rd = +5 |
| `→` (Right Arrow) | Deduct -5 points (wrong/pass), advance focus to next rank |
| `←` (Left Arrow) | Move focus to previous rank |

**Audio System:**
- Web Audio API oscillator for synth tones (configurable frequency & duration)
- Optional custom audio file playback (mp3/wav, max 250KB)
- Separate feedback tones for correct (ascending chime) and wrong (descending tone)

#### ⚙️ Configuration Page (`ConfigurationPage.tsx`)
A comprehensive settings panel with four sections:

| Section | Features |
|---------|----------|
| **Visual & Branding** | Header title/subtitle, left/right logos (auto-compressed), background GIF, question number, timer duration |
| **Team Management** | Add/edit/remove up to 10 teams with name and logo, inline editing with save/cancel |
| **Quiz Buzzer Sound** | Enable/disable browser sound, synth tone frequency (100–4000 Hz) & duration (50–2000 ms), custom audio upload with preview |
| **ESP32 Connection** | Module URL input (`http://esp32.local`), connection test button, auto-config push |

**Top Toolbar:**
- Module URL field with health-check "Test" button
- Export settings as `.quizcfg.json`
- Import settings from file
- Reset all settings
- "Go To Quiz" button (validates ESP32 connection, pushes config, navigates to quiz)

### Key Frontend Features

#### Real-Time Communication
The `espApi.ts` module handles all ESP32 communication:
- **REST calls** — `postConfig()`, `startGame()`, `resetGame()`, `getStatus()`, `getHealth()`
- **SSE streaming** — `connectEvents()` subscribes to buzzer press and result events via `EventSource`
- **Auto-reconnect** — on SSE error, falls back to polling and re-subscribes after 3 seconds
- **Configurable base URL** — saved in `localStorage`, defaults to `http://esp32.local`

#### State Persistence
The `ConfigContext` persists all settings to `localStorage` with a quota-safe fallback mechanism:
- If storage exceeds quota, large images and audio data are stripped before retrying
- Config is versioned under key `quiz_app_config_v1`

#### Image Processing
The `imageUtils.ts` module provides:
- `fileToBase64()` — converts files to data URLs
- `compressImage()` — client-side image compression via Canvas API (configurable max dimensions and JPEG quality)

### Context & State Management

| Context | Provider | Purpose |
|---------|----------|---------|
| `AuthContext` | `AuthProvider` | Manages user authentication state (`login`, `logout`, `isAuthenticated`) |
| `ConfigContext` | `ConfigProvider` | Manages app configuration, team CRUD operations, localStorage persistence |

### Utility Modules

| Module | Exports | Purpose |
|--------|---------|---------|
| `espApi.ts` | `postConfig`, `startGame`, `resetGame`, `getStatus`, `getHealth`, `connectEvents`, `setEspBaseUrl`, `getEspBaseUrl` | ESP32 REST API client and SSE event subscriber |
| `imageUtils.ts` | `fileToBase64`, `compressImage` | File-to-Base64 conversion and client-side image compression |

---

## 🚀 Getting Started

### Firmware Setup

**Prerequisites:**
- [PlatformIO IDE](https://platformio.org/) (VS Code extension recommended)
- ESP32 NodeMCU-32S board
- USB cable for programming

**Steps:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shavihara/Quiz-Bowl-Buzzer-System.git
   cd Quiz-Bowl-Buzzer-System/Main_Module_Firmware
   ```

2. **Configure WiFi credentials** in `src/main.cpp`:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* pass = "YOUR_WIFI_PASSWORD";
   ```

3. **Build and upload:**
   ```bash
   pio run --target upload
   ```

4. **Monitor serial output** (115200 baud):
   ```bash
   pio device monitor --baud 115200
   ```

5. The ESP32 will print its IP address and pin mapping on boot.

### Frontend Setup

**Prerequisites:**
- [Node.js](https://nodejs.org/) v18+ and npm

**Steps:**

1. **Navigate to the frontend directory:**
   ```bash
   cd Quiz-Bowl-Buzzer-System/FrontEndTS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:** Navigate to `http://localhost:5173`

5. **Build for production** (optional):
   ```bash
   npm run build
   ```

---

## 📖 Usage Workflow

```
1. POWER ON          Flash firmware → ESP32 connects to WiFi → prints IP
                          │
2. LAUNCH APP        npm run dev → open http://localhost:5173
                          │
3. LOGIN             Enter any username/password → access granted
                          │
4. CONFIGURE         Go to Configuration Page:
                     • Set ESP32 URL (e.g., http://192.168.1.100)
                     • Click "Test" to verify connection
                     • Add team names and logos (up to 10)
                     • Set timer duration and branding
                     • Click "Go To Quiz"
                          │
5. RUN QUIZ          Main Quiz Page:
                     • Click "Start Quiz" → countdown begins
                     • Participants press their buzzer buttons
                     • Live leaderboard updates in real-time
                     • Timer expires → Podium view shows top 3
                          │
6. SCORE             Use keyboard:
                     • Enter = award points │ → = wrong/pass │ ← = go back
                          │
7. NEXT ROUND        Click "Next Round" → increments question number → repeat
```

---

## 📦 Configuration Import / Export

The system supports full configuration backup and restore:

**Export:** Click the **Export** button on the Configuration Page to download a `.quizcfg.json` file containing:
- All branding settings (titles, logos as Base64)
- Timer and sound configuration
- Team names and logos
- ESP32 URL

**Import:** Click **Import** and select a previously exported `.quizcfg.json` file to restore all settings instantly.

---

## 📂 Repository Structure

```
Quiz-Bowl-Buzzer-System/
│
├── README.md                          # This file
├── .gitignore                         # Git ignore rules
├── adobe-express-qr-code.png          # QR code asset
│
├── Main_Module_Firmware/              # ESP32 PlatformIO project
│   ├── platformio.ini                 # Board: nodemcu-32s, libs: ArduinoJson, WebSockets
│   ├── src/
│   │   └── main.cpp                   # Main firmware (WiFi, WebServer, SSE, buzzer logic)
│   ├── include/                       # Header files
│   ├── lib/                           # Project-specific libraries
│   └── test/                          # Unit tests
│
├── FrontEndTS/                        # React + TypeScript web application
│   ├── package.json                   # npm project config
│   ├── vite.config.ts                 # Vite build config
│   ├── tsconfig.json                  # TypeScript config
│   ├── index.html                     # Entry HTML with Tailwind + theme
│   ├── index.tsx                      # React root mount
│   ├── App.tsx                        # Router + protected routes
│   ├── types.ts                       # Shared TypeScript interfaces
│   ├── pages/                         # Page components
│   ├── components/                    # Reusable UI components
│   ├── context/                       # React context providers
│   └── utils/                         # API client + image utilities
│
└── Datasheets/                        # Reference documents and assets
    ├── STAT BEE/                      # Project reference materials
    └── frontEnd/                      # Frontend design references
```

---

## 📋 Library Dependencies

### Firmware (PlatformIO)
| Library | Version | Purpose |
|---------|---------|---------|
| `ArduinoJson` | ^6.21.3 | JSON serialization/deserialization |
| `WebSockets` | ^2.4.1 | WebSocket support |

### Frontend (npm)
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI framework |
| `react-dom` | ^19.2.0 | DOM rendering |
| `react-router-dom` | 6.22.3 | Routing |
| `vite` | ^6.2.0 | Build tool |
| `@vitejs/plugin-react` | ^5.0.0 | React support for Vite |
| `typescript` | ~5.8.2 | Type checking |

---

## 📄 License

This project is developed for educational and competition purposes.

---

<p align="center">
  Built with ⚡ by <strong>LabExpert Team</strong>
</p>
