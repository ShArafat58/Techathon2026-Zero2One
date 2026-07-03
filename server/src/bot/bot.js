// Discord bot — reads from the same in-memory store as the dashboard.
// Gemini turns raw data into friendly replies; a template fallback
// guarantees the bot always answers even if the LLM fails.

const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const store = require("../state/store");

const ROOM_ALIASES = {
    drawing: "drawing", drawingroom: "drawing",
    work1: "work1", workroom1: "work1", "work-1": "work1",
    work2: "work2", workroom2: "work2", "work-2": "work2",
};

// ---------- data → plain-English facts (single source of truth) ----------

function statusFacts() {
    return store.getRooms().map((room) => {
        const devices = store.getDevicesByRoom(room.id);
        const on = devices.filter((d) => d.status === "on");
        const fansOn = on.filter((d) => d.type === "fan").length;
        const lightsOn = on.filter((d) => d.type === "light").length;
        return { room: room.name, fansOn, lightsOn, total: devices.length, allOff: on.length === 0 };
    });
}

function usageFacts() {
    const { totalWatts, perRoom } = store.currentPower();
    return { totalWatts, perRoom, todayKwh: Number(store.getTodayKwh().toFixed(2)) };
}

// ---------- fallback templates (bot never goes silent) ----------

function statusTemplate() {
    return statusFacts()
        .map((f) => f.allOff ? `${f.room}: all off.` : `${f.room}: ${f.fansOn} fan(s) ON, ${f.lightsOn} light(s) ON.`)
        .join(" ");
}

function roomTemplate(roomId) {
    const room = store.getRooms().find((r) => r.id === roomId);
    const devices = store.getDevicesByRoom(roomId);
    const lines = devices.map((d) => `${d.name} (${d.type}): ${d.status.toUpperCase()}${d.status === "on" ? ` · ${d.watts}W` : ""}`);
    return `**${room.name}**\n${lines.join("\n")}`;
}

function usageTemplate() {
    const u = usageFacts();
    return `Total power right now: ${u.totalWatts}W. Today's estimated usage: ${u.todayKwh} kWh.`;
}

// ---------- Gemini humanizer with fallback ----------

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function humanize(facts, fallbackText, userQuestion) {
    if (!genAI) return fallbackText;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `You are OfficeWatch, a friendly office energy-monitor bot on Discord.
Answer the user's question using ONLY this live data (do not invent numbers):
${JSON.stringify(facts)}
User asked: "${userQuestion}"
Reply in 1-3 short sentences, casual and helpful, with the key numbers. No markdown tables.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text.length > 0 ? text : fallbackText;
    } catch (err) {
        console.error("[bot] Gemini failed, using template:", err.message);
        return fallbackText;
    }
}

// ---------- Discord wiring ----------

function startBot() {
    if (!process.env.DISCORD_TOKEN) {
        console.warn("[bot] DISCORD_TOKEN missing — bot disabled, API/dashboard unaffected");
        return null;
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.on("clientReady", () => console.log(`[bot] logged in as ${client.user.tag}`));


    client.on("messageCreate", async (msg) => {
        if (msg.author.bot) return;
        const content = msg.content.trim().toLowerCase().split("\n")[0].trim();

        try {
            if (content === "!status") {
                const reply = await humanize(statusFacts(), statusTemplate(), "overall office status");
                return msg.reply(reply);
            }

            if (content.startsWith("!room")) {
                const arg = content.replace("!room", "").replace(/\s+/g, "");
                const roomId = ROOM_ALIASES[arg];
                if (!roomId) return msg.reply("Room not found 🤔 Try: `!room drawing`, `!room work1`, `!room work2`");
                return msg.reply(roomTemplate(roomId)); // structured — template reads better than prose here
            }

            if (content === "!usage") {
                const reply = await humanize(usageFacts(), usageTemplate(), "current power usage and today's consumption");
                return msg.reply(reply);
            }

            if (content === "!help") {
                return msg.reply("I know these: `!status` — whole office · `!room <drawing|work1|work2>` — one room · `!usage` — power & kWh");
            }
        } catch (err) {
            console.error("[bot] command failed:", err);
            msg.reply("Something went wrong on my end — try again in a moment 🙏");
        }
    });

    client.login(process.env.DISCORD_TOKEN);
    return client;
}

module.exports = { startBot };