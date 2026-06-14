import { useEffect, useMemo, useState } from "react";
import {
  alertDrafts,
  crews as seedCrews,
  floodZones,
  incidents as seedIncidents,
  roadClosures,
  sensors,
  sopSteps as seedSopSteps,
  timeline,
} from "./data";
import type { AlertDraft, Crew, IncidentStatus, Severity, SopStep, TrafficIncident } from "./types";

type LayerKey = "flood" | "closures" | "incidents" | "sensors" | "crews" | "radar" | "cctv";

const navItems = ["Overview", "Map", "Incidents", "Flood Forecast", "Sensors", "Traffic", "Drainage Crews", "Resources", "Alerts", "SOP Library", "Reports", "Settings"];
const regions = ["All Regions", "North-West", "East-West Corridor", "Central", "South", "Tobago"];

const layerLabels: Record<LayerKey, string> = {
  flood: "Flood Risk Zones",
  closures: "Road Closures",
  incidents: "Traffic Incidents",
  sensors: "Sensor Locations",
  crews: "Drainage Crews",
  radar: "Rainfall Radar",
  cctv: "CCTV Cameras",
};

function severityClass(severity: Severity) {
  return severity.toLowerCase();
}

function Icon({ name }: { name: string }) {
  return (
    <span className="icon" aria-hidden="true">
      {name}
    </span>
  );
}

function MetricCard({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  action?: string;
  className?: string;
}) {
  return (
    <section className={`metric-card ${className}`}>
      <div className="metric-title">{title}</div>
      {children}
      {action ? <button className="text-action">{action} -&gt;</button> : null}
    </section>
  );
}

function TopBar({ region, setRegion }: { region: string; setRegion: (region: string) => void }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="crest">TT</div>
        <div>
          <h1>National Flood and Traffic Intelligence Platform</h1>
          <p>Command Centre <span>•</span> Trinidad and Tobago</p>
        </div>
      </div>
      <div className="status-strip">
        <div className="live-indicator"><span /> LIVE</div>
        <div className="divider" />
        <div>
          <strong>09:24 AST</strong>
          <small>Jun 14, 2026</small>
        </div>
        <div className="weather">
          <Icon name="☔" />
          <div>
            <strong>26°C</strong>
            <small>Light Rain</small>
          </div>
        </div>
        <div className="agencies">
          <span>ODPM</span>
          <span>MOWT</span>
          <span>TTPS</span>
        </div>
        <select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Region">
          {regions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <div className="operator">CC<span /></div>
      </div>
    </header>
  );
}

function Sidebar({ active, setActive }: { active: string; setActive: (item: string) => void }) {
  return (
    <aside className="sidebar">
      <nav>
        {navItems.map((item) => (
          <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>
            <Icon name={item === "Overview" ? "⌂" : item === "Map" ? "◇" : item === "Settings" ? "⚙" : "□"} />
            <span>{item}</span>
          </button>
        ))}
      </nav>
      <div className="filter-summary">
        <div className="filter-head"><span>Active Filters</span><button>Clear</button></div>
        <dl>
          <div><dt>Hazard</dt><dd>All</dd></div>
          <div><dt>Status</dt><dd>Active</dd></div>
          <div><dt>Road</dt><dd>All</dd></div>
          <div><dt>Region</dt><dd>All</dd></div>
        </dl>
      </div>
      <div className="system-status">
        <span className="green-dot" />
        <div>
          <strong>System Status</strong>
          <small>All systems operational</small>
        </div>
      </div>
    </aside>
  );
}

function DashboardMetrics({ livePulse }: { livePulse: number }) {
  const onlineSensors = sensors.filter((sensor) => sensor.status !== "offline").length;
  const uptime = Math.max(86, 88 + (livePulse % 3));

  return (
    <div className="metrics-grid">
      <MetricCard title="National Risk Level" className="risk-card">
        <div className="risk-row">
          <div className="risk-icon">△</div>
          <div>
            <div className="risk-label">HIGH</div>
            <small>Trend <b>↗ Rising</b></small>
          </div>
        </div>
        <p>Last updated 09:{20 + livePulse} AST</p>
      </MetricCard>
      <MetricCard title="Flood Forecast (30-90 min)" action="View Forecast">
        <div className="forecast-row">
          <Icon name="☔" />
          <span><b>30 min</b><em>High</em></span>
          <span><b>60 min</b><em>High</em></span>
          <span><b>90 min</b><em>Moderate</em></span>
        </div>
        <p>Peak risk: Caroni, Beetham, Bamboo</p>
      </MetricCard>
      <MetricCard title="Traffic Incidents" action="View Incidents">
        <div className="triple-stat">
          <span><b>{23 + livePulse}</b><em>Active</em></span>
          <span><b>{roadClosures.length + 9}</b><em>Road Closures</em></span>
          <span><b>{18 - (livePulse % 2)}</b><em>Delays</em></span>
        </div>
      </MetricCard>
      <MetricCard title="Sensor Health" action="View Sensors">
        <div className="sensor-stat">
          <div className="signal">)))</div>
          <span><b>{onlineSensors * 31 + livePulse} / 268</b><em>Online</em></span>
          <span><b>{uptime}%</b><em>Uptime</em></span>
        </div>
      </MetricCard>
      <MetricCard title="Drainage Crew Priority" action="View Crews">
        <div className="triple-stat two">
          <span><b>{seedCrews.filter((crew) => crew.priority === "High").length + 6}</b><em>High Priority</em></span>
          <span><b>{seedCrews.filter((crew) => crew.status === "Dispatched").length + 12}</b><em>In Progress</em></span>
        </div>
      </MetricCard>
      <div className="broadcast-stack">
        <MetricCard title="Public Alert Draft" action="View Drafts">
          <div className="compact-alert"><Icon name="▸" /><b>1</b><span>Drafts Ready</span></div>
        </MetricCard>
        <MetricCard title="WhatsApp Broadcast" action="View Broadcasts">
          <div className="compact-alert whatsapp"><Icon name="◌" /><b>3</b><span>Campaigns Active</span></div>
        </MetricCard>
      </div>
    </div>
  );
}

function OperationsMap({
  selectedId,
  setSelectedId,
  activeLayers,
  toggleLayer,
}: {
  selectedId: string;
  setSelectedId: (id: string) => void;
  activeLayers: Record<LayerKey, boolean>;
  toggleLayer: (layer: LayerKey) => void;
}) {
  const visibleIncidents = activeLayers.incidents ? seedIncidents : [];

  return (
    <section className="map-panel">
      <div className="map-tools">
        <label className="search">
          <span>Search location</span>
          <input placeholder="Search location" />
        </label>
        <div className="layers">
          {(Object.keys(layerLabels) as LayerKey[]).map((key) => (
            <button key={key} className={activeLayers[key] ? "enabled" : ""} onClick={() => toggleLayer(key)}>
              <span className="checkbox">{activeLayers[key] ? "✓" : ""}</span>
              {layerLabels[key]}
            </button>
          ))}
        </div>
      </div>
      <div className="map-viewport" role="img" aria-label="Operational map of Trinidad with flood, traffic, sensor, and crew overlays">
        <svg viewBox="0 0 1000 620" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sea" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#073544" />
              <stop offset="0.58" stopColor="#0a5663" />
              <stop offset="1" stopColor="#09202b" />
            </linearGradient>
            <linearGradient id="land" x1="0" x2="1">
              <stop offset="0" stopColor="#37553f" />
              <stop offset="0.52" stopColor="#536746" />
              <stop offset="1" stopColor="#304636" />
            </linearGradient>
            <filter id="softShadow">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00141d" floodOpacity=".55" />
            </filter>
          </defs>
          <rect width="1000" height="620" fill="url(#sea)" />
          <path className="terrain-line" d="M75 470 C230 390 250 300 370 250 C520 176 610 130 790 160 C930 186 960 270 895 354 C824 446 670 436 540 505 C395 583 236 561 75 470Z" />
          <path className="island" filter="url(#softShadow)" d="M82 455 C190 382 240 315 347 267 C520 190 624 135 801 173 C927 200 960 272 895 351 C815 448 673 438 548 501 C398 578 223 557 82 455Z" />
          <path className="hill" d="M258 373 C390 310 498 255 666 244 C770 239 840 278 888 330 C810 416 650 408 526 466 C408 520 295 500 210 452 C214 421 229 394 258 373Z" />
          <path className="road major" d="M120 442 C260 398 360 335 514 314 C642 295 780 260 900 308" />
          <path className="road major" d="M354 252 C405 334 455 422 532 504" />
          <path className="road" d="M218 493 C318 452 440 425 574 404 C700 385 810 382 904 352" />
          <path className="road" d="M305 305 C390 355 473 370 590 366 C700 362 790 330 874 332" />
          <path className="road closure" d="M380 332 C445 365 520 368 590 362" />
          <path className="road closure" d="M385 455 C430 430 462 406 498 374" />
          {activeLayers.radar ? <circle cx="450" cy="360" r="260" className="radar" /> : null}
          {activeLayers.flood
            ? floodZones.map((zone) => (
                <circle key={zone.id} cx={zone.point.x * 10} cy={zone.point.y * 6.2} r={zone.severity === "High" ? 54 : 38} className={`flood-zone ${severityClass(zone.severity)}`} />
              ))
            : null}
          {["Port of Spain", "Diego Martin", "Curepe", "Caroni", "Chaguanas", "Bamboo", "Beetham", "San Fernando"].map((label, index) => {
            const points = [
              [380, 290],
              [336, 210],
              [535, 328],
              [374, 454],
              [460, 520],
              [680, 510],
              [500, 638],
              [362, 760],
            ];
            const [x, y] = points[index];
            return (
              <text key={label} x={x} y={Math.min(y * 0.78, 580)} className="map-label">
                {label}
              </text>
            );
          })}
          {activeLayers.sensors
            ? sensors.map((sensor) => (
                <circle key={sensor.id} cx={sensor.point.x * 10} cy={sensor.point.y * 6.2} r="7" className={`sensor-dot ${sensor.status}`} />
              ))
            : null}
          {activeLayers.closures
            ? roadClosures.map((closure) => (
                <rect key={closure.id} x={closure.point.x * 10 - 9} y={closure.point.y * 6.2 - 9} width="18" height="18" rx="4" className={`closure-dot ${severityClass(closure.severity)}`} />
              ))
            : null}
          {visibleIncidents.map((incident) => (
            <button key={incident.id} className="svg-button" onClick={() => setSelectedId(incident.id)} aria-label={incident.title}>
              <circle cx={incident.point.x * 10} cy={incident.point.y * 6.2} r={selectedId === incident.id ? 18 : 14} className={`incident-dot ${severityClass(incident.severity)} ${selectedId === incident.id ? "selected" : ""}`} />
              <text x={incident.point.x * 10} y={incident.point.y * 6.2 + 5} className="incident-glyph">
                !
              </text>
            </button>
          ))}
        </svg>
        {activeLayers.crews
          ? seedCrews.slice(0, 4).map((crew, index) => (
              <button
                key={crew.id}
                className={`crew-chip ${severityClass(crew.priority)}`}
                style={{ left: `${31 + index * 11}%`, top: `${62 - index * 8}%` }}
                title={crew.name}
              >
                {crew.type}
              </button>
            ))
          : null}
        <div className="map-controls">
          <button>+</button>
          <button>-</button>
          <button>□</button>
          <button>◆</button>
        </div>
        <div className="scale"><span />0 <b />5 <b />10 km</div>
        <button className="recenter">⌖ Re-centre</button>
      </div>
    </section>
  );
}

function IncidentInspector({
  incident,
  setIncidentStatus,
  alertDraft,
  setAlertDraft,
  sopSteps,
  toggleSop,
}: {
  incident: TrafficIncident;
  setIncidentStatus: (status: IncidentStatus) => void;
  alertDraft: AlertDraft;
  setAlertDraft: (draft: AlertDraft) => void;
  sopSteps: SopStep[];
  toggleSop: (id: string) => void;
}) {
  return (
    <aside className="inspector">
      <section className="incident-card">
        <div className="incident-head">
          <span className="incident-code">{incident.id}</span>
          <span className={`pill ${severityClass(incident.severity)}`}>{incident.severity}</span>
        </div>
        <h2>{incident.title}</h2>
        <p>{incident.location}</p>
        <div className="tabs"><button className="active">Details</button><button>Resources</button><button>SOP</button><button>Updates (3)</button></div>
        <div className="detail-grid">
          <span>Status</span>
          <select value={incident.status} onChange={(event) => setIncidentStatus(event.target.value as IncidentStatus)}>
            <option>Active</option>
            <option>Assigned</option>
            <option>Monitoring</option>
            <option>Resolved</option>
          </select>
          <span>Reported</span><strong>{incident.reportedAt}</strong>
          <span>Type</span><strong>{incident.type}</strong>
          <span>Impact</span><strong className={severityClass(incident.impact)}>{incident.impact}</strong>
          <span>Road</span><strong>{incident.road}</strong>
          <span>Nearby</span><strong>{incident.nearby}</strong>
          <span>Source</span><strong>{incident.source}</strong>
          <span>Assigned</span><strong>{incident.assignedTo}</strong>
        </div>
        <p className="description">{incident.description}</p>
        <div className="action-row">
          <button className="primary" onClick={() => setIncidentStatus("Assigned")}>Dispatch</button>
          <button className="secondary" onClick={() => setIncidentStatus("Monitoring")}>Update</button>
          <button className="ghost" onClick={() => setIncidentStatus("Resolved")}>Close</button>
        </div>
      </section>
      <section className="incident-card">
        <div className="section-head">
          <h3>Public Alert Draft</h3>
          <span className={`pill ${alertDraft.status === "Ready" ? "high" : "medium"}`}>{alertDraft.status}</span>
        </div>
        <textarea value={alertDraft.body} onChange={(event) => setAlertDraft({ ...alertDraft, body: event.target.value, status: "Draft" })} />
        <div className="action-row">
          <button className="primary" onClick={() => setAlertDraft({ ...alertDraft, status: "Broadcasting" })}>Broadcast</button>
          <button className="secondary" onClick={() => setAlertDraft({ ...alertDraft, status: "Ready" })}>Mark Ready</button>
        </div>
      </section>
      <section className="incident-card sop-card">
        <div className="section-head"><h3>Incident Response SOP</h3><input placeholder="Search SOPs" /></div>
        {sopSteps.map((step) => (
          <button key={step.id} className={step.complete ? "sop-step complete" : "sop-step"} onClick={() => toggleSop(step.id)}>
            <span>{step.complete ? "✓" : "!"}</span>
            <b>{step.label}</b>
            <em>{step.owner}</em>
          </button>
        ))}
      </section>
    </aside>
  );
}

function TimelinePanel() {
  return (
    <section className="bottom-panel">
      <div className="section-head"><h3>Operational Timeline</h3><select><option>All Events</option></select></div>
      <div className="timeline">
        {timeline.map((item) => (
          <div key={`${item.time}-${item.label}`} className={`timeline-row ${item.tone}`}>
            <time>{item.time}</time>
            <span>{item.label}</span>
            <b>{item.tone}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function DispatchQueue({ crews, escalateCrew }: { crews: Crew[]; escalateCrew: (id: string) => void }) {
  return (
    <section className="bottom-panel">
      <div className="section-head"><h3>Dispatch / Response Queue</h3><button>View All Incidents -&gt;</button></div>
      <table>
        <thead>
          <tr><th>Priority</th><th>Incident</th><th>Location</th><th>Assigned To</th><th>ETA</th></tr>
        </thead>
        <tbody>
          {seedIncidents.slice(0, 5).map((incident, index) => (
            <tr key={incident.id}>
              <td><button className={`priority ${severityClass(incident.severity)}`} onClick={() => escalateCrew(crews[index % crews.length].id)}>{incident.severity}</button></td>
              <td>{incident.title}</td>
              <td>{incident.location}</td>
              <td>{crews[index % crews.length].name}</td>
              <td>{incident.eta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [region, setRegion] = useState("All Regions");
  const [selectedId, setSelectedId] = useState(seedIncidents[0].id);
  const [incidents, setIncidents] = useState(seedIncidents);
  const [crews, setCrews] = useState(seedCrews);
  const [sopSteps, setSopSteps] = useState(seedSopSteps);
  const [alertDraft, setAlertDraft] = useState(alertDrafts[0]);
  const [livePulse, setLivePulse] = useState(0);
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    flood: true,
    closures: true,
    incidents: true,
    sensors: true,
    crews: true,
    radar: false,
    cctv: false,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLivePulse((value) => (value + 1) % 8);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedId) ?? incidents[0],
    [incidents, selectedId],
  );

  function setIncidentStatus(status: IncidentStatus) {
    setIncidents((current) => current.map((incident) => (incident.id === selectedId ? { ...incident, status } : incident)));
  }

  function toggleLayer(layer: LayerKey) {
    setActiveLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function toggleSop(id: string) {
    setSopSteps((current) => current.map((step) => (step.id === id ? { ...step, complete: !step.complete } : step)));
  }

  function escalateCrew(id: string) {
    setCrews((current) => current.map((crew) => (crew.id === id ? { ...crew, status: "Dispatched", priority: "High" } : crew)));
  }

  return (
    <div className="app-shell">
      <TopBar region={region} setRegion={setRegion} />
      <div className="workspace">
        <Sidebar active={activeNav} setActive={setActiveNav} />
        <main>
          <DashboardMetrics livePulse={livePulse} />
          <div className="command-grid">
            <div className="main-column">
              <OperationsMap selectedId={selectedId} setSelectedId={setSelectedId} activeLayers={activeLayers} toggleLayer={toggleLayer} />
              <div className="lower-grid">
                <TimelinePanel />
                <DispatchQueue crews={crews} escalateCrew={escalateCrew} />
              </div>
            </div>
            <IncidentInspector
              incident={selectedIncident}
              setIncidentStatus={setIncidentStatus}
              alertDraft={alertDraft}
              setAlertDraft={setAlertDraft}
              sopSteps={sopSteps}
              toggleSop={toggleSop}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
