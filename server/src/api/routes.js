const express = require("express");
const store = require("../state/store");

const router = express.Router();

// GET /api/devices — all 15 devices with live state
router.get("/devices", (req, res) => {
    res.json({ devices: store.getDevices() });
});

// GET /api/rooms — room list + per-room device state
router.get("/rooms", (req, res) => {
    const rooms = store.getRooms().map((room) => ({
        ...room,
        devices: store.getDevicesByRoom(room.id),
    }));
    res.json({ rooms });
});

// GET /api/rooms/:id — one room (used by bot's !room command)
router.get("/rooms/:id", (req, res) => {
    const room = store.getRooms().find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found. Valid: drawing, work1, work2" });
    res.json({ ...room, devices: store.getDevicesByRoom(room.id) });
});

// GET /api/usage — live power + today's kWh estimate
router.get("/usage", (req, res) => {
    const power = store.currentPower();
    res.json({
        totalWatts: power.totalWatts,
        perRoom: power.perRoom,
        todayKwh: Number(store.getTodayKwh().toFixed(2)),
    });
});

// GET /api/alerts — timestamped alert feed
router.get("/alerts", (req, res) => {
    res.json({ alerts: store.getAlerts() });
});

module.exports = router;