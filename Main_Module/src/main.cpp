#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <ESPmDNS.h>


// Pin definitions for 10 participants - CORRECTED according to your pinout plan
const int switchPins[10] = {34, 35, 36, 39, 32, 33, 25, 26, 27, 14}; // GPIO numbers
const int ledPins[10] = {12, 13, 15, 2, 4, 16, 17, 5, 18, 19};      // GPIO numbers
const int buzzerPin = 23; // GPIO 23

// Participant labels for serial output
const char* participantNames[10] = {
  "Participant 1", "Participant 2", "Participant 3", "Participant 4", "Participant 5",
  "Participant 6", "Participant 7", "Participant 8", "Participant 9", "Participant 10"
};

// PWM properties
const int PWM_FREQ = 5000;
const int PWM_CHANNEL = 0;
const int PWM_RESOLUTION = 8;

WebServer server(80);
const char* ssid = "LabExpert_1.0";
const char* pass = "11111111";

// API handler function declarations
void handleHealth();
void handleStatus();
void handleGameStart();
void handleGameReset();
void handleOptions();
void handleEvents();
void sendCors();
void sendSSEEvent(const char* event, const char* data);

volatile bool gameActive = false;
volatile unsigned long gameStartTime = 0;
volatile unsigned long gameDuration = 10000;
volatile int pressOrder[10] = {-1,-1,-1,-1,-1,-1,-1,-1,-1,-1};
volatile int pressCount = 0;
volatile bool recorded[10] = {false,false,false,false,false,false,false,false,false,false};

// State variables for 10 participants
volatile bool switchPressed[10] = {false, false, false, false, false, false, false, false, false, false};
volatile bool firstPressDetected = false;
volatile bool ignoreInputs = false;
volatile unsigned long buzzerStartTime = 0;
volatile int firstPress = -1; // -1 means no press yet

// Debouncing variables for all 10 switches
volatile unsigned long lastInterruptTime[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
const unsigned long DEBOUNCE_DELAY = 50;

// Pattern variables
bool ledBlinkState = false;
unsigned long lastLedBlinkTime = 0;
const unsigned long LED_BLINK_INTERVAL = 80; // Faster blink for excitement

// Buzzer pattern variables
int buzzerPatternStep = 0;
unsigned long lastBuzzerStepTime = 0;

// SSE and timestamp tracking
volatile unsigned long pressTimestamps[10] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
volatile int pressOrderNo[10] = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1};
volatile int currentOrderNo = 0;
const unsigned long BUZZER_STEP_INTERVAL = 150; // Faster pattern steps

// Generic interrupt handler for any switch
void IRAM_ATTR handleSwitchInterrupt(int switchIndex)
{
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime[switchIndex] > DEBOUNCE_DELAY)
  {
    if (digitalRead(switchPins[switchIndex]) == LOW)
    {
      switchPressed[switchIndex] = true;
    }
    lastInterruptTime[switchIndex] = interruptTime;
  }
}

// Interrupt handler functions for all 10 switches
void IRAM_ATTR handleSwitch0() { handleSwitchInterrupt(0); }
void IRAM_ATTR handleSwitch1() { handleSwitchInterrupt(1); }
void IRAM_ATTR handleSwitch2() { handleSwitchInterrupt(2); }
void IRAM_ATTR handleSwitch3() { handleSwitchInterrupt(3); }
void IRAM_ATTR handleSwitch4() { handleSwitchInterrupt(4); }
void IRAM_ATTR handleSwitch5() { handleSwitchInterrupt(5); }
void IRAM_ATTR handleSwitch6() { handleSwitchInterrupt(6); }
void IRAM_ATTR handleSwitch7() { handleSwitchInterrupt(7); }
void IRAM_ATTR handleSwitch8() { handleSwitchInterrupt(8); }
void IRAM_ATTR handleSwitch9() { handleSwitchInterrupt(9); }
void setup()
{
  // === BOOT PROTECTION - CRITICAL FOR ESP32 ===
  // Minimal protection to avoid upload interference
  // Only protect GPIO0 which is critical for boot mode
  pinMode(0, INPUT_PULLUP);    // GPIO0 - prevent download mode (MOST IMPORTANT)
  
  // Very short delay for boot stabilization
  delay(10);
  // === END BOOT PROTECTION ===

  Serial.begin(115200);
  delay(100);  // Allow Serial to stabilize
  Serial.println("Starting Quiz Competition System with 10 Participants...");

  // Initialize all LED pins to OUTPUT and set LOW
  for (int i = 0; i < 10; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // Initialize all switch pins with correct pull-up configuration
  // Note: GPIO 34, 35, 36, 39 don't have internal pull-ups, need external 10KΩ resistors
  for (int i = 0; i < 10; i++) {
    if (i < 4) { // GPIO 34, 35, 36, 39 - external pull-up required
      pinMode(switchPins[i], INPUT);
    } else { // GPIO 32, 33, 25, 26, 27, 14 - internal pull-up available
      pinMode(switchPins[i], INPUT_PULLUP);
    }
  }

  // Initialize buzzer pin
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // Configure PWM for buzzer - FULL VOLUME
  ledcSetup(PWM_CHANNEL, 5000, 8); // 5kHz frequency
  ledcAttachPin(buzzerPin, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0); // Start silent

  delay(100);

  // Attach interrupts for all 10 switches
  attachInterrupt(digitalPinToInterrupt(switchPins[0]), handleSwitch0, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[1]), handleSwitch1, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[2]), handleSwitch2, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[3]), handleSwitch3, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[4]), handleSwitch4, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[5]), handleSwitch5, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[6]), handleSwitch6, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[7]), handleSwitch7, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[8]), handleSwitch8, FALLING);
  attachInterrupt(digitalPinToInterrupt(switchPins[9]), handleSwitch9, FALLING);

  Serial.println("🎯 10-Participant Quiz Competition System READY!");
  Serial.println("Press any buzzer to start...");
  Serial.println("Pin Mapping:");
  for (int i = 0; i < 10; i++) {
    Serial.printf("Participant %d: Switch=GPIO%d, LED=GPIO%d\n", 
                 i+1, switchPins[i], ledPins[i]);
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
  WiFi.begin(ssid, pass);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000){ delay(200); }
  MDNS.begin("esp32");

  server.on("/api/health", HTTP_GET, handleHealth);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/game/config", HTTP_POST, handleGameConfig);
  server.on("/api/game/start", HTTP_POST, handleGameStart);
  server.on("/api/game/reset", HTTP_POST, handleGameReset);
  server.on("/events", HTTP_GET, handleEvents);
  server.on("/api/health", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/game/config", HTTP_OPTIONS, handleOptions);
  server.on("/api/game/start", HTTP_OPTIONS, handleOptions);
  server.on("/api/game/reset", HTTP_OPTIONS, handleOptions);
  server.begin();
}

void playThrillingBuzzer()
{
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - buzzerStartTime;

  // High-pitched 2-second beep at 2000Hz
  if (elapsed < 2000) {
    // Play continuous 2000Hz tone for 2 seconds
    ledcWriteTone(PWM_CHANNEL, 2000);
    ledcWrite(PWM_CHANNEL, 255); // FULL VOLUME
  } else {
    // Stop the buzzer after 2 seconds
    ledcWrite(PWM_CHANNEL, 0);
  }
}

void updateExcitingLEDs()
{
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - buzzerStartTime;

  if (currentTime - lastLedBlinkTime >= LED_BLINK_INTERVAL)
  {
    lastLedBlinkTime = currentTime;

    // Different LED patterns based on time
    if (elapsed < 1500)
    {
      // Phase 1: Fast blinking
      ledBlinkState = !ledBlinkState;
    }
    else if (elapsed < 3000)
    {
      // Phase 2: Very fast blinking
      ledBlinkState = (millis() % 100) < 50;
    }
    else
    {
      // Phase 3: Breathing effect
      int breath = (millis() % 1000) - 500;
      ledBlinkState = (breath * breath) < 62500; // Quadratic breathing
    }

    // Turn off all LEDs first
    for (int i = 0; i < 10; i++) {
      digitalWrite(ledPins[i], LOW);
    }

    // Apply blinking effect to the winner's LED only
    if (firstPress >= 0 && firstPress < 10) {
      digitalWrite(ledPins[firstPress], ledBlinkState ? HIGH : LOW);
    }
  }
}

void sendCors(){
  server.sendHeader("Access-Control-Allow-Origin","*");
  server.sendHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers","Content-Type");
}

void handleOptions(){
  sendCors();
  server.send(204);
}

void handleHealth(){
  DynamicJsonDocument doc(256);
  doc["ok"] = true;
  doc["ssid"] = WiFi.SSID();
  doc["ip"] = WiFi.localIP().toString();
  String out; serializeJson(doc,out);
  sendCors(); server.send(200,"application/json",out);
}

void handleStatus(){
  DynamicJsonDocument doc(512);
  doc["gameActive"] = gameActive;
  long remaining = gameActive ? (long)(gameStartTime + gameDuration - millis()) : 0;
  if (remaining < 0) remaining = 0;
  doc["remainingMs"] = remaining;
  JsonArray arr = doc.createNestedArray("pressOrder");
  for (int i=0;i<pressCount;i++){ arr.add(pressOrder[i]); }
  String out; serializeJson(doc,out);
  sendCors(); server.send(200,"application/json",out);
}

// Store game duration without starting
void handleGameConfig(){
  String body = server.arg("plain");
  DynamicJsonDocument doc(256);
  deserializeJson(doc, body);
  unsigned long d = doc["durationMs"] | gameDuration;
  gameDuration = d;
  sendCors(); server.send(200,"application/json","{}");
}

void handleGameStart(){
  // Start game using current gameDuration
  for (int i=0;i<10;i++){ 
    pressOrder[i] = -1; 
    recorded[i] = false;
    pressTimestamps[i] = 0;
    pressOrderNo[i] = -1;
  }
  pressCount = 0;
  currentOrderNo = 0;
  firstPressDetected = false;
  firstPress = -1;
  gameActive = true;
  gameStartTime = millis();
  sendCors(); server.send(200,"application/json","{}");
}

void handleGameReset(){
  gameActive = false;
  for (int i=0;i<10;i++){ 
    pressOrder[i] = -1; 
    recorded[i] = false; 
    pressTimestamps[i] = 0;
    pressOrderNo[i] = -1;
    digitalWrite(ledPins[i], LOW);
  } 
  pressCount = 0;
  currentOrderNo = 0;
  ledcWrite(PWM_CHANNEL,0);
  sendCors(); server.send(200,"application/json","{}");
}

void loop()
{
  server.handleClient();
  if (gameActive) {
    unsigned long now = millis();
    for (int i = 0; i < 10; i++) {
      if (switchPressed[i]) {
        switchPressed[i] = false;
        bool isPress = (digitalRead(switchPins[i]) == LOW);
        if (isPress && !recorded[i]) {
          recorded[i] = true;
          pressTimestamps[i] = millis(); // Server-side timestamp
          pressOrderNo[i] = currentOrderNo++; // Assign order number
          if (pressCount < 10) pressOrder[pressCount++] = i;
          
          // Send SSE event with timestamp and order number
          DynamicJsonDocument eventData(256);
          eventData["type"] = "press";
          eventData["teamIndex"] = i;
          eventData["timestamp"] = pressTimestamps[i];
          eventData["orderNo"] = pressOrderNo[i];
          eventData["pressCount"] = pressCount;
          
          String eventStr;
          serializeJson(eventData, eventStr);
          sendSSEEvent("buzzer", eventStr.c_str());
          
          if (pressCount == 1) {
            firstPressDetected = true;
            firstPress = i;
            buzzerStartTime = now;
            buzzerPatternStep = 0;
            lastBuzzerStepTime = now;
            lastLedBlinkTime = now;
            ledBlinkState = true;
          }
        }
      }
    }
    if (firstPressDetected) {
      playThrillingBuzzer();
      updateExcitingLEDs();
      if (millis() - buzzerStartTime >= 5000) {
        ledcWrite(PWM_CHANNEL, 0);
        for (int i = 0; i < 10; i++) { digitalWrite(ledPins[i], LOW); }
        firstPressDetected = false;
        ledBlinkState = false;
      }
    }
    if (now - gameStartTime >= gameDuration) {
      DynamicJsonDocument d(256);
      d["type"] = "result";
      JsonArray top = d.createNestedArray("top3");
      for (int k=0;k<3;k++){ if (k<pressCount) top.add(pressOrder[k]); }
      String s; serializeJson(d,s);
      sendSSEEvent("result", s.c_str());
      gameActive = false;
    }
  }
  // Check for first switch press among all 10 participants
  if (!firstPressDetected) {
    for (int i = 0; i < 10; i++) {
      if (switchPressed[i]) {
        // Verify the switch is actually pressed (debounce verification)
        bool isActuallyPressed = (digitalRead(switchPins[i]) == LOW);
        
        if (isActuallyPressed) {
          firstPressDetected = true;
          ignoreInputs = true;
          firstPress = i;
          
          // Announce the winner
          Serial.printf("🎉 %s WINS! First to press! 🎉\n", participantNames[i]);
          Serial.println("🔊 Playing exciting victory sequence!");

          // Initialize patterns
          buzzerStartTime = millis();
          buzzerPatternStep = 0;
          lastBuzzerStepTime = buzzerStartTime;
          lastLedBlinkTime = buzzerStartTime;
          ledBlinkState = true;

          // Turn off all LEDs first, then turn on winner's LED
          for (int j = 0; j < 10; j++) {
            digitalWrite(ledPins[j], LOW);
          }
          digitalWrite(ledPins[i], HIGH);

          // Reset all switch pressed flags
          for (int j = 0; j < 10; j++) {
            switchPressed[j] = false;
          }
          break; // Exit the loop once we found the first press
        } else {
          // False trigger - reset this switch
          switchPressed[i] = false;
        }
      }
    }
  }

  // Play exciting patterns during the 5-second celebration
  if (firstPressDetected)
  {
    playThrillingBuzzer();
    updateExcitingLEDs();

    // Check if 5 seconds have passed
    if (millis() - buzzerStartTime >= 5000)
    {
      // Grand finale - one last beep
      ledcWriteTone(PWM_CHANNEL, 1000);
      ledcWrite(PWM_CHANNEL, 255);
      delay(200);

      // Turn off everything - all 10 LEDs and buzzer
      ledcWrite(PWM_CHANNEL, 0);
      for (int i = 0; i < 10; i++) {
        digitalWrite(ledPins[i], LOW);
      }

      // Reset state
      firstPressDetected = false;
      ignoreInputs = false;
      firstPress = 0;
      ledBlinkState = false;

      Serial.println("-----------------------------------");
      Serial.println("✅ System READY for next question!");
      Serial.println("-----------------------------------");
    }
  }

  delay(10);
}

// Simple SSE single-client support
WiFiClient sseClient;
bool sseConnected = false;

void handleEvents() {
  WiFiClient client = server.client();
  client.print(
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/event-stream\r\n"
    "Cache-Control: no-cache\r\n"
    "Connection: keep-alive\r\n"
    "Access-Control-Allow-Origin: *\r\n\r\n"
  );
  client.print(": connected\n\n");
  sseClient = client;
  sseConnected = true;
}

void sendSSEEvent(const char* event, const char* data) {
  if (sseConnected && sseClient.connected()) {
    sseClient.print("event: ");
    sseClient.print(event);
    sseClient.print("\ndata: ");
    sseClient.print(data);
    sseClient.print("\n\n");
  }
  Serial.printf("SSE Event: %s - %s\n", event, data);
}
