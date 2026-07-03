// Simulates realistic office behaviour so the dashboard is always live.
// Devices flip on/off with probabilities that depend on office hours,
// mirroring exactly the payload an ESP32 device layer would publish.

const store = require("../state/store");

const TICK_MS = 5000; // evaluate world every 5s
const OFFICE_START = 9; // 9 AM
const OFFICE_END = 17; // 5 PM

function isOfficeHours(date = new Date()) {
    const h = date.getHours();
    return h >= OFFICE_START && h < OFFICE_END;
}

// Per-tick flip probabilities (tuned so changes happen every ~15-40s)
function flipProbability(device) {
    if (isOfficeHours()) {
        // busy office: things turn on more than off
        return device.status === "off" ? 0.10 : 0.04;
    }
    // after hours: mostly off, occasional "forgotten" device
    return device.status === "off" ? 0.01 : 0.08;
}

function tick(onChange) {
    const changed = [];
    for (const device of store.getDevices()) {
        if (Math.random() < flipProbability(device)) {
            const next = device.status === "on" ? "off" : "on";
            const updated = store.setDeviceStatus(device.id, next);
            if (updated) changed.push(updated);
        }
    }
    // integrate energy usage for today's kWh estimate
    const { totalWatts } = store.currentPower();
    store.addEnergySample(totalWatts, TICK_MS);

    if (changed.length > 0 && typeof onChange === "function") {
        onChange(changed);
    }
}

let timer = null;
function start(onChange) {
    if (timer) return;
    // seed: start with a believable scene (some devices on)
    for (const device of store.getDevices()) {
        if (Math.random() < (isOfficeHours() ? 0.55 : 0.15)) {
            store.setDeviceStatus(device.id, "on");
        }
    }
    timer = setInterval(() => tick(onChange), TICK_MS);
    console.log(`[simulator] started — tick every ${TICK_MS / 1000}s`);
}

function stop() {
    clearInterval(timer);
    timer = null;
}

module.exports = { start, stop, isOfficeHours, TICK_MS };