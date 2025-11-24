#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Pin definitions for 10 participants
const int switchPins[10] = {34, 35, 36, 39, 32, 33, 25, 26, 27, 14};
const int ledPins[10] = {12, 13, 15, 2, 4, 16, 17, 5, 18, 19};
const int buzzerPin = 23;

// PWM properties
const int PWM_FREQ = 5000;
const int PWM_CHANNEL = 0;
const int PWM_RESOLUTION = 8;

// Web server
WebServer server(80);

// Configuration structure - Stored in memory only
struct Config
{
  int timeDuration = 10;
  String teamNames[10] = {
      "Team 1", "Team 2", "Team 3", "Team 4", "Team 5",
      "Team 6", "Team 7", "Team 8", "Team 9", "Team 10"};
  String teamColors[10] = {
      "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF",
      "#00FFFF", "#FFA500", "#800080", "#008000", "#FFC0CB"};
  String pageBgColor = "#ffffff";
};

Config config;
bool configLoaded = false;

// Game state variables
volatile bool switchPressed[10] = {false};
volatile int pressOrder[10] = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1};
volatile int pressCount = 0;
volatile bool gameActive = false;
volatile bool gameStarted = false;
volatile unsigned long gameStartTime = 0;
volatile unsigned long gameDuration = 10000;

// Debouncing variables
volatile unsigned long lastInterruptTime[10] = {0};
const unsigned long DEBOUNCE_DELAY = 50;

// Authentication
const char *configUsername = "UOKSTAT";
const char *configPassword = "1234";
bool authenticated = false;

// HTML Pages with embedded CSS and JavaScript
const char *mainPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>Quiz Competition System</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      margin: 0;
      padding: 20px;
      background-color: %BGCOLOR%;
      transition: background-color 0.3s;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #eee;
    }
    .config-btn { 
      padding: 10px 20px; 
      background: #007bff; 
      color: white; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer;
      font-size: 14px;
    }
    .config-btn:hover { background: #0056b3; }
    
    .begin-btn { 
      padding: 20px 50px; 
      font-size: 24px; 
      background: #28a745; 
      color: white; 
      border: none; 
      border-radius: 15px; 
      cursor: pointer;
      margin: 30px 0;
      font-weight: bold;
      transition: all 0.3s;
    }
    .begin-btn:hover { 
      background: #218838; 
      transform: scale(1.05);
    }
    .begin-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
    }
    
    .next-btn { 
      padding: 15px 40px; 
      font-size: 18px; 
      background: #dc3545; 
      color: white; 
      border: none; 
      border-radius: 10px; 
      cursor: pointer;
      margin: 20px 0;
      font-weight: bold;
      transition: background 0.3s;
    }
    .next-btn:hover { background: #c82333; }
    
    .timer { 
      font-size: 32px; 
      font-weight: bold; 
      margin: 20px;
      color: #333;
      padding: 15px;
      border: 3px solid #007bff;
      border-radius: 10px;
      display: inline-block;
      min-width: 100px;
    }
    
    .status { 
      padding: 15px; 
      margin: 20px 0; 
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
    }
    
    .results { 
      margin: 30px auto; 
      max-width: 600px; 
      text-align: left;
    }
    
    .result-item { 
      padding: 15px; 
      margin: 8px 0; 
      border-radius: 8px; 
      color: white;
      font-weight: bold;
      font-size: 16px;
      display: flex;
      align-items: center;
      transition: transform 0.2s;
    }
    .result-item:hover {
      transform: translateX(10px);
    }
    
    .position-badge {
      background: rgba(255,255,255,0.3);
      padding: 5px 12px;
      border-radius: 20px;
      margin-right: 15px;
      font-size: 14px;
    }
    
    .team-info {
      flex-grow: 1;
    }
    
    .game-active { animation: pulse 1s infinite; }
    
    @keyframes pulse {
      0% { border-color: #007bff; }
      50% { border-color: #28a745; }
      100% { border-color: #007bff; }
    }
    
    .team-color-preview {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 10px;
      border: 2px solid white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; color:#333;">QUIZ COMPETITION SYSTEM</h1>
      <button class="config-btn" onclick="location.href='/config'">CONFIGURATION</button>
    </div>
    
    <div id="mainContent">
      <!-- Content will be dynamically updated -->
    </div>
  </div>

  <script>
    let updateInterval;
    
    function updateStatus() {
      fetch('/status')
        .then(response => response.json())
        .then(data => {
          document.getElementById('mainContent').innerHTML = data.html;
          
          // Update page background color
          document.body.style.backgroundColor = data.bgColor || '#ffffff';
          
          if(data.gameActive) {
            // Update more frequently during active game
            clearInterval(updateInterval);
            updateInterval = setInterval(updateStatus, 500);
          } else if(data.gameStarted && !data.gameActive) {
            // Update every 2 seconds when showing results
            clearInterval(updateInterval);
            updateInterval = setInterval(updateStatus, 2000);
          } else {
            // Update every 5 seconds when waiting
            clearInterval(updateInterval);
            updateInterval = setInterval(updateStatus, 5000);
          }
        })
        .catch(error => {
          console.error('Error updating status:', error);
          clearInterval(updateInterval);
          updateInterval = setInterval(updateStatus, 10000);
        });
    }
    
    function startGame() {
      const button = event.target;
      button.disabled = true;
      button.innerHTML = 'Starting...';
      
      fetch('/begin', { method: 'POST' })
        .then(response => {
          if(response.ok) {
            updateStatus();
          } else {
            button.disabled = false;
            button.innerHTML = 'LETS BEGIN!';
          }
        })
        .catch(error => {
          console.error('Error starting game:', error);
          button.disabled = false;
          button.innerHTML = 'LETS BEGIN!';
        });
    }
    
    function nextRound() {
      fetch('/next', { method: 'POST' })
        .then(() => updateStatus());
    }
    
    // Initial status check and set up periodic updates
    updateStatus();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        updateStatus();
      }
    });
  </script>
</body>
</html>
)rawliteral";

const char *configPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>System Configuration</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0;
      padding: 20px;
      background-color: %BGCOLOR%;
    }
    .container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    .form-group { 
      margin: 20px 0; 
    }
    label { 
      display: block; 
      margin: 8px 0; 
      font-weight: bold;
      color: #333;
    }
    input, select { 
      width: 100%; 
      padding: 12px; 
      margin: 5px 0; 
      border: 2px solid #ddd; 
      border-radius: 6px; 
      font-size: 16px;
      box-sizing: border-box;
    }
    input:focus {
      border-color: #007bff;
      outline: none;
    }
    .team-config { 
      background: #f8f9fa; 
      padding: 20px; 
      margin: 15px 0; 
      border-radius: 8px; 
      border-left: 5px solid #007bff;
    }
    .btn { 
      padding: 12px 25px; 
      margin: 10px; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer; 
      font-size: 16px;
      font-weight: bold;
      transition: all 0.3s;
    }
    .save-btn { 
      background: #28a745; 
      color: white; 
    }
    .save-btn:hover { background: #218838; }
    .logout-btn { 
      background: #dc3545; 
      color: white; 
    }
    .logout-btn:hover { background: #c82333; }
    .cancel-btn { 
      background: #6c757d; 
      color: white; 
    }
    .cancel-btn:hover { background: #5a6268; }
    .color-preview { 
      width: 40px; 
      height: 40px; 
      display: inline-block; 
      margin-left: 15px; 
      border: 2px solid #ccc;
      border-radius: 6px;
      vertical-align: middle;
    }
    .section-title {
      color: #007bff;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    .quick-actions {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }
    .quick-btn {
      padding: 8px 15px;
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    .quick-btn:hover {
      background: #138496;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; color:#333;">SYSTEM CONFIGURATION</h1>
      <button class="btn logout-btn" onclick="location.href='/logout'">LOGOUT</button>
    </div>
    
    <form id="configForm">
      <h2 class="section-title">General Settings</h2>
      
      <div class="form-group">
        <label>Time Duration (seconds):</label>
        <input type="number" name="timeDuration" value="%DURATION%" min="5" max="60" required>
      </div>
      
      <div class="form-group">
        <label>Page Background Color:</label>
        <input type="color" name="pageBgColor" value="%PAGEBG%" onchange="updateColorPreview(this)">
        <div class="color-preview" style="background:%PAGEBG%"></div>
      </div>
      
      <h2 class="section-title">Team Configuration</h2>
      
      <div class="quick-actions">
        <button type="button" class="quick-btn" onclick="setDefaultColors()">DEFAULT COLORS</button>
        <button type="button" class="quick-btn" onclick="resetTeamNames()">RESET NAMES</button>
      </div>
      
      %TEAMCONFIG%
      
      <div style="text-align: center; margin: 30px 0;">
        <button type="button" class="btn save-btn" onclick="saveConfig()">SAVE CONFIGURATION</button>
        <button type="button" class="btn cancel-btn" onclick="location.href='/'">CANCEL</button>
      </div>
    </form>
  </div>

  <script>
    function updateColorPreview(element) {
      const preview = element.parentNode.querySelector('.color-preview');
      if(preview) preview.style.backgroundColor = element.value;
    }
    
    function setDefaultColors() {
      const defaultColors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FFA500', '#800080', '#008000', '#FFC0CB'
      ];
      
      defaultColors.forEach((color, index) => {
        const colorInput = document.querySelector('input[name="teamColor' + index + '"]');
        if(colorInput) {
          colorInput.value = color;
          updateColorPreview(colorInput);
        }
      });
    }
    
    function resetTeamNames() {
      for(let i = 0; i < 10; i++) {
        const nameInput = document.querySelector('input[name="teamName' + i + '"]');
        if(nameInput) {
          nameInput.value = 'Team ' + (i + 1);
        }
      }
    }
    
    function saveConfig() {
      const formData = new FormData(document.getElementById('configForm'));
      
      // Show loading state
      const saveBtn = document.querySelector('.save-btn');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = 'SAVING...';
      saveBtn.disabled = true;
      
      fetch('/saveConfig', {
        method: 'POST',
        body: formData
      }).then(response => {
        if(response.ok) {
          saveBtn.innerHTML = 'SAVED!';
          setTimeout(() => {
            location.href = '/';
          }, 1000);
        } else {
          saveBtn.innerHTML = 'ERROR';
          alert('Error saving configuration');
          setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
          }, 2000);
        }
      }).catch(error => {
        console.error('Error:', error);
        saveBtn.innerHTML = 'ERROR';
        alert('Error saving configuration');
        setTimeout(() => {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }, 2000);
      });
    }
    
    // Initialize color previews
    document.querySelectorAll('input[type="color"]').forEach(updateColorPreview);
  </script>
</body>
</html>
)rawliteral";

// Interrupt handlers
void IRAM_ATTR handleSwitchInterrupt(int switchIndex)
{
  unsigned long interruptTime = millis();
  if (interruptTime - lastInterruptTime[switchIndex] > DEBOUNCE_DELAY)
  {
    if (gameActive && digitalRead(switchPins[switchIndex]) == LOW && !switchPressed[switchIndex])
    {
      switchPressed[switchIndex] = true;
      pressOrder[pressCount] = switchIndex;
      pressCount++;

      // Light up the LED for this team
      digitalWrite(ledPins[switchIndex], HIGH);

      Serial.printf("Team %d pressed - Position: %d\n", switchIndex + 1, pressCount);
    }
    lastInterruptTime[switchIndex] = interruptTime;
  }
}

// Individual interrupt handlers
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

void startGame()
{
  if (!gameActive && !gameStarted)
  {
    gameActive = true;
    gameStarted = true;
    gameStartTime = millis();
    pressCount = 0;
    gameDuration = config.timeDuration * 1000;

    // Reset all switches and LEDs
    for (int i = 0; i < 10; i++)
    {
      switchPressed[i] = false;
      pressOrder[i] = -1;
      digitalWrite(ledPins[i], LOW);
    }

    // Play start sound
    ledcWriteTone(PWM_CHANNEL, 1000);
    delay(200);
    ledcWriteTone(PWM_CHANNEL, 0);

    Serial.println("Game started! Collecting inputs for " + String(config.timeDuration) + " seconds");
  }
}

void endGame()
{
  if (gameActive)
  {
    gameActive = false;

    // Play end sound
    ledcWriteTone(PWM_CHANNEL, 800);
    delay(300);
    ledcWriteTone(PWM_CHANNEL, 0);

    Serial.println("Game ended! Total presses: " + String(pressCount));

    // Print results
    for (int i = 0; i < pressCount; i++)
    {
      int team = pressOrder[i];
      Serial.printf("Position %d: %s\n", i + 1, config.teamNames[team].c_str());
    }
  }
}

void resetGame()
{
  gameActive = false;
  gameStarted = false;
  pressCount = 0;

  for (int i = 0; i < 10; i++)
  {
    switchPressed[i] = false;
    pressOrder[i] = -1;
    digitalWrite(ledPins[i], LOW);
  }

  Serial.println("Game reset - ready for next round");
}

String getMainPageContent()
{
  String content;

  if (!gameStarted)
  {
    // Show begin button - using regular string concatenation to avoid single quote issues
    content = "<h2 style=\"color:#333; margin-bottom:30px;\">READY TO START QUIZ COMPETITION</h2>";
    content += "<div style=\"background:#f8f9fa; padding:20px; border-radius:10px; margin:20px 0;\">";
    content += "<h3 style=\"color:#555;\">CURRENT SETTINGS:</h3>";
    content += "<p><strong>Time Duration:</strong> " + String(config.timeDuration) + " seconds</p>";
    content += "<p><strong>Background Color:</strong> <span style=\"display:inline-block; width:20px; height:20px; background:" + config.pageBgColor + "; border:1px solid #ccc; vertical-align:middle; margin-left:10px;\"></span></p>";
    content += "</div>";
    content += "<button class=\"begin-btn\" onclick=\"startGame()\">LETS BEGIN!</button>";
    content += "<p style=\"color:#666; font-size:14px;\">System will collect buzzer presses for " + String(config.timeDuration) + " seconds</p>";
  }
  else if (gameActive)
  {
    // Show timer and active game
    unsigned long remaining = (gameDuration - (millis() - gameStartTime)) / 1000;
    content = "<div class='status' style='background:#17a2b8; color:white;'>";
    content += "GAME ACTIVE - Time Remaining: <span class='timer game-active'>" + String(remaining) + "s</span>";
    content += "</div>";
    content += "<h3 style='color:#333;'>COLLECTING RESPONSES...</h3>";

    // Show current presses
    if (pressCount > 0)
    {
      content += "<div class='results'>";
      content += "<h4 style='color:#555;'>CURRENT ORDER:</h4>";
      for (int i = 0; i < pressCount; i++)
      {
        int team = pressOrder[i];
        content += "<div class='result-item' style='background:" + config.teamColors[team] + ";'>";
        content += "<span class='position-badge'>#" + String(i + 1) + "</span>";
        content += "<div class='team-color-preview' style='background:" + config.teamColors[team] + ";'></div>";
        content += "<div class='team-info'>" + config.teamNames[team] + "</div>";
        content += "</div>";
      }
      content += "</div>";
    }
    else
    {
      content += "<p style='color:#666; font-size:18px; margin:30px 0;'>Waiting for first buzzer press...</p>";
    }
  }
  else
  {
    // Show results and next button
    content = "<div class='status' style='background:#28a745; color:white;'>";
    content += "GAME COMPLETED - " + String(pressCount) + " teams responded";
    content += "</div>";

    content += "<div class='results'>";
    content += "<h3 style='color:#333; text-align:center;'>FINAL RESULTS</h3>";

    if (pressCount > 0)
    {
      for (int i = 0; i < pressCount; i++)
      {
        int team = pressOrder[i];
        String medal = "";
        if (i == 0)
          medal = "1st ";
        else if (i == 1)
          medal = "2nd ";
        else if (i == 2)
          medal = "3rd ";

        content += "<div class='result-item' style='background:" + config.teamColors[team] + ";'>";
        content += "<span class='position-badge'>" + medal + "#" + String(i + 1) + "</span>";
        content += "<div class='team-color-preview' style='background:" + config.teamColors[team] + ";'></div>";
        content += "<div class='team-info'>" + config.teamNames[team] + "</div>";
        content += "</div>";
      }
    }
    else
    {
      content += "<p style='color:#666; text-align:center; font-size:18px; padding:40px;'>No teams responded within the time limit.</p>";
    }
    content += "</div>";

    content += "<button class='next-btn' onclick='nextRound()'>NEXT ROUND</button>";
  }

  return content;
}

String getConfigPage()
{
  String page = String(configPage);
  page.replace("%BGCOLOR%", config.pageBgColor);
  page.replace("%DURATION%", String(config.timeDuration));
  page.replace("%PAGEBG%", config.pageBgColor);

  String teamConfig;
  for (int i = 0; i < 10; i++)
  {
    teamConfig += "<div class='team-config'>";
    teamConfig += "<h3 style='color:#333; margin-top:0;'>Team " + String(i + 1) + "</h3>";
    teamConfig += "<div class='form-group'>";
    teamConfig += "<label>Team Name:</label>";
    teamConfig += "<input type='text' name='teamName" + String(i) + "' value='" + config.teamNames[i] + "' placeholder='Enter team name'>";
    teamConfig += "</div>";
    teamConfig += "<div class='form-group'>";
    teamConfig += "<label>Team Color:</label>";
    teamConfig += "<input type='color' name='teamColor" + String(i) + "' value='" + config.teamColors[i] + "' onchange='updateColorPreview(this)'>";
    teamConfig += "<div class='color-preview' style='background:" + config.teamColors[i] + ";'></div>";
    teamConfig += "</div>";
    teamConfig += "</div>";
  }

  page.replace("%TEAMCONFIG%", teamConfig);
  return page;
}

// Web server handlers
void handleRoot()
{
  String page = String(mainPage);
  page.replace("%BGCOLOR%", config.pageBgColor);
  page.replace("%CONTENT%", getMainPageContent());
  server.send(200, "text/html", page);
}

void handleStatus()
{
  StaticJsonDocument<1024> doc;
  doc["gameActive"] = gameActive;
  doc["gameStarted"] = gameStarted;
  doc["pressCount"] = pressCount;
  doc["html"] = getMainPageContent();
  doc["bgColor"] = config.pageBgColor;

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void handleBegin()
{
  startGame();
  server.send(200, "text/plain", "Game started");
}

void handleNext()
{
  resetGame();
  server.send(200, "text/plain", "Ready for next round");
}

void handleConfig()
{
  if (!authenticated)
  {
    if (!server.authenticate(configUsername, configPassword))
    {
      return server.requestAuthentication();
    }
    authenticated = true;
  }
  server.send(200, "text/html", getConfigPage());
}

void handleSaveConfig()
{
  if (!authenticated)
  {
    server.send(401, "text/plain", "Unauthorized");
    return;
  }

  // Update configuration from form data
  if (server.hasArg("timeDuration"))
  {
    config.timeDuration = server.arg("timeDuration").toInt();
  }

  if (server.hasArg("pageBgColor"))
  {
    config.pageBgColor = server.arg("pageBgColor");
  }

  for (int i = 0; i < 10; i++)
  {
    if (server.hasArg("teamName" + String(i)))
    {
      config.teamNames[i] = server.arg("teamName" + String(i));
    }
    if (server.hasArg("teamColor" + String(i)))
    {
      config.teamColors[i] = server.arg("teamColor" + String(i));
    }
  }

  server.send(200, "text/plain", "Configuration saved");
  Serial.println("Configuration updated");
}

void handleLogout()
{
  authenticated = false;
  server.send(200, "text/plain", "Logged out");
}

void setup()
{
  // Boot protection
  pinMode(0, INPUT_PULLUP);
  delay(10);

  Serial.begin(115200);
  delay(100);

  Serial.println("STARTING QUIZ COMPETITION SYSTEM");
  Serial.println("==================================");

  // Initialize pins
  for (int i = 0; i < 10; i++)
  {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);

    if (i < 4)
    {
      pinMode(switchPins[i], INPUT);
    }
    else
    {
      pinMode(switchPins[i], INPUT_PULLUP);
    }
  }

  // Buzzer setup
  pinMode(buzzerPin, OUTPUT);
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(buzzerPin, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0);

  // Attach switch interrupts
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

  // Start WiFi AP
  WiFi.softAP("QuizCompetition", "12345678");
  Serial.println("ACCESS POINT STARTED");
  Serial.print("IP ADDRESS: ");
  Serial.println(WiFi.softAPIP());

  // Web server routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/begin", HTTP_POST, handleBegin);
  server.on("/next", HTTP_POST, handleNext);
  server.on("/config", handleConfig);
  server.on("/saveConfig", HTTP_POST, handleSaveConfig);
  server.on("/logout", handleLogout);

  server.begin();
  Serial.println("HTTP SERVER STARTED");
  Serial.println("CONNECT TO WIFI: QuizCompetition");
  Serial.println("OPEN: http://" + WiFi.softAPIP().toString());
  Serial.println("CONFIG: UOKSTAT / 1234");
  Serial.println("==================================");
}

void loop()
{
  server.handleClient();

  // Check game timer
  if (gameActive && (millis() - gameStartTime >= gameDuration))
  {
    endGame();
  }

  delay(10);
}