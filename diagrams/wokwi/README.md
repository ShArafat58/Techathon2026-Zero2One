# Wokwi Circuit — One-Room Sensing Concept

Live simulation: https://wokwi.com/projects/468554533482818561

ESP32 reads 5 device states (2 fans + 3 lights, Work Room 1) via INPUT_PULLUP
switch taps (switches stand in for relay/optocoupler state sensing), mirrors
each state on a status LED through a 220Ω current-limiting resistor, and prints
the exact JSON payload shape our backend simulator uses. One room is
representative — the other two rooms repeat the identical pattern.

| Device  | Sense pin | Status LED |
|---------|-----------|------------|
| Fan 1   | GPIO 4    | GPIO 12    |
| Fan 2   | GPIO 5    | GPIO 13    |
| Light 1 | GPIO 18   | GPIO 14    |
| Light 2 | GPIO 19   | GPIO 25    |
| Light 3 | GPIO 21   | GPIO 26    |