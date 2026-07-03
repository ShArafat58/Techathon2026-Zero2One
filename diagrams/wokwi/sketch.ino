// OfficeWatch — one-room device sensing concept (Work Room 1)
// Switches stand in for real relay/optocoupler state taps.
// Serial payload mirrors server/src/state/store.js exactly.

struct Device {
  const char* id;
  const char* type;
  int sensePin;
  int ledPin;
  int watts;
};

Device devices[] = {
  { "work1-fan-1",   "fan",   4,  12, 70 },
  { "work1-fan-2",   "fan",   5,  13, 70 },
  { "work1-light-1", "light", 18, 14, 15 },
  { "work1-light-2", "light", 19, 25, 16 },
  { "work1-light-3", "light", 21, 26, 16 },
};
const int N = sizeof(devices) / sizeof(devices[0]);

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < N; i++) {
    pinMode(devices[i].sensePin, INPUT_PULLUP); // LOW = device ON
    pinMode(devices[i].ledPin, OUTPUT);
  }
}

void loop() {
  Serial.print("{\"room\":\"work1\",\"devices\":[");
  for (int i = 0; i < N; i++) {
    bool on = digitalRead(devices[i].sensePin) == LOW;
    digitalWrite(devices[i].ledPin, on ? HIGH : LOW);
    Serial.print("{\"id\":\"");
    Serial.print(devices[i].id);
    Serial.print("\",\"status\":\"");
    Serial.print(on ? "on" : "off");
    Serial.print("\",\"watts\":");
    Serial.print(on ? devices[i].watts : 0);
    Serial.print("}");
    if (i < N - 1) Serial.print(",");
  }
  Serial.println("]}");
  delay(2000); // in a real deployment this would publish over MQTT/HTTP
}