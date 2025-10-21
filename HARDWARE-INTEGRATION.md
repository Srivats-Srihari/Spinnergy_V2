Spinnergy — hardware integration notes
-----------------------------------
Goal: micro:bit (v2) collects motion/energy readings and syncs them to the web app (via smartphone BLE or Arduino acting as USB-serial bridge).

Options:
1) micro:bit -> Smartphone (BLE) -> App -> POST /api/microbit/sync
   - Pros: easiest for users with phones
   - Use Web Bluetooth (experimental) or native mobile app. Thunkable / MIT App Inventor can connect to micro:bit via BLE.

2) micro:bit -> Arduino (serial) -> Raspberry Pi / laptop -> POST to server
   - Pros: reliable; can use WiFi shield or tether
   - Arduino reads micro:bit via serial or uses its accelerometer sensors (if using external accelerometer).

3) micro:bit -> microbit stores readings -> user plugs micro:bit via USB, a small script reads and uploads (fallback delete-on-success).

Transistors & LEDs:
- S8550D331 (PNP?) -> Check the marking; most commonly S8550 is a PNP transistor used for low-current switching.
- For LED: long leg (anode) to resistor to +V (if using high side) or to digital pin via resistor to ground (common-cathode). Conservative: use 220-470Ω resistor.

Tinkercad-friendly wiring (ASCII):
- micro:bit v2: JST battery pack -> V+ (3V) and GND
- LED: PIN0 -> resistor 220Ω -> LED anode -> LED cathode -> GND
- Connect Arduino UNO (if used) TX/RX to USB for host upload.

Example micro:bit <-> Arduino (USB serial) approach:
1) micro:bit collects accelerometer readings as floating-point energy approximation.
2) micro:bit sends newline-delimited JSON strings over serial:
   { "energy": 0.95, "ts": 169 }
3) Arduino (or a laptop script) listens to serial, batches readings and POSTs to /api/microbit/sync with user's JWT in Authorization header.

No diode available:
- For energy harvesting safety, a diode prevents reverse current. If absent, avoid directly connecting motor-generator hardware to micro:bit power rails.

Micro:bit Tetris note:
- Use micro:bit v2 sound and display. Reduce block sizes to 1 LED per tetrimino & coalesce falling cadence.

Resources:
- micro:bit docs: https://microbit.org
- Arduino serial read tutorial: https://www.arduino.cc/en/Guide/Environment
