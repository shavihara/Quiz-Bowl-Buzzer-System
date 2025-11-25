## Overview
- Implement a clean ESP32 firmware exposing HTTP APIs and a robust SSE event stream to integrate with your FrontEndTS.
- Keep buzzer/LED/push button pin mappings and debounce; remove unneeded demo logic.
- Add reliable WiFi auto‑connect and reconnect handling.
- Frontend sends configuration (timeout minutes), start/reset commands, and consumes SSE to update the leaderboard.

## ESP32 Firmware Changes
- **Keep**: `switchPins[10]`, `ledPins[10]`, `buzzerPin`, PWM setup, interrupts, debounce, LED control.
- **Trim**: long celebratory patterns and excess serial logging; keep short feedback when the first press occurs.

### WiFi Auto‑Connect & Recovery
- Configure station mode and auto‑reconnect:
  - `WiFi.mode(WIFI_STA)`
  - `WiFi.setAutoReconnect(true)` and `WiFi.persistent(true)`
  - Register `WiFi.onEvent(...)` to detect disconnects and call `WiFi.reconnect()` with a capped retry loop.
- On successful connect, start MDNS (`esp32.local`) and `server.begin()`.
- Optionally expose `GET /api/health` to report current SSID and IP for the frontend.

### HTTP API (port 80)
- `GET /api/health` → `{ ok, ssid, ip }`
- `GET /api/status` → `{ gameActive, remainingMs, pressOrder: [int] }`
- `POST /api/game/config` → `{ durationMs }` (store only)
- `POST /api/game/start` → `{}` (start using stored `gameDuration`; clear state)
- `POST /api/game/reset` → `{}` (stop, clear state, turn off LEDs/buzzer)
- `GET /events` (SSE) → persistent stream for real‑time buzzer and result events
- **CORS**: continue sending `Access-Control-Allow-*` and handle `OPTIONS` for all routes.

### SSE Implementation
- Maintain a small array of active clients from `/events` (no `server.client().stop()`).
- `sendSSEEvent(type, json)` writes `event:` + `data:` frames to each client and flushes; remove dead sockets if write fails.
- Emit:
  - `buzzer` → `{ teamIndex, orderNo, timestamp }` on each first valid press
  - `result` → `{ top3: [indices] }` when duration ends

### Game Loop & IDs
- Record presses only once per team; assign sequential `orderNo` (starting from 1).
- Hardware index `i` is 0..9; frontend team IDs are 1..N. Map via `teamId = i + 1` in the UI.
- When timeout reached, disable further presses (`gameActive=false`) and emit `result`.

## Frontend Changes (FrontEndTS)
- **ESP API module (utils/espApi.ts)**:
  - `postConfig(durationMs)` → POST `/api/game/config`
  - `startGame()` → POST `/api/game/start`
  - `resetGame()` → POST `/api/game/reset`
  - `getStatus()` → GET `/api/status`
  - Base URL configurable (store in config or env); optionally discover via `esp32.local`.
- **ConfigurationPage**:
  - On “Go To Quiz”: convert minutes→ms and call `postConfig(durationMs)`; then navigate.
- **MainQuizPage**:
  - On “Start Quiz”: call `startGame()` and enter RUNNING.
  - On “Reset”: call `resetGame()` and set question number to 1.
  - **SSE subscribe**: `EventSource(http://<esp-ip>/events)`; handle:
    - `buzzer` → update leaderboard order `{ teamId: i+1, place: orderNo }`
    - `result` → lock leaderboard top3 and transition to FINISHED
  - Fallback: poll `getStatus()` if SSE disconnects; auto‑retry EventSource.

## Data Model & Protocol
- `buzzer` event: `{"teamIndex": 2, "orderNo": 1, "timestamp": 1732600000}`
- `result` event: `{"top3": [2, 7, 4]}` (0‑based indices)
- `status`: `{"gameActive": true, "remainingMs": 4850, "pressOrder": [2,7,4]}`

## Testing Plan
1. Power ESP32; confirm auto‑connect to WiFi and MDNS.
2. Hit `/api/health`; verify SSID/IP.
3. Set timeout minutes; click “Go To Quiz”; confirm `/api/game/config` applied (serial log or `/api/status`).
4. Click “Start Quiz”; press hardware buttons; see live `buzzer` events update UI.
5. Wait for timeout; verify `result` event and UI transition.
6. Click “Reset”; ensure ESP and UI clear state and question number resets to 1.

## Cleanup of Previous Testing Code
- Remove/disable: extended buzzer/LED animations and duplicated first‑press logic blocks; keep minimal blink + short tone feedback.
- Ensure loop remains efficient and deterministic.

## Requirement Mapping
- WiFi auto‑connect logic retained and improved via `setAutoReconnect` + event‑based recovery.
- (1) Go To Quiz sends timeout minutes (converted to ms) → `/api/game/config`.
- (2) Start Quiz sends start command → `/api/game/start`; ESP enforces duration and disables responses automatically.
- (3) Team IDs from 1..N map to buzzer indices 0..9 via `teamId=i+1`.
- (4) ESP32 sends `[ID, Place]` via `buzzer` events; frontend updates leaderboard accordingly.

Approve this plan to proceed with implementation on both ESP32 and FrontEndTS.