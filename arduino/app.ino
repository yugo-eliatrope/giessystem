#include "DHT.h"

#define RELAY_IN 7
#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

unsigned long INTERVAL_TIME = 1000 * 5;
const int DHT_RETRY_COUNT = 3;
const int DHT_RETRY_DELAY = 2500;
const int RELAY_SETTLE_DELAY = 300;

struct LastValues {
  float t;
  float h;
};
struct LastValues last;

void setup() {
  pinMode(RELAY_IN, OUTPUT);
  digitalWrite(RELAY_IN, LOW);
  Serial.begin(9600);
  dht.begin();
  last.t = -100.0;
  last.h = -100.0;
}

int readRelayTime() {
  String inString = "";
  while (Serial.available() > 0) {
    int inChar = Serial.read();
    if (isDigit(inChar)) {
      inString += (char)inChar;
    }
    if (inChar == '\n') {
      int parsedNumber = inString.toInt();
      if (parsedNumber >= 2 || parsedNumber <= 32) {
        return parsedNumber * 1000;
      }
      Serial.println("Wrong relay time parameter");
    }
  }
  return 0;
}

bool readDHTWithRetry(float &humidity, float &temperature) {
  for (int i = 0; i < DHT_RETRY_COUNT; i++) {
    humidity = dht.readHumidity();
    temperature = dht.readTemperature() - 2.0;
    
    if (!isnan(humidity) && !isnan(temperature)) {
      return true;
    }
    
    if (i < DHT_RETRY_COUNT - 1) {
      delay(DHT_RETRY_DELAY);
    }
  }
  return false;
}

void loop() {
  int relayTime = readRelayTime();
  if (relayTime > 1000) {
    Serial.print("Relay turned on for ");
    Serial.print(relayTime);
    Serial.println(" ms");
    digitalWrite(RELAY_IN, HIGH);
    delay(relayTime);
    digitalWrite(RELAY_IN, LOW);
    Serial.println("Relay turned off");
    delay(RELAY_SETTLE_DELAY);
  }
  
  float h, t;
  if (readDHTWithRetry(h, t)) {
    if (last.t != t || last.h != h) {
      last.t = t;
      last.h = h;
      Serial.print("t:");
      Serial.print(t);
      Serial.print(", h: ");
      Serial.println(h);
    }
  } else {
    Serial.println("Failed to read from DHT sensor!");
  }
  
  delay(INTERVAL_TIME);
}
