"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API = "http://localhost:4000";

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API);
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("snapshot", (data) => setSnapshot(data));
    return () => socket.disconnect();
  }, []);

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <p role="status">Connecting to office backend…</p>
      </main>
    );
  }

  const { devices, usage, alerts } = snapshot;
  const rooms = [
    { id: "drawing", name: "Drawing Room" },
    { id: "work1", name: "Work Room 1" },
    { id: "work2", name: "Work Room 2" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-6xl mx-auto">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">OfficeWatch</h1>
          <p className="text-sm text-slate-400">
            Live office energy monitor —{" "}
            <span className={connected ? "text-emerald-400" : "text-red-400"}>
              {connected ? "● live" : "○ disconnected"}
            </span>
          </p>
        </div>
        <section
          aria-label="Total power consumption"
          className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-right"
        >
          <p className="text-3xl font-bold text-amber-400">
            {usage.totalWatts}
            <span className="text-lg font-normal text-slate-400"> W</span>
          </p>
          <p className="text-xs text-slate-400">
            today ≈ {usage.todayKwh} kWh
          </p>
        </section>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {rooms.map((room) => {
          const roomDevices = devices.filter((d) => d.room === room.id);
          const roomWatts = usage.perRoom[room.id] ?? 0;
          return (
            <section
              key={room.id}
              aria-label={`${room.name} devices`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{room.name}</h2>
                <span className="text-sm text-amber-400 font-mono">
                  {roomWatts} W
                </span>
              </div>
              <ul className="space-y-2">
                {roomDevices.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`inline-block w-2.5 h-2.5 rounded-full ${d.status === "on"
                            ? d.type === "fan"
                              ? "bg-sky-400"
                              : "bg-amber-300"
                            : "bg-slate-700"
                          }`}
                      />
                      {d.type === "fan" ? "🌀" : "💡"} {d.name}
                    </span>
                    <span
                      className={
                        d.status === "on" ? "text-emerald-400" : "text-slate-500"
                      }
                    >
                      {d.status.toUpperCase()}
                      {d.status === "on" && (
                        <span className="text-slate-400"> · {d.watts}W</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section
        aria-label="Active alerts"
        className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-4"
      >
        <h2 className="font-semibold mb-3">⚠️ Active Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active alerts — office looks fine.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="text-sm flex justify-between gap-4 border-b border-slate-800 pb-2"
              >
                <span>{a.message}</span>
                <time
                  dateTime={a.triggeredAt}
                  className="text-slate-500 whitespace-nowrap"
                >
                  {new Date(a.triggeredAt).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}