import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent, WheelEvent } from "react";
import { ARCGIS_ITEM_URL, arcgisLayers, arcgisSourceSummary, buildArcGisQueryUrl } from "./arcgis";
import type { ArcGisBounds, ArcGisLayerConfig } from "./arcgis";
import { crews, floodZones, incidents, roadClosures, sensors } from "./data";
import type { Crew, FloodZone, RoadClosure, Sensor, Severity, TrafficIncident } from "./types";

type LayerKey = "flood" | "closures" | "incidents" | "sensors" | "crews" | "radar" | "cctv";
type Coordinate = [number, number];
type ToolMode = "select" | "pan" | "measure" | "draw";
type GeoJsonGeometryType = "Polygon" | "MultiPolygon" | "LineString" | "MultiLineString";

interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: GeoJsonGeometryType;
    coordinates: unknown;
  } | null;
  properties?: Record<string, unknown>;
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
  properties?: {
    exceededTransferLimit?: boolean;
  };
}

interface MapViewport {
  center: Coordinate;
  zoom: number;
  bounds: ArcGisBounds;
}

type SelectedFeature =
  | { type: "road"; title: string; subtitle: string; coordinate: Coordinate; properties: Record<string, unknown> }
  | { type: "boundary"; title: string; subtitle: string; coordinate: Coordinate; properties: Record<string, unknown> }
  | { type: "incident"; title: string; subtitle: string; coordinate: Coordinate; incident: TrafficIncident }
  | { type: "sensor"; title: string; subtitle: string; coordinate: Coordinate; sensor: Sensor }
  | { type: "crew"; title: string; subtitle: string; coordinate: Coordinate; crew: Crew }
  | { type: "closure"; title: string; subtitle: string; coordinate: Coordinate; closure: RoadClosure }
  | { type: "flood"; title: string; subtitle: string; coordinate: Coordinate; floodZone: FloodZone }
  | { type: "simulation"; title: string; subtitle: string; coordinate: Coordinate; details: string };

interface SearchResult {
  id: string;
  label: string;
  group: string;
  coordinate: Coordinate;
  zoom: number;
  select?: () => void;
}

const viewBox = { width: 1000, height: 620 };
const fullExtent = {
  xmin: -62.1088542918369,
  ymin: 9.932435394379246,
  xmax: -60.830157487264465,
  ymax: 10.970678951879687,
};
const fullCenter: Coordinate = [
  (fullExtent.xmin + fullExtent.xmax) / 2,
  (fullExtent.ymin + fullExtent.ymax) / 2,
];

const bookmarks = [
  { label: "Port of Spain", coordinate: [-61.515, 10.665] as Coordinate, zoom: 5.2 },
  { label: "Chaguanas", coordinate: [-61.407, 10.52] as Coordinate, zoom: 5.2 },
  { label: "Caroni", coordinate: [-61.45, 10.59] as Coordinate, zoom: 5.6 },
  { label: "Beetham", coordinate: [-61.485, 10.635] as Coordinate, zoom: 6 },
  { label: "Curepe", coordinate: [-61.412, 10.642] as Coordinate, zoom: 5.8 },
  { label: "Bamboo", coordinate: [-61.39, 10.628] as Coordinate, zoom: 5.8 },
  { label: "San Fernando", coordinate: [-61.46, 10.28] as Coordinate, zoom: 5.2 },
  { label: "Diego Martin", coordinate: [-61.56, 10.72] as Coordinate, zoom: 5.5 },
  { label: "Tobago", coordinate: [-60.7, 11.18] as Coordinate, zoom: 4.6 },
];

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

const simulatedDepthBands = [
  { id: "depth-caroni", label: "300 mm", severity: "High" as Severity, coordinates: [[-61.47, 10.58], [-61.45, 10.59], [-61.425, 10.59]] as Coordinate[] },
  { id: "depth-beetham", label: "180 mm", severity: "Medium" as Severity, coordinates: [[-61.505, 10.63], [-61.485, 10.635], [-61.455, 10.64]] as Coordinate[] },
  { id: "depth-sando", label: "90 mm", severity: "Low" as Severity, coordinates: [[-61.48, 10.29], [-61.46, 10.28], [-61.43, 10.30]] as Coordinate[] },
];

const simulatedDelayCorridors = [
  { id: "delay-ub", label: "+22 min", coordinates: [[-61.423, 10.60], [-61.414, 10.56], [-61.407, 10.52]] as Coordinate[] },
  { id: "delay-crh", label: "+18 min", coordinates: [[-61.515, 10.66], [-61.47, 10.645], [-61.412, 10.642]] as Coordinate[] },
];

const simulatedReports = [
  { id: "report-1", label: "Blocked culvert", coordinate: [-61.397, 10.615] as Coordinate, type: "culvert" },
  { id: "report-2", label: "WhatsApp report", coordinate: [-61.438, 10.566] as Coordinate, type: "citizen" },
  { id: "report-3", label: "CCTV online", coordinate: [-61.418, 10.64] as Coordinate, type: "cctv" },
  { id: "report-4", label: "CCTV degraded", coordinate: [-61.485, 10.633] as Coordinate, type: "cctv" },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function viewportBounds(center: Coordinate, zoom: number): ArcGisBounds {
  const fullWidth = fullExtent.xmax - fullExtent.xmin;
  const fullHeight = fullExtent.ymax - fullExtent.ymin;
  const width = fullWidth / zoom;
  const height = Math.min(fullHeight, width * (viewBox.height / viewBox.width));
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const boundedCenter: Coordinate = [
    clamp(center[0], fullExtent.xmin + halfWidth, fullExtent.xmax - halfWidth),
    clamp(center[1], fullExtent.ymin + halfHeight, fullExtent.ymax - halfHeight),
  ];

  return {
    xmin: boundedCenter[0] - halfWidth,
    xmax: boundedCenter[0] + halfWidth,
    ymin: boundedCenter[1] - halfHeight,
    ymax: boundedCenter[1] + halfHeight,
  };
}

function createViewport(center: Coordinate, zoom: number): MapViewport {
  const nextZoom = clamp(zoom, 1, 8);
  const bounds = viewportBounds(center, nextZoom);
  return {
    center: [(bounds.xmin + bounds.xmax) / 2, (bounds.ymin + bounds.ymax) / 2],
    zoom: nextZoom,
    bounds,
  };
}

function inBounds(coordinate: Coordinate, bounds: ArcGisBounds) {
  return coordinate[0] >= bounds.xmin && coordinate[0] <= bounds.xmax && coordinate[1] >= bounds.ymin && coordinate[1] <= bounds.ymax;
}

function project(coordinate: Coordinate, bounds: ArcGisBounds) {
  const x = ((coordinate[0] - bounds.xmin) / (bounds.xmax - bounds.xmin)) * viewBox.width;
  const y = (1 - (coordinate[1] - bounds.ymin) / (bounds.ymax - bounds.ymin)) * viewBox.height;
  return { x, y };
}

function screenToGeo(x: number, y: number, bounds: ArcGisBounds): Coordinate {
  return [
    bounds.xmin + (x / viewBox.width) * (bounds.xmax - bounds.xmin),
    bounds.ymax - (y / viewBox.height) * (bounds.ymax - bounds.ymin),
  ];
}

function ringToPath(ring: Coordinate[], bounds: ArcGisBounds) {
  return ring
    .map((coordinate, index) => {
      const point = project(coordinate, bounds);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    })
    .join(" ");
}

function lineToPath(line: Coordinate[], bounds: ArcGisBounds) {
  return ringToPath(line, bounds);
}

function polygonToPath(coordinates: Coordinate[][], bounds: ArcGisBounds) {
  return coordinates.map((ring) => `${ringToPath(ring, bounds)} Z`).join(" ");
}

function geometryToPath(feature: GeoJsonFeature, bounds: ArcGisBounds) {
  if (!feature.geometry) return "";
  const { type, coordinates } = feature.geometry;

  if (type === "Polygon") return polygonToPath(coordinates as Coordinate[][], bounds);
  if (type === "MultiPolygon") return (coordinates as Coordinate[][][]).map((polygon) => polygonToPath(polygon, bounds)).join(" ");
  if (type === "LineString") return lineToPath(coordinates as Coordinate[], bounds);
  if (type === "MultiLineString") return (coordinates as Coordinate[][]).map((line) => lineToPath(line, bounds)).join(" ");

  return "";
}

function firstCoordinate(feature: GeoJsonFeature): Coordinate {
  const geometry = feature.geometry;
  if (!geometry) return fullCenter;
  const coordinates = geometry.coordinates as unknown[];

  if (geometry.type === "LineString") return (coordinates as Coordinate[])[Math.floor((coordinates as Coordinate[]).length / 2)] ?? fullCenter;
  if (geometry.type === "MultiLineString") {
    const line = (coordinates as Coordinate[][])[0] ?? [];
    return line[Math.floor(line.length / 2)] ?? fullCenter;
  }
  if (geometry.type === "Polygon") return ((coordinates as Coordinate[][])[0] ?? [])[0] ?? fullCenter;
  if (geometry.type === "MultiPolygon") return (((coordinates as Coordinate[][][])[0] ?? [])[0] ?? [])[0] ?? fullCenter;

  return fullCenter;
}

function severityClass(severity: Severity) {
  return severity.toLowerCase();
}

function featureTitle(feature: GeoJsonFeature, fallback: string) {
  const props = feature.properties ?? {};
  return String(props.FullName ?? props.NAME ?? props.COMM_NAME ?? props.COMMUNITY ?? props.COUNTY ?? props.FEATURENAM ?? fallback);
}

async function queryLayer(layer: ArcGisLayerConfig, bounds: ArcGisBounds) {
  const response = await fetch(buildArcGisQueryUrl(layer, bounds));
  if (!response.ok) throw new Error(`ArcGIS query failed: ${layer.title}`);
  const json = (await response.json()) as GeoJsonCollection;
  return json.features ?? [];
}

function IncidentMarker({
  incident,
  selected,
  bounds,
  onSelect,
}: {
  incident: TrafficIncident;
  selected: boolean;
  bounds: ArcGisBounds;
  onSelect: () => void;
}) {
  const coordinate = incidentCoordinates[incident.id];
  const point = project(coordinate, bounds);

  return (
    <button className="svg-button" onClick={(event) => { event.stopPropagation(); onSelect(); }} aria-label={incident.title}>
      <circle cx={point.x} cy={point.y} r={selected ? 18 : 14} className={`incident-dot ${severityClass(incident.severity)} ${selected ? "selected" : ""}`} />
      <text x={point.x} y={point.y + 5} className="incident-glyph">!</text>
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; center: Coordinate; moved: boolean } | null>(null);
  const [viewport, setViewport] = useState(() => createViewport(fullCenter, 1));
  const [counties, setCounties] = useState<GeoJsonFeature[]>([]);
  const [wards, setWards] = useState<GeoJsonFeature[]>([]);
  const [communities, setCommunities] = useState<GeoJsonFeature[]>([]);
  const [roads, setRoads] = useState<GeoJsonFeature[]>([]);
  const [parcels, setParcels] = useState<GeoJsonFeature[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [query, setQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [layerOpacity, setLayerOpacity] = useState({ base: 0.78, roads: 0.9, operations: 0.92 });
  const [lastRefresh, setLastRefresh] = useState("--");

  const activeLayerCount = Object.values(activeLayers).filter(Boolean).length;
  const visibleIncidents = incidents.filter((incident) => inBounds(incidentCoordinates[incident.id], viewport.bounds));
  const visibleSensors = sensors.filter((sensor) => inBounds(sensorCoordinates[sensor.id], viewport.bounds));
  const visibleFloodZones = floodZones.filter((zone) => inBounds(floodCoordinates[zone.id], viewport.bounds));

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const activeQueries: Promise<GeoJsonFeature[]>[] = [queryLayer(arcgisLayers.counties, viewport.bounds), queryLayer(arcgisLayers.roads, viewport.bounds)];
        const slots: ArcGisLayerConfig["id"][] = ["counties", "roads"];

        if (viewport.zoom >= arcgisLayers.wards.minZoom) {
          activeQueries.push(queryLayer(arcgisLayers.wards, viewport.bounds));
          slots.push("wards");
        }
        if (viewport.zoom >= arcgisLayers.communities.minZoom) {
          activeQueries.push(queryLayer(arcgisLayers.communities, viewport.bounds));
          slots.push("communities");
        }
        if (viewport.zoom >= arcgisLayers.parcels.minZoom) {
          activeQueries.push(queryLayer(arcgisLayers.parcels, viewport.bounds));
          slots.push("parcels");
        }

        const results = await Promise.all(activeQueries);
        if (cancelled) return;

        slots.forEach((slot, index) => {
          if (slot === "counties") setCounties(results[index]);
          if (slot === "roads") setRoads(results[index]);
          if (slot === "wards") setWards(results[index]);
          if (slot === "communities") setCommunities(results[index]);
          if (slot === "parcels") setParcels(results[index]);
        });
        if (!slots.includes("wards")) setWards([]);
        if (!slots.includes("communities")) setCommunities([]);
        if (!slots.includes("parcels")) setParcels([]);
        setLastRefresh(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [viewport.bounds, viewport.zoom]);

  const setMapView = useCallback((coordinate: Coordinate, zoom = viewport.zoom) => {
    setViewport(createViewport(coordinate, zoom));
  }, [viewport.zoom]);

  const zoomBy = useCallback((factor: number, anchor?: { x: number; y: number }) => {
    setViewport((current) => {
      const nextZoom = clamp(current.zoom * factor, 1, 8);
      if (!anchor) return createViewport(current.center, nextZoom);

      const before = screenToGeo(anchor.x, anchor.y, current.bounds);
      const provisional = createViewport(current.center, nextZoom);
      const after = screenToGeo(anchor.x, anchor.y, provisional.bounds);
      return createViewport([provisional.center[0] + before[0] - after[0], provisional.center[1] + before[1] - after[1]], nextZoom);
    });
  }, []);

  const resetView = useCallback(() => {
    setSelectedFeature(null);
    setViewport(createViewport(fullCenter, 1));
  }, []);

  const fitSelectedIncident = useCallback(() => {
    const coordinate = incidentCoordinates[selectedId];
    if (coordinate) setMapView(coordinate, 6.4);
  }, [selectedId, setMapView]);

  const mapPointFromEvent = (event: MouseEvent<SVGSVGElement> | PointerEvent<SVGSVGElement> | WheelEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: viewBox.width / 2, y: viewBox.height / 2 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * viewBox.width,
      y: ((event.clientY - rect.top) / rect.height) * viewBox.height,
    };
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const point = mapPointFromEvent(event);
    dragRef.current = { x: point.x, y: point.y, center: viewport.center, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const point = mapPointFromEvent(event);
    const dx = point.x - dragRef.current.x;
    const dy = point.y - dragRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
    const lonDelta = (dx / viewBox.width) * (viewport.bounds.xmax - viewport.bounds.xmin);
    const latDelta = (dy / viewBox.height) * (viewport.bounds.ymax - viewport.bounds.ymin);
    setViewport(createViewport([dragRef.current.center[0] - lonDelta, dragRef.current.center[1] + latDelta], viewport.zoom));
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (dragRef.current && !dragRef.current.moved && (activeTool === "measure" || activeTool === "draw")) {
      const point = mapPointFromEvent(event);
      const coordinate = screenToGeo(point.x, point.y, viewport.bounds);
      setSelectedFeature({
        type: "simulation",
        title: activeTool === "measure" ? "Measurement point" : "Draft response area",
        subtitle: `${coordinate[1].toFixed(4)}, ${coordinate[0].toFixed(4)}`,
        coordinate,
        details: activeTool === "measure" ? "Simulated measure tool: use this as a future distance/profile anchor." : "Simulated draw tool: use this as a future polygon dispatch area.",
      });
    }
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.25 : 0.8, mapPointFromEvent(event));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "+" || event.key === "=") zoomBy(1.25);
    if (event.key === "-") zoomBy(0.8);
    if (event.key === "Escape") setSelectedFeature(null);
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const lonStep = (viewport.bounds.xmax - viewport.bounds.xmin) * 0.12;
      const latStep = (viewport.bounds.ymax - viewport.bounds.ymin) * 0.12;
      const lon = event.key === "ArrowLeft" ? -lonStep : event.key === "ArrowRight" ? lonStep : 0;
      const lat = event.key === "ArrowUp" ? latStep : event.key === "ArrowDown" ? -latStep : 0;
      setMapView([viewport.center[0] + lon, viewport.center[1] + lat]);
    }
  };

  const searchResults = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const results: SearchResult[] = [];
    bookmarks.forEach((bookmark) => {
      if (bookmark.label.toLowerCase().includes(normalized)) results.push({ id: `bookmark-${bookmark.label}`, label: bookmark.label, group: "Bookmark", coordinate: bookmark.coordinate, zoom: bookmark.zoom });
    });
    incidents.forEach((incident) => {
      const haystack = `${incident.id} ${incident.title} ${incident.location} ${incident.road}`.toLowerCase();
      if (haystack.includes(normalized)) {
        results.push({ id: incident.id, label: incident.title, group: "Incident", coordinate: incidentCoordinates[incident.id], zoom: 6.4, select: () => setSelectedId(incident.id) });
      }
    });
    sensors.forEach((sensor) => {
      const haystack = `${sensor.id} ${sensor.label} ${sensor.location}`.toLowerCase();
      if (haystack.includes(normalized)) results.push({ id: sensor.id, label: sensor.label, group: "Sensor", coordinate: sensorCoordinates[sensor.id], zoom: 6 });
    });
    floodZones.forEach((zone) => {
      if (`${zone.name} flood`.toLowerCase().includes(normalized)) results.push({ id: zone.id, label: `${zone.name} flood zone`, group: "Flood Risk", coordinate: floodCoordinates[zone.id], zoom: 6 });
    });
    roads.slice(0, 40).forEach((road, index) => {
      const label = featureTitle(road, "Unnamed road");
      if (label.toLowerCase().includes(normalized)) results.push({ id: `road-${index}`, label, group: "Road", coordinate: firstCoordinate(road), zoom: Math.max(5.8, viewport.zoom) });
    });

    return results.slice(0, 8);
  }, [query, roads, setSelectedId, viewport.zoom]);

  const levelLabel = viewport.zoom < 2.2 ? "National" : viewport.zoom < 4.8 ? "Regional" : "Street";

  return (
    <div className="arcgis-map-shell" tabIndex={0} onKeyDown={handleKeyDown}>
      <svg
        ref={svgRef}
        className={`arcgis-vector-map ${activeTool === "pan" ? "pan-mode" : ""}`}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
        onDoubleClick={(event) => zoomBy(1.45, mapPointFromEvent(event))}
        onWheel={handleWheel}
      >
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
        <g opacity={layerOpacity.base}>
          {counties.map((feature, index) => (
            <path
              key={`county-${index}`}
              className="arcgis-county"
              d={geometryToPath(feature, viewport.bounds)}
              filter="url(#arcgisShadow)"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedFeature({ type: "boundary", title: featureTitle(feature, "County"), subtitle: "County boundary", coordinate: firstCoordinate(feature), properties: feature.properties ?? {} });
              }}
            />
          ))}
          {viewport.zoom >= arcgisLayers.wards.minZoom ? wards.map((feature, index) => (
            <path
              key={`ward-${index}`}
              className="arcgis-ward"
              d={geometryToPath(feature, viewport.bounds)}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedFeature({ type: "boundary", title: featureTitle(feature, "Ward"), subtitle: "Ward boundary", coordinate: firstCoordinate(feature), properties: feature.properties ?? {} });
              }}
            />
          )) : null}
          {viewport.zoom >= arcgisLayers.communities.minZoom ? communities.map((feature, index) => (
            <path
              key={`community-${index}`}
              className="arcgis-community"
              d={geometryToPath(feature, viewport.bounds)}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedFeature({ type: "boundary", title: featureTitle(feature, "Community"), subtitle: "Community / locality", coordinate: firstCoordinate(feature), properties: feature.properties ?? {} });
              }}
            />
          )) : null}
          {viewport.zoom >= arcgisLayers.parcels.minZoom ? parcels.map((feature, index) => (
            <path key={`parcel-${index}`} className="arcgis-parcel" d={geometryToPath(feature, viewport.bounds)} />
          )) : null}
        </g>
        <g opacity={layerOpacity.roads}>
          {roads.map((feature, index) => {
            const title = featureTitle(feature, "Unnamed road");
            return (
              <path
                key={`road-${index}`}
                className={`arcgis-road ${String(feature.properties?.Category ?? "").toLowerCase()}`}
                d={geometryToPath(feature, viewport.bounds)}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedFeature({ type: "road", title, subtitle: `${String(feature.properties?.Category ?? "Road")} • ${String(feature.properties?.Status ?? "Status unknown")}`, coordinate: firstCoordinate(feature), properties: feature.properties ?? {} });
                }}
              />
            );
          })}
        </g>
        {activeLayers.radar ? <circle cx="486" cy="290" r={230 * Math.min(1.4, viewport.zoom / 1.5)} className="radar" /> : null}
        <g opacity={layerOpacity.operations}>
          {simulatedDepthBands.map((band) => <path key={band.id} d={lineToPath(band.coordinates, viewport.bounds)} className={`water-depth-band ${severityClass(band.severity)}`} />)}
          {simulatedDelayCorridors.map((corridor) => <path key={corridor.id} d={lineToPath(corridor.coordinates, viewport.bounds)} className="traffic-delay-corridor" />)}
          {activeLayers.flood ? visibleFloodZones.map((zone) => {
            const point = project(floodCoordinates[zone.id], viewport.bounds);
            return <circle key={zone.id} cx={point.x} cy={point.y} r={clamp(60 / viewport.zoom, 18, 54)} className={`flood-zone ${severityClass(zone.severity)}`} onClick={(event) => { event.stopPropagation(); setSelectedFeature({ type: "flood", title: `${zone.name} flood risk`, subtitle: `${zone.severity} • peak in ${zone.forecastMinutes} min`, coordinate: floodCoordinates[zone.id], floodZone: zone }); }} />;
          }) : null}
          {activeLayers.sensors ? visibleSensors.map((sensor) => {
            const point = project(sensorCoordinates[sensor.id], viewport.bounds);
            return <circle key={sensor.id} cx={point.x} cy={point.y} r="7" className={`sensor-dot ${sensor.status}`} onClick={(event) => { event.stopPropagation(); setSelectedFeature({ type: "sensor", title: sensor.label, subtitle: `${sensor.location} • ${sensor.reading}`, coordinate: sensorCoordinates[sensor.id], sensor }); }} />;
          }) : null}
          {activeLayers.closures ? roadClosures.filter((closure) => inBounds(closureCoordinates[closure.id], viewport.bounds)).map((closure) => {
            const point = project(closureCoordinates[closure.id], viewport.bounds);
            return <rect key={closure.id} x={point.x - 9} y={point.y - 9} width="18" height="18" rx="4" className={`closure-dot ${severityClass(closure.severity)}`} onClick={(event) => { event.stopPropagation(); setSelectedFeature({ type: "closure", title: closure.road, subtitle: `${closure.status} • ${closure.location}`, coordinate: closureCoordinates[closure.id], closure }); }} />;
          }) : null}
          {activeLayers.incidents ? visibleIncidents.map((incident) => (
            <IncidentMarker
              key={incident.id}
              incident={incident}
              selected={selectedId === incident.id}
              bounds={viewport.bounds}
              onSelect={() => {
                setSelectedId(incident.id);
                setSelectedFeature({ type: "incident", title: incident.title, subtitle: `${incident.status} • ${incident.location}`, coordinate: incidentCoordinates[incident.id], incident });
              }}
            />
          )) : null}
          {activeLayers.crews ? crews.slice(0, 4).map((crew, index) => {
            const base = incidentCoordinates[incidents[index % incidents.length].id];
            const coordinate: Coordinate = [base[0] + 0.025, base[1] - 0.015];
            if (!inBounds(coordinate, viewport.bounds)) return null;
            const point = project(coordinate, viewport.bounds);
            return (
              <g key={crew.id} onClick={(event) => { event.stopPropagation(); setSelectedFeature({ type: "crew", title: crew.name, subtitle: `${crew.status} • ETA ${crew.eta}`, coordinate, crew }); }}>
                <rect x={point.x - 28} y={point.y - 12} width="56" height="24" className={`crew-map-badge ${severityClass(crew.priority)}`} />
                <text x={point.x} y={point.y + 4} className="crew-map-label">{crew.type}</text>
              </g>
            );
          }) : null}
          {(activeLayers.cctv || activeLayers.radar) ? simulatedReports.filter((report) => inBounds(report.coordinate, viewport.bounds)).map((report) => {
            const point = project(report.coordinate, viewport.bounds);
            return (
              <g key={report.id} onClick={(event) => { event.stopPropagation(); setSelectedFeature({ type: "simulation", title: report.label, subtitle: report.type === "cctv" ? "Camera simulation" : "Field intelligence simulation", coordinate: report.coordinate, details: "Simulated granular report for command-center usability before live feeds are deployed." }); }}>
                <circle cx={point.x} cy={point.y} r="9" className={`report-dot ${report.type}`} />
                {viewport.zoom >= 4 ? <text x={point.x + 12} y={point.y + 4} className="report-label">{report.label}</text> : null}
              </g>
            );
          }) : null}
        </g>
        {bookmarks.filter((place) => inBounds(place.coordinate, viewport.bounds)).map((place) => {
          const point = project(place.coordinate, viewport.bounds);
          return <text key={place.label} x={point.x} y={point.y} className="map-label">{place.label}</text>;
        })}
        {viewport.zoom >= 4.8 ? roads.slice(0, 35).map((feature, index) => {
          const label = featureTitle(feature, "");
          if (!label) return null;
          const point = project(firstCoordinate(feature), viewport.bounds);
          return <text key={`road-label-${index}`} x={point.x} y={point.y} className="road-label">{label}</text>;
        }) : null}
      </svg>

      <div className="arcgis-source-card">
        <strong>{arcgisSourceSummary.title}</strong>
        <span>ArcGIS REST FeatureServer data • <a href={ARCGIS_ITEM_URL} target="_blank" rel="noreferrer">source map</a></span>
      </div>

      <div className="map-tool-strip" aria-label="Map tools">
        {(["select", "pan", "measure", "draw"] as ToolMode[]).map((tool) => (
          <button key={tool} className={activeTool === tool ? "active" : ""} onClick={() => setActiveTool(tool)} title={tool}>
            {tool === "select" ? "↖" : tool === "pan" ? "✥" : tool === "measure" ? "↔" : "▱"}
          </button>
        ))}
        <button onClick={() => zoomBy(1.25)} title="Zoom in">+</button>
        <button onClick={() => zoomBy(0.8)} title="Zoom out">−</button>
        <button onClick={resetView} title="Reset view">⌂</button>
        <button onClick={fitSelectedIncident} title="Fit selected incident">◎</button>
      </div>

      <div className="map-search-card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search road, place, incident, sensor" />
        {searchResults.length ? (
          <div className="map-search-results">
            {searchResults.map((result) => (
              <button key={result.id} onClick={() => { result.select?.(); setMapView(result.coordinate, result.zoom); setQuery(""); }}>
                <span>{result.group}</span>
                <strong>{result.label}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bookmark-rail">
        {bookmarks.slice(0, 6).map((bookmark) => (
          <button key={bookmark.label} onClick={() => setMapView(bookmark.coordinate, bookmark.zoom)}>{bookmark.label}</button>
        ))}
      </div>

      <div className="map-opacity-panel">
        <label>Base <input type="range" min="0.35" max="1" step="0.05" value={layerOpacity.base} onChange={(event) => setLayerOpacity((current) => ({ ...current, base: Number(event.target.value) }))} /></label>
        <label>Roads <input type="range" min="0.35" max="1" step="0.05" value={layerOpacity.roads} onChange={(event) => setLayerOpacity((current) => ({ ...current, roads: Number(event.target.value) }))} /></label>
        <label>Ops <input type="range" min="0.35" max="1" step="0.05" value={layerOpacity.operations} onChange={(event) => setLayerOpacity((current) => ({ ...current, operations: Number(event.target.value) }))} /></label>
      </div>

      {selectedFeature ? (
        <div className="map-feature-popover" style={{ left: `${project(selectedFeature.coordinate, viewport.bounds).x}px`, top: `${project(selectedFeature.coordinate, viewport.bounds).y}px` }}>
          <button className="popover-close" onClick={() => setSelectedFeature(null)}>×</button>
          <strong>{selectedFeature.title}</strong>
          <span>{selectedFeature.subtitle}</span>
          {"properties" in selectedFeature ? (
            <dl>
              {Object.entries(selectedFeature.properties).slice(0, 4).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? "—")}</dd></div>)}
            </dl>
          ) : null}
          {"details" in selectedFeature ? <p>{selectedFeature.details}</p> : null}
        </div>
      ) : null}

      {status !== "ready" ? (
        <div className={`arcgis-status ${status}`}>
          <strong>{status === "error" ? "ArcGIS map data unavailable" : "Loading ArcGIS map data"}</strong>
          <span>{status === "error" ? "Check network access to arcgis.com and services1.arcgis.com." : "Querying current map extent from public ArcGIS services."}</span>
        </div>
      ) : null}

      <div className="map-status-bar">
        <span>{levelLabel} zoom {viewport.zoom.toFixed(1)}x</span>
        <span>{counties.length + wards.length + communities.length + roads.length + parcels.length} ArcGIS features</span>
        <span>{activeLayerCount} active layers</span>
        <span>Updated {lastRefresh}</span>
      </div>
      <div className="scale"><span />0 <b />5 <b />10 km</div>
    </div>
  );
}
