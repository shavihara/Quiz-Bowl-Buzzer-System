#include <Arduino.h>

// Pin definitions
const int SWITCH_1_PIN = 18;
const int SWITCH_2_PIN = 19;
const int LED_1_PIN = 32;
const int LED_2_PIN = 33;
const int BUZZER_PIN = 23;

// State variables
volatile bool switch1Pressed = false;
volatile bool switch2Pressed = false;
volatile bool firstPressDetected = false;
volatile bool ignoreInputs = false;
volatile unsigned long buzzerStartTime = 0;
volatile int firstPress = 0; // 0 = none, 1 = switch1, 2 = switch2

// Debouncing variables
volatile unsigned long lastInterruptTime1 = 0;
volatile unsigned long lastInterruptTime2 = 0;
const unsigned long DEBOUNCE_DELAY = 50;

void IRAM_ATTR handleSwitch1() {
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime1 > DEBOUNCE_DELAY) {
    if (!ignoreInputs && !firstPressDetected) {
      switch1Pressed = true;
    }
    lastInterruptTime1 = interruptTime;
  }
}

void IRAM_ATTR handleSwitch2() {
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime2 > DEBOUNCE_DELAY) {
    if (!ignoreInputs && !firstPressDetected) {
      switch2Pressed = true;
    }
    lastInterruptTime2 = interruptTime;
  }
}

void setup() {
  // Initialize pins
  pinMode(SWITCH_1_PIN, INPUT_PULLUP);
  pinMode(SWITCH_2_PIN, INPUT_PULLUP);
  pinMode(LED_1_PIN, OUTPUT);
  pinMode(LED_2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize outputs - LOW means transistors are OFF
  digitalWrite(LED_1_PIN, LOW);
  digitalWrite(LED_2_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Attach interrupts for switches (FALLING because of pull-up)
  attachInterrupt(digitalPinToInterrupt(SWITCH_1_PIN), handleSwitch1, FALLING);
  attachInterrupt(digitalPinToInterrupt(SWITCH_2_PIN), handleSwitch2, FALLING);
  
  Serial.begin(115200);
  Serial.println("ESP32 Switch Detection System Ready");
  Serial.println("Using BC547 transistors for LEDs and buzzer");
}

void loop() {
  // Check if we need to process a first press
  if (!firstPressDetected && (switch1Pressed || switch2Pressed)) {
    firstPressDetected = true;
    ignoreInputs = true;
    
    // Determine which switch was pressed first
    if (switch1Pressed && !switch2Pressed) {
      firstPress = 1;
      digitalWrite(LED_1_PIN, HIGH); // Turn on transistor for LED 1
      Serial.println("Switch 1 pressed first - LED 1 ON");
    } 
    else if (switch2Pressed && !switch1Pressed) {
      firstPress = 2;
      digitalWrite(LED_2_PIN, HIGH); // Turn on transistor for LED 2
      Serial.println("Switch 2 pressed first - LED 2 ON");
    }
    else {
      // Both pressed at almost same time - you can decide how to handle
      firstPress = 1; // Default to switch 1
      digitalWrite(LED_1_PIN, HIGH);
      Serial.println("Both switches pressed - Defaulting to Switch 1");
    }
    
    // Turn on buzzer transistor
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerStartTime = millis();
    Serial.println("Buzzer ON for 5 seconds");
    
    // Reset switch flags
    switch1Pressed = false;
    switch2Pressed = false;
  }
  
  // Check if 5 seconds have passed since buzzer started
  if (firstPressDetected && (millis() - buzzerStartTime >= 5000)) {
    // Turn off buzzer and LEDs (set pins LOW to turn off transistors)
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_1_PIN, LOW);
    digitalWrite(LED_2_PIN, LOW);
    
    // Reset state
    firstPressDetected = false;
    ignoreInputs = false;
    firstPress = 0;
    
    Serial.println("System reset - Ready for next input");
    Serial.println("Waiting for switch press...");
  }
  
  // Small delay to prevent overwhelming the processor
  delay(10);
}