export default function FloorPlan({ devices = [] }) {
  // Helper to find a device
  const getDevice = (roomId, type, index) => {
    // Exact match for common id patterns
    let exact = devices.find((d) => d.id === `${roomId}-${type}-${index}`);
    if (exact) return exact;

    // In case id has no dash before index (e.g., work1-fan1)
    exact = devices.find((d) => d.id === `${roomId}-${type}${index}`);
    if (exact) return exact;

    // Fallback to order in the array
    const filtered = devices.filter((d) => d.room === roomId && d.type === type);
    return filtered[index - 1]; // 1-based index to 0-based array
  };

  const getRoomWatts = (roomId) => {
    return devices
      .filter((d) => d.room === roomId && d.status === "on")
      .reduce((sum, d) => sum + (d.watts || 0), 0);
  };

  const Light = ({ x, y, roomId, index, labelName }) => {
    const device = getDevice(roomId, "light", index);
    const isOn = device?.status === "on";
    const label = `${labelName} Light ${index}: ${isOn ? "on" : "off"}`;
    return (
      <g transform={`translate(${x}, ${y})`} aria-label={label} role="img">
        <circle
          cx="0"
          cy="0"
          r="8"
          fill={isOn ? "#fbbf24" : "#1e293b"}
          stroke={isOn ? "#f59e0b" : "#334155"}
          strokeWidth="2"
          filter={isOn ? "url(#glow)" : ""}
        />
      </g>
    );
  };

  const Fan = ({ x, y, roomId, index, labelName }) => {
    const device = getDevice(roomId, "fan", index);
    const isOn = device?.status === "on";
    const label = `${labelName} Fan ${index}: ${isOn ? "on" : "off"}`;
    return (
      <g transform={`translate(${x}, ${y})`} aria-label={label} role="img">
        <circle cx="0" cy="0" r="4" fill={isOn ? "#e2e8f0" : "#475569"} />
        <g
          className={isOn ? "fan-spin" : ""}
          style={{ transformOrigin: "0px 0px" }}
        >
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path
                d="M 0,-4 L 4,-18 A 6 6 0 0 0 -4,-18 Z"
                fill={isOn ? "#e2e8f0" : "#475569"}
              />
            </g>
          ))}
        </g>
      </g>
    );
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden mb-6">
      <svg
        viewBox="0 0 850 420"
        className="w-full h-auto"
        style={{ maxHeight: "60vh" }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes fanSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .fan-spin {
              animation: fanSpin 1s linear infinite;
            }
          `}</style>
        </defs>

        {/* --- Floor Plan Background --- */}

        {/* Drawing Room */}
        <rect x="50" y="50" width="250" height="250" fill="none" stroke="#475569" strokeWidth="4" />
        <text x="60" y="80" fill="#94a3b8" fontSize="16" fontWeight="bold">Drawing Room</text>
        <text x="60" y="100" fill="#fbbf24" fontSize="14" fontFamily="monospace">{getRoomWatts("drawing")} W</text>
        {/* Sofa and small table in Drawing Room */}
        <rect x="65" y="140" width="30" height="100" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="110" y="170" width="40" height="40" rx="20" fill="#1e293b" stroke="#334155" strokeWidth="2" />

        {/* Work Room 1 */}
        <rect x="300" y="50" width="250" height="250" fill="none" stroke="#475569" strokeWidth="4" />
        <text x="310" y="80" fill="#94a3b8" fontSize="16" fontWeight="bold">Work Room 1</text>
        <text x="310" y="100" fill="#fbbf24" fontSize="14" fontFamily="monospace">{getRoomWatts("work1")} W</text>
        {/* Desks in Work Room 1 */}
        <rect x="340" y="130" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="450" y="130" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="340" y="210" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="450" y="210" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />

        {/* Work Room 2 */}
        <rect x="550" y="50" width="250" height="250" fill="none" stroke="#475569" strokeWidth="4" />
        <text x="560" y="80" fill="#94a3b8" fontSize="16" fontWeight="bold">Work Room 2</text>
        <text x="560" y="100" fill="#fbbf24" fontSize="14" fontFamily="monospace">{getRoomWatts("work2")} W</text>
        {/* Desks in Work Room 2 */}
        <rect x="590" y="130" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="700" y="130" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="590" y="210" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        <rect x="700" y="210" width="60" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="2" />

        {/* Corridor */}
        <rect x="50" y="300" width="750" height="50" fill="none" stroke="#475569" strokeWidth="4" />
        
        {/* Doors (gaps in walls) - drawn by overlaying background colored rects over the strokes */}
        <rect x="155" y="296" width="40" height="8" fill="#0f172a" />
        <rect x="405" y="296" width="40" height="8" fill="#0f172a" />
        <rect x="655" y="296" width="40" height="8" fill="#0f172a" />
        {/* Corridor Entry Gap */}
        <rect x="405" y="346" width="40" height="8" fill="#0f172a" />

        {/* Entry Arrow */}
        <g transform="translate(425, 380)">
          <path d="M 0,-15 L -10,0 L -4,0 L -4,15 L 4,15 L 4,0 L 10,0 Z" fill="#475569" />
          <text x="0" y="32" fill="#94a3b8" fontSize="14" textAnchor="middle" fontWeight="bold">ENTRY</text>
        </g>

        {/* --- Devices --- */}

        {/* Drawing Room (Center: 175, 175) */}
        <Fan x="175" y="120" roomId="drawing" index={1} labelName="Drawing Room" />
        <Fan x="175" y="230" roomId="drawing" index={2} labelName="Drawing Room" />
        <Light x="90" y="80" roomId="drawing" index={1} labelName="Drawing Room" />
        <Light x="260" y="80" roomId="drawing" index={2} labelName="Drawing Room" />
        <Light x="260" y="260" roomId="drawing" index={3} labelName="Drawing Room" />

        {/* Work Room 1 (Center: 425, 175) */}
        <Fan x="425" y="120" roomId="work1" index={1} labelName="Work Room 1" />
        <Fan x="425" y="230" roomId="work1" index={2} labelName="Work Room 1" />
        <Light x="340" y="80" roomId="work1" index={1} labelName="Work Room 1" />
        <Light x="510" y="80" roomId="work1" index={2} labelName="Work Room 1" />
        <Light x="425" y="175" roomId="work1" index={3} labelName="Work Room 1" />

        {/* Work Room 2 (Center: 675, 175) */}
        <Fan x="675" y="120" roomId="work2" index={1} labelName="Work Room 2" />
        <Fan x="675" y="230" roomId="work2" index={2} labelName="Work Room 2" />
        <Light x="590" y="80" roomId="work2" index={1} labelName="Work Room 2" />
        <Light x="760" y="80" roomId="work2" index={2} labelName="Work Room 2" />
        <Light x="675" y="175" roomId="work2" index={3} labelName="Work Room 2" />

      </svg>
    </div>
  );
}
