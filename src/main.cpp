#include <Arduino.h>

// Pin definitions
const int SWITCH_1_PIN = 18;
const int SWITCH_2_PIN = 19;
const int LED_1_PIN = 32;
const int LED_2_PIN = 33;
const int BUZZER_PIN = 23;

// PWM properties
const int PWM_FREQ = 5000;
const int PWM_CHANNEL = 0;
const int PWM_RESOLUTION = 8;

// State variables
volatile bool switch1Pressed = false;
volatile bool switch2Pressed = false;
volatile bool firstPressDetected = false;
volatile bool ignoreInputs = false;
volatile unsigned long buzzerStartTime = 0;
volatile int firstPress = 0;

// Pattern variables
bool ledBlinkState = false;
unsigned long lastLedBlinkTime = 0;
const unsigned long LED_BLINK_INTERVAL = 80; // Faster blink for excitement

// Buzzer pattern variables
int buzzerPatternStep = 0;
unsigned long lastBuzzerStepTime = 0;
const unsigned long BUZZER_STEP_INTERVAL = 150; // Faster pattern steps

// Debouncing variables
volatile unsigned long lastInterruptTime1 = 0;
volatile unsigned long lastInterruptTime2 = 0;
const unsigned long DEBOUNCE_DELAY = 50;

void IRAM_ATTR handleSwitch1()
{
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime1 > DEBOUNCE_DELAY)
  {
    if (!ignoreInputs && !firstPressDetected && digitalRead(SWITCH_1_PIN) == LOW)
    {
      switch1Pressed = true;
    }
    lastInterruptTime1 = interruptTime;
  }
}

void IRAM_ATTR handleSwitch2()
{
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime2 > DEBOUNCE_DELAY)
  {
    if (!ignoreInputs && !firstPressDetected && digitalRead(SWITCH_2_PIN) == LOW)
    {
      switch2Pressed = true;
    }
    lastInterruptTime2 = interruptTime;
  }
}

void setup()
{
  Serial.begin(115200);
  Serial.println("Starting Quiz Competition System...");

  // Initialize pins to known state
  digitalWrite(LED_1_PIN, LOW);
  digitalWrite(LED_2_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Set pin modes
  pinMode(SWITCH_1_PIN, INPUT_PULLUP);
  pinMode(SWITCH_2_PIN, INPUT_PULLUP);
  pinMode(LED_1_PIN, OUTPUT);
  pinMode(LED_2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Double-check outputs are OFF
  digitalWrite(LED_1_PIN, LOW);
  digitalWrite(LED_2_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Configure PWM for buzzer - FULL VOLUME
  ledcSetup(PWM_CHANNEL, 5000, 8); // 5kHz frequency
  ledcAttachPin(BUZZER_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0); // Start silent

  delay(100);

  // Attach interrupts
  attachInterrupt(digitalPinToInterrupt(SWITCH_1_PIN), handleSwitch1, FALLING);
  attachInterrupt(digitalPinToInterrupt(SWITCH_2_PIN), handleSwitch2, FALLING);

  Serial.println("🎯 Quiz Competition System READY!");
  Serial.println("Press any switch to start...");
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

    // Apply to correct LED
    if (firstPress == 1)
    {
      digitalWrite(LED_1_PIN, ledBlinkState ? HIGH : LOW);
      digitalWrite(LED_2_PIN, LOW);
    }
    else if (firstPress == 2)
    {
      digitalWrite(LED_2_PIN, ledBlinkState ? HIGH : LOW);
      digitalWrite(LED_1_PIN, LOW);
    }
  }
}

void loop()
{
  // Check for first switch press
  if (!firstPressDetected && (switch1Pressed || switch2Pressed))
  {
    bool s1 = (digitalRead(SWITCH_1_PIN) == LOW);
    bool s2 = (digitalRead(SWITCH_2_PIN) == LOW);

    if ((switch1Pressed && s1) || (switch2Pressed && s2))
    {
      firstPressDetected = true;
      ignoreInputs = true;

      // Determine winner
      if (switch1Pressed && s1 && !(switch2Pressed && s2))
      {
        firstPress = 1;
        Serial.println("🎉 TEAM 1 WINS! First to press! 🎉");
      }
      else if (switch2Pressed && s2 && !(switch1Pressed && s1))
      {
        firstPress = 2;
        Serial.println("🎉 TEAM 2 WINS! First to press! 🎉");
      }
      else
      {
        firstPress = 1;
        Serial.println("⚡ Both pressed! TEAM 1 awarded! ⚡");
      }

      // Initialize patterns
      buzzerStartTime = millis();
      buzzerPatternStep = 0;
      lastBuzzerStepTime = buzzerStartTime;
      lastLedBlinkTime = buzzerStartTime;
      ledBlinkState = true;

      // Initial LED state
      if (firstPress == 1)
      {
        digitalWrite(LED_1_PIN, HIGH);
      }
      else
      {
        digitalWrite(LED_2_PIN, HIGH);
      }

      Serial.println("🔊 Playing exciting victory sequence!");

      switch1Pressed = false;
      switch2Pressed = false;
    }
    else
    {
      // False trigger
      switch1Pressed = false;
      switch2Pressed = false;
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

      // Turn off everything
      ledcWrite(PWM_CHANNEL, 0);
      digitalWrite(LED_1_PIN, LOW);
      digitalWrite(LED_2_PIN, LOW);

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