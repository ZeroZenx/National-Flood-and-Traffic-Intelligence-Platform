import { useEffect, useMemo, useState } from "react";
import { ARCGIS_ITEM_URL, arcgisSourceSummary } from "./arcgis";
import { crews, floodZones, incidents, roadClosures, sensors } from "./data";
import type { Severity, TrafficIncident } from "./types";

type LayerKey = "flood" | "closures" | "incidents" | "sensors" | "crews" | "radar" | "cctv";
type Coordinate = [number, number];

interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon" | "LineString" | "MultiLineString";
    coordinates: any;
  } | null;
  properties?: Record<string, unknown>;
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

const viewBox = { width: 1000, height: 620 };
const extent = {
  xmin: -62.1088542918369,
  ymin: 9.932435394379246,
  xmax: -60.830157487264465,
  ymax: 10.970678951879687,
};

const countyGeoJsonUrl =
  "https://services1.arcgis.com/NUSHso3rgWERZOFF/arcgis/rest/services/TTO_Administrative_Boundaries/FeatureServer/6/query" +
  "?where=1%3D1&outFields=COUNTY&returnGeometry=true&outSR=4326&geometryPrecision=4&maxAllowableOffset=0.001&f=geojson";

const roadGeoJsonUrl =
  "https://services1.arcgis.com/NUSHso3rgWERZOFF/arcgis/rest/services/TTO_Roads_National_Security/FeatureServer/0/query" +
  "?where=Category%20in%20%28%27Highway%27%2C%27Primary%27%2C%27Secondary%27%29&outFields=FullName,Status,Category&returnGeometry=true&outSR=4326&resultRecordCount=600&geometryPrecision=4&maxAllowableOffset=0.001&f=geojson";

const incidentCoordinates: Record<string, Coordinate> = {
  "INC-2026-0614-0921": [-61.434, 10.59],
  "INC-2026-0614-0919": [-61.485, 10.635],
  "INC-2026-0614-0918": [-61.412, 10.642],
  "INC-2026-0614-0916": [-61.39, 10.628],
  "INC-2026-0614-0912": [-61.407, 10.55],
};

const sensorCoordinates: Record<string, Coordinate> = {
  "S-114": [-61.41, 10.52],
  "S-208": [-61.45, 10.59],
  "S-332": [-61.485, 10.635],
  "S-441": [-61.412, 10.642],
  "S-529": [-61.46, 10.28],
  "S-615": [-61.515, 10.665],
  "S-702": [-61.39, 10.628],
  "S-755": [-61.56, 10.72],
};

const floodCoordinates: Record<string, Coordinate> = {
  "fz-caroni": [-61.45, 10.59],
  "fz-bamboo": [-61.39, 10.628],
  "fz-curepe": [-61.412, 10.642],
  "fz-beetham": [-61.485, 10.635],
  "fz-sando": [-61.46, 10.28],
  "fz-diego": [-61.56, 10.72],
};

const closureCoordinates: Record<string, Coordinate> = {
  "RC-1": [-61.412, 10.642],
  "RC-2": [-61.434, 10.59],
  "RC-3": [-61.46, 10.28],
};

function project([longitude, latitude]: Coordinate) {
  const x = ((longitude - extent.xmin) / (extent.xmax - extent.xmin)) * viewBox.width;
  const y = (1 - (latitude - extent.ymin) / (extent.ymax - extent.ymin)) * viewBox.height;
  return { x, y };
}

function ringToPath(ring: Coordinate[]) {
  return ring
    .map((coordinate, index) => {
      const point = project(coordinate);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function polygonToPath(coordinates: Coordinate[][]) {
  return coordinates.map((ring) => `${ringToPath(ring)} Z`).join(" ");
}

function geometryToPath(feature: GeoJsonFeature) {
  if (!feature.geometry) return "";
  const { type, coordinates } = feature.geometry;

  if (type === "Polygon") {
    return polygonToPath(coordinates as Coordinate[][]);
  }

  if (type === "MultiPolygon") {
    return (coordinates as Coordinate[][][]).map((polygon) => polygonToPath(polygon)).join(" ");
  }

  if (type === "LineString") {
    return ringToPath(coordinates as Coordinate[]);
  }

  if (type === "MultiLineString") {
    return (coordinates as Coordinate[][]).map((line) => ringToPath(line)).join(" ");
  }

  return "";
}

function severityClass(severity: Severity) {
  return severity.toLowerCase();
}

function IncidentMarker({
  incident,
  selected,
  onSelect,
}: {
  incident: TrafficIncident;
  selected: boolean;
  onSelect: () => void;
}) {
  const coordinate = incidentCoordinates[incident.id];
  const point = project(coordinate);

  return (
    <button className="svg-button" onClick={onSelect} aria-label={incident.title}>
      <circle cx={point.x} cy={point.y} r={selected ? 18 : 14} className={`incident-dot ${severityClass(incident.severity)} ${selected ? "selected" : ""}`} />
      <text x={point.x} y={point.y + 5} className="incident-glyph">
        !
      </text>
    </button>
  );
}

export default function ArcGisWebMap({
  selectedId,
  setSelectedId,
  activeLayers,
}: {
  selectedId: string;
  setSelectedId: (id: string) => void;
  activeLayers: Record<LayerKey, boolean>;
}) {
  const [counties, setCounties] = useState<GeoJsonFeature[]>([]);
  const [roads, setRoads] = useState<GeoJsonFeature[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadArcGisData() {
      try {
        const [countyResponse, roadResponse] = await Promise.all([
          fetch(countyGeoJsonUrl),
          fetch(roadGeoJsonUrl),
        ]);

        if (!countyResponse.ok || !roadResponse.ok) {
          throw new Error("ArcGIS GeoJSON request failed");
        }

        const countyJson = (await countyResponse.json()) as GeoJsonCollection;
        const roadJson = (await roadResponse.json()) as GeoJsonCollection;

        if (!cancelled) {
          setCounties(countyJson.features ?? []);
          setRoads(roadJson.features ?? []);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    loadArcGisData();

    return () => {
      cancelled = true;
    };
  }, []);

  const placeLabels = useMemo(
    () => [
      { label: "Port of Spain", coordinate: [-61.515, 10.665] as Coordinate },
      { label: "Diego Martin", coordinate: [-61.56, 10.72] as Coordinate },
      { label: "Curepe", coordinate: [-61.412, 10.642] as Coordinate },
      { label: "Caroni", coordinate: [-61.45, 10.59] as Coordinate },
      { label: "Chaguanas", coordinate: [-61.407, 10.52] as Coordinate },
      { label: "Bamboo", coordinate: [-61.39, 10.628] as Coordinate },
      { label: "Beetham", coordinate: [-61.485, 10.635] as Coordinate },
      { label: "San Fernando", coordinate: [-61.46, 10.28] as Coordinate },
      { label: "Tobago", coordinate: [-60.7, 11.18] as Coordinate },
    ],
    [],
  );

  return (
    <div className="arcgis-map-shell">
      <svg className="arcgis-vector-map" viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="arcgisSea" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#073544" />
            <stop offset="0.58" stopColor="#0a5663" />
            <stop offset="1" stopColor="#09202b" />
          </linearGradient>
          <filter id="arcgisShadow">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#00141d" floodOpacity=".55" />
          </filter>
        </defs>
        <rect width={viewBox.width} height={viewBox.height} fill="url(#arcgisSea)" />
        {counties.map((feature, index) => (
          <path key={`county-${index}`} className="arcgis-county" d={geometryToPath(feature)} filter="url(#arcgisShadow)" />
        ))}
        {roads.map((feature, index) => (
          <path key={`road-${index}`} className={`arcgis-road ${String(feature.properties?.Category ?? "").toLowerCase()}`} d={geometryToPath(feature)} />
        ))}
        {activeLayers.radar ? <circle cx="486" cy="290" r="230" className="radar" /> : null}
        {activeLayers.flood
          ? floodZones.map((zone) => {
              const point = project(floodCoordinates[zone.id]);
              return <circle key={zone.id} cx={point.x} cy={point.y} r={zone.severity === "High" ? 54 : 38} className={`flood-zone ${severityClass(zone.severity)}`} />;
            })
          : null}
        {activeLayers.sensors
          ? sensors.map((sensor) => {
              const point = project(sensorCoordinates[sensor.id]);
              return <circle key={sensor.id} cx={point.x} cy={point.y} r="7" className={`sensor-dot ${sensor.status}`} />;
            })
          : null}
        {activeLayers.closures
          ? roadClosures.map((closure) => {
              const point = project(closureCoordinates[closure.id]);
              return <rect key={closure.id} x={point.x - 9} y={point.y - 9} width="18" height="18" rx="4" className={`closure-dot ${severityClass(closure.severity)}`} />;
            })
          : null}
        {activeLayers.incidents
          ? incidents.map((incident) => (
              <IncidentMarker key={incident.id} incident={incident} selected={selectedId === incident.id} onSelect={() => setSelectedId(incident.id)} />
            ))
          : null}
        {activeLayers.crews
          ? crews.slice(0, 4).map((crew, index) => {
              const coordinate = incidentCoordinates[incidents[index % incidents.length].id];
              const point = project([coordinate[0] + 0.025, coordinate[1] - 0.015]);
              return (
                <g key={crew.id}>
                  <rect x={point.x - 28} y={point.y - 12} width="56" height="24" className={`crew-map-badge ${severityClass(crew.priority)}`} />
                  <text x={point.x} y={point.y + 4} className="crew-map-label">
                    {crew.type}
                  </text>
                </g>
              );
            })
          : null}
        {placeLabels.map((place) => {
          const point = project(place.coordinate);
          return (
            <text key={place.label} x={point.x} y={point.y} className="map-label">
              {place.label}
            </text>
          );
        })}
      </svg>
      <div className="arcgis-source-card">
        <strong>{arcgisSourceSummary.title}</strong>
        <span>ArcGIS REST FeatureServer data • <a href={ARCGIS_ITEM_URL} target="_blank" rel="noreferrer">source map</a></span>
      </div>
      {status !== "ready" ? (
        <div className={`arcgis-status ${status}`}>
          <strong>{status === "error" ? "ArcGIS map data unavailable" : "Loading ArcGIS map data"}</strong>
          <span>{status === "error" ? "Check network access to arcgis.com and services1.arcgis.com." : "Pulling Trinidad boundaries and roads from public ArcGIS services."}</span>
        </div>
      ) : null}
      <div className="scale"><span />0 <b />5 <b />10 km</div>
    </div>
  );
}
