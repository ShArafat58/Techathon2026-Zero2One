require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const routes = require("./api/routes");
const simulator = require("./simulator/simulator");
const store = require("./state/store");
const alertEngine = require("./alerts/engine");
const { startBot } = require("./bot/bot");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

function buildSnapshot() {
    return {
        devices: store.getDevices(),
        usage: { ...store.currentPower(), todayKwh: Number(store.getTodayKwh().toFixed(2)) },
        alerts: store.getAlerts(),
    };
}

function broadcastSnapshot() {
    io.emit("snapshot", buildSnapshot());
}

io.on("connection", (socket) => {
    console.log("[socket] dashboard connected:", socket.id);
    socket.emit("snapshot", buildSnapshot());
});

const bot = startBot();

function handleFiredAlerts(fired) {
    if (fired.length > 0 && bot?.announceAlerts) bot.announceAlerts(fired);
}

simulator.start(() => {
    handleFiredAlerts(alertEngine.checkRules());
    broadcastSnapshot();
});

setInterval(() => {
    const fired = alertEngine.checkRules();
    if (fired.length > 0) {
        handleFiredAlerts(fired);
        broadcastSnapshot();
    }
}, 30_000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[server] API + Socket.io on http://localhost:${PORT}`);
});