#include <Arduino.h>

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
const unsigned long BUZZER_STEP_INTERVAL = 150; // Faster pattern steps

// Generic interrupt handler for any switch
void IRAM_ATTR handleSwitchInterrupt(int switchIndex)
{
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime[switchIndex] > DEBOUNCE_DELAY)
  {
    if (!ignoreInputs && !firstPressDetected && digitalRead(switchPins[switchIndex]) == LOW)
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
}

void playThrillingBuzzer()
{
  unsigned long currentTime = millis();
  unsigned long elapsed = currentTime - buzzerStartTime;

  if (currentTime - lastBuzzerStepTime >= BUZZER_STEP_INTERVAL)
  {
    lastBuzzerStepTime = currentTime;

    // EXCITING QUIZ BUZZER PATTERN - Full volume (255)
    if (elapsed < 1000)
    {
      // Phase 1: Fast ascending siren (build excitement)
      int freq = 800 + (elapsed * 1200 / 1000); // 800Hz to 2000Hz
      ledcWriteTone(PWM_CHANNEL, freq);
      ledcWrite(PWM_CHANNEL, 255); // FULL VOLUME
    }
    else if (elapsed < 2000)
    {
      // Phase 2: Victory fanfare
      switch (buzzerPatternStep % 6)
      {
      case 0:
        ledcWriteTone(PWM_CHANNEL, 1500);
        break;
      case 1:
        ledcWriteTone(PWM_CHANNEL, 1800);
        break;
      case 2:
        ledcWriteTone(PWM_CHANNEL, 2000);
        break;
      case 3:
        ledcWriteTone(PWM_CHANNEL, 1800);
        break;
      case 4:
        ledcWriteTone(PWM_CHANNEL, 2000);
        break;
      case 5:
        ledcWriteTone(PWM_CHANNEL, 2200);
        break;
      }
      ledcWrite(PWM_CHANNEL, 255); // FULL VOLUME
    }
    else if (elapsed < 3500)
    {
      // Phase 3: Pulsing attention pattern
      int pulse = (buzzerPatternStep % 4) * 85; // 0, 85, 170, 255
      ledcWriteTone(PWM_CHANNEL, 1200);
      ledcWrite(PWM_CHANNEL, 255 - pulse); // Pulsing volume
    }
    else if (elapsed < 5000)
    {
      // Phase 4: Countdown to reset
      int timeLeft = 5000 - elapsed;
      if (timeLeft > 1000)
      {
        // Slow descending tone
        int freq = 1500 - ((timeLeft - 1000) * 1000 / 4000);
        ledcWriteTone(PWM_CHANNEL, freq);
        ledcWrite(PWM_CHANNEL, 255);
      }
      else
      {
        // Final beeps
        if ((timeLeft / 200) % 2 == 0)
        {
          ledcWriteTone(PWM_CHANNEL, 800);
          ledcWrite(PWM_CHANNEL, 255);
        }
        else
        {
          ledcWrite(PWM_CHANNEL, 0);
        }
      }
    }

    buzzerPatternStep++;
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

void loop()
{
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