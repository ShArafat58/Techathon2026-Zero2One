// Alert engine — evaluates rules on every simulator tick.
// Rule 1: any device ON outside office hours (9 AM - 5 PM)
// Rule 2: all devices in a room ON continuously for 2+ hours

const store = require("../state/store");
const { isOfficeHours } = require("../simulator/simulator");

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
// Re-alert cooldown so we don't spam the same alert every 5s
const COOLDOWN_MS = 10 * 60 * 1000;

const lastAlerted = new Map(); // key -> timestamp

function shouldAlert(key) {
    const last = lastAlerted.get(key) || 0;
    if (Date.now() - last < COOLDOWN_MS) return false;
    lastAlerted.set(key, Date.now());
    return true;
}

function checkRules() {
    const newAlerts = [];
    const now = new Date();

    // Rule 1 — after-hours devices
    if (!isOfficeHours(now)) {
        const onDevices = store.getDevices().filter((d) => d.status === "on");
        for (const d of onDevices) {
            const key = `afterhours-${d.id}`;
            if (shouldAlert(key)) {
                newAlerts.push(
                    store.addAlert({
                        type: "after_hours",
                        room: d.room,
                        message: `${d.roomName}: ${d.name} is ON outside office hours (${d.watts}W)`,
                        triggeredAt: now.toISOString(),
                    })
                );
            }
        }
    }

    // Rule 2 — whole room on for 2+ hours
    for (const room of store.getRooms()) {
        const devices = store.getDevicesByRoom(room.id);
        const allOn = devices.every((d) => d.status === "on");
        if (!allOn) continue;
        const oldestChange = Math.min(
            ...devices.map((d) => new Date(d.lastChanged).getTime())
        );
        if (Date.now() - oldestChange >= TWO_HOURS_MS) {
            const key = `roomon-${room.id}`;
            if (shouldAlert(key)) {
                newAlerts.push(
                    store.addAlert({
                        type: "room_continuous",
                        room: room.id,
                        message: `${room.name}: ALL devices have been ON for over 2 hours`,
                        triggeredAt: now.toISOString(),
                    })
                );
            }
        }
    }

    return newAlerts;
}

module.exports = { checkRules };