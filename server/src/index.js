require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const routes = require("./api/routes");
const simulator = require("./simulator/simulator");
const store = require("./state/store");

const app = express();
app.use(cors()); // dashboard runs on :3000, API on :4000
app.use(express.json());
app.use("/api", routes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Push a full snapshot to every dashboard whenever the world changes
function broadcastSnapshot() {
    io.emit("snapshot", {
        devices: store.getDevices(),
        usage: { ...store.currentPower(), todayKwh: Number(store.getTodayKwh().toFixed(2)) },
        alerts: store.getAlerts(),
    });
}

io.on("connection", (socket) => {
    console.log("[socket] dashboard connected:", socket.id);
    // send current state immediately so the UI never starts empty
    socket.emit("snapshot", {
        devices: store.getDevices(),
        usage: { ...store.currentPower(), todayKwh: Number(store.getTodayKwh().toFixed(2)) },
        alerts: store.getAlerts(),
    });
});

simulator.start(() => broadcastSnapshot());

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`[server] API + Socket.io on http://localhost:${PORT}`);
});