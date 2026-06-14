# National Flood and Traffic Intelligence Platform

A command-center MVP for Trinidad and Tobago flood, traffic, sensor, and emergency-response operations.

This first version is a polished React + Vite frontend that simulates live operational data for ODPM, MOWT, TTPS, municipal response teams, drainage crews, and traffic operators. It is designed as a credible pilot/demo surface: map-first, dense, operational, and ready to evolve into real API-backed services later.

## Current MVP

The application is a single-page command center with:

- National risk summary and flood forecast cards.
- Traffic incident, road closure, and delay metrics.
- Sensor health and uptime monitoring.
- Drainage crew priority indicators.
- A central SVG operations map with flood zones, road closures, incident markers, sensor dots, crew chips, and layer toggles.
- A right-side incident inspector with status updates, assignment details, public alert draft, and incident-response SOP checklist.
- Operational timeline and dispatch/response queue.
- Simulated live metric updates.
- Responsive desktop and mobile layouts.

The MVP intentionally uses local typed mock data instead of live integrations so the system can be reviewed immediately without API keys, GIS services, sensor feeds, or government data access.

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS modules via plain `src/styles.css`
- Code-native SVG map rendering
- Local mock data in TypeScript

No backend, database, authentication, or external map provider is included in this first build.

## Project Structure

```text
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src
    ├── App.tsx       # Main dashboard composition and interaction state
    ├── data.ts       # Simulated operational data
    ├── main.tsx      # React app bootstrap
    ├── styles.css    # Visual system, layout, map, and responsive styling
    └── types.ts      # Domain model interfaces and shared types
```

## Domain Model

The mock data layer is intentionally shaped like a future API contract. Core entities are defined in `src/types.ts`.

- `Sensor`: river, drain, rain, tide, and camera monitoring points with status, readings, trends, and map coordinates.
- `FloodZone`: flood-risk areas with severity, forecast timing, water-level notes, and map positions.
- `TrafficIncident`: active roadway incidents with type, status, severity, impact, source, assignment, ETA, and map position.
- `Crew`: drainage, police, fire, ambulance, and MOWT response units with status, priority, location, and ETA.
- `RoadClosure`: roadway restrictions or closures with severity and status.
- `AlertDraft`: public alert content for WhatsApp, radio, Waze, Google, or SMS-style channels.
- `SopStep`: operational response checklist items with owner and completion state.

This lets a future backend replace `src/data.ts` with API responses while keeping most UI components stable.

## Frontend Architecture

The dashboard is composed inside `src/App.tsx`.

Major UI subsystems:

- `TopBar`: command-center identity, time, weather, agency indicators, region selector, and operator avatar.
- `Sidebar`: operational navigation and active filter summary.
- `DashboardMetrics`: national risk, forecast, traffic, sensor, crew, alert, and WhatsApp summary cards.
- `OperationsMap`: code-native SVG map with interactive incident markers and toggleable operational layers.
- `IncidentInspector`: selected incident details, status controls, alert draft editor, and SOP checklist.
- `TimelinePanel`: recent operational events.
- `DispatchQueue`: priority queue for response assignments.

Application state is local React state. The key state areas are:

- Selected navigation item.
- Selected region.
- Selected incident.
- Incident status updates.
- Crew priority/status updates.
- SOP step completion.
- Public alert draft status/content.
- Layer visibility toggles.
- Simulated live metric pulse.

## Interaction Workflows

The MVP supports the main operator workflows expected in a first command-center demo:

1. Select an incident marker on the map.
2. Review incident metadata in the inspector.
3. Change the incident status to active, assigned, monitoring, or resolved.
4. Dispatch or update response handling.
5. Edit a public alert draft and mark it ready or broadcasting.
6. Toggle SOP checklist items as response steps are completed.
7. Toggle map layers for flood risk, road closures, traffic incidents, sensors, drainage crews, rainfall radar, and CCTV cameras.
8. Escalate crew priority through the response queue.

These are frontend-only interactions for now. They prove the workflow shape before real persistence and integrations are added.

## Map Strategy

The current map is rendered as SVG rather than using a third-party GIS provider.

This decision keeps the MVP:

- Fast to run locally.
- Free of API keys.
- Independent of map tile licensing.
- Easy to style to match the command-center design.
- Ready to replace later with Mapbox, ArcGIS, Leaflet, OpenLayers, or a government GIS service.

The map uses normalized `x/y` coordinates from the mock data. Future integrations should replace those with real latitude/longitude geometry.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Verification

The current build has been verified with:

```bash
npm run build
```

Browser screenshots were also captured for:

- Desktop viewport: `1440 x 900`
- Mobile viewport: `390 x 900`

The UI was compared against the approved command-center concept for:

- Map-first layout.
- Dense operational metrics.
- Left navigation.
- Right incident inspector.
- Dispatch queue and operational timeline.
- Public-sector color palette.
- Responsive header and mobile stacking.

## Known Limitations

This is an MVP/prototype, not a production emergency-management system yet.

Current limitations:

- Data is simulated and stored locally in TypeScript.
- No backend API.
- No database or persistence.
- No authentication, authorization, or agency roles.
- No real GIS tiles or geospatial routing.
- No sensor ingestion pipeline.
- No WhatsApp, Waze, Google Maps, SMS, radio, CCTV, or weather API integration.
- No audit log for operator actions.
- No automated test suite yet.
- npm currently reports dependency advisories; review with `npm audit` before production hardening.

## Production Engineering Roadmap

Recommended next engineering phases:

### Phase 1: Frontend Hardening

- Split `App.tsx` into feature components.
- Add component-level tests for incident selection, SOP toggles, alert drafting, and layer filtering.
- Add accessibility pass for keyboard navigation, focus states, and form labels.
- Add loading, empty, error, and offline states.
- Add persistent local storage for demo sessions.

### Phase 2: Backend Foundation

- Add an API service layer with endpoints for incidents, sensors, flood zones, crews, alerts, SOPs, and timeline events.
- Add a relational database for operational records.
- Add audit logging for every operator action.
- Add role-based access for ODPM, MOWT, TTPS, municipal corporations, and read-only executive users.

### Phase 3: GIS and Data Integration

- Replace the SVG mock map with real GIS rendering.
- Store real geometry for roads, flood zones, drainage assets, rivers, culverts, outfalls, pumps, and sensors.
- Integrate weather, rainfall, river-level, tide, and pump-station feeds.
- Add incident ingestion from field teams, CCTV analytics, traffic reports, and citizen reports.

### Phase 4: Operational Intelligence

- Add flood forecasting models for 30, 60, and 90-minute risk windows.
- Add drainage maintenance ranking by forecast rainfall, flood history, sensor state, asset criticality, and last-cleaned date.
- Add traffic incident prediction and diversion recommendations.
- Add crew dispatch optimization and escalation rules.

### Phase 5: Public Alerting

- Add approval workflows for public alerts.
- Integrate WhatsApp broadcast, SMS, email, web, radio partner feeds, Waze, and Google Maps closure updates.
- Add message templates by hazard, region, severity, and audience.
- Add delivery status and alert effectiveness tracking.

## Pilot Scope

The recommended first real-world pilot corridor is:

- Chaguanas to Port of Spain.
- Flood zones: Caroni, Bamboo, Curepe, Beetham.
- Highways: Uriah Butler Highway and Churchill Roosevelt Highway.

Initial success metrics:

- 30-minute earlier flood warnings.
- 25% faster accident clearance.
- 15% reduction in peak-hour delay.
- Better public alert timing.
- Better weekly drainage crew prioritization.

## Engineering Principle

The platform should not be framed as “AI solves flooding and traffic.”

The engineering goal is:

```text
AI + sensors + GIS + response teams + policy + engineering works
```

This MVP focuses on the shared operating picture: the place where flood intelligence, traffic operations, field crews, alerts, and agency coordination meet.
