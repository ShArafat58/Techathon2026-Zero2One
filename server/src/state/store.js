// In-memory device store — the single source of truth.
// Both the REST API (dashboard) and the Discord bot read from here.

const ROOMS = [
    { id: "drawing", name: "Drawing Room" },
    { id: "work1", name: "Work Room 1" },
    { id: "work2", name: "Work Room 2" },
];

// Realistic wattages: ceiling fan ~60-75W, LED tube light ~15-20W
const DEVICE_TEMPLATE = [
    { type: "fan", count: 2, watts: [60, 75] },
    { type: "light", count: 3, watts: [15, 18] },
];

function buildDevices() {
    const devices = [];
    for (const room of ROOMS) {
        for (const t of DEVICE_TEMPLATE) {
            for (let i = 1; i <= t.count; i++) {
                devices.push({
                    id: `${room.id}-${t.type}-${i}`,
                    name: `${t.type === "fan" ? "Fan" : "Light"} ${i}`,
                    type: t.type,
                    room: room.id,
                    roomName: room.name,
                    status: "off",
                    watts: t.watts[0] + Math.round(Math.random() * (t.watts[1] - t.watts[0])),
                    lastChanged: new Date().toISOString(),
                });
            }
        }
    }
    return devices;
}

const state = {
    devices: buildDevices(),
    alerts: [], // { id, message, room, triggeredAt, type }
};

function getDevices() {
    return state.devices;
}

function getDevicesByRoom(roomId) {
    return state.devices.filter((d) => d.room === roomId);
}

function setDeviceStatus(id, status) {
    const device = state.devices.find((d) => d.id === id);
    if (!device || device.status === status) return null;
    device.status = status;
    device.lastChanged = new Date().toISOString();
    return device;
}

function getRooms() {
    return ROOMS;
}

// Power math — used by API, bot, and alerts alike
function currentPower() {
    const perRoom = {};
    for (const room of ROOMS) perRoom[room.id] = 0;
    let total = 0;
    for (const d of state.devices) {
        if (d.status === "on") {
            perRoom[d.room] += d.watts;
            total += d.watts;
        }
    }
    return { totalWatts: total, perRoom };
}

// kWh consumed today (approximated by sampling — see simulator)
let todayWh = 0;
function addEnergySample(watts, intervalMs) {
    todayWh += (watts * intervalMs) / 3_600_000; // W * h
}
function getTodayKwh() {
    return todayWh / 1000;
}
function resetDailyEnergy() {
    todayWh = 0;
}

function getAlerts() {
    return state.alerts;
}
function addAlert(alert) {
    state.alerts.unshift({ ...alert, id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
    if (state.alerts.length > 50) state.alerts.pop(); // keep it bounded
    return state.alerts[0];
}

module.exports = {
    getDevices,
    getDevicesByRoom,
    setDeviceStatus,
    getRooms,
    currentPower,
    addEnergySample,
    getTodayKwh,
    resetDailyEnergy,
    getAlerts,
    addAlert,
};