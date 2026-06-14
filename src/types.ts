export type Severity = "High" | "Medium" | "Low";
export type IncidentStatus = "Active" | "Assigned" | "Monitoring" | "Resolved";
export type IncidentType = "Flooding" | "Road Closure" | "Crash" | "Landslip" | "Obstruction";

export interface MapPoint {
  x: number;
  y: number;
}

export interface Sensor {
  id: string;
  label: string;
  location: string;
  type: "river" | "drain" | "rain" | "tide" | "camera";
  status: "online" | "warning" | "offline";
  reading: string;
  trend: "rising" | "stable" | "falling";
  point: MapPoint;
}

export interface FloodZone {
  id: string;
  name: string;
  severity: Severity;
  forecastMinutes: number;
  waterLevel: string;
  point: MapPoint;
}

export interface TrafficIncident {
  id: string;
  title: string;
  location: string;
  road: string;
  nearby: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity;
  impact: Severity;
  reportedAt: string;
  eta: string;
  source: string;
  assignedTo: string;
  description: string;
  point: MapPoint;
}

export interface Crew {
  id: string;
  name: string;
  type: "Drainage" | "Police" | "Fire" | "Ambulance" | "MOWT";
  status: "Available" | "Dispatched" | "Staged" | "Returning";
  priority: Severity;
  location: string;
  eta: string;
}

export interface RoadClosure {
  id: string;
  road: string;
  location: string;
  severity: Severity;
  status: "Closed" | "Contraflow" | "Restricted";
  point: MapPoint;
}

export interface AlertDraft {
  id: string;
  channel: "WhatsApp" | "Radio" | "Waze" | "Google" | "SMS";
  status: "Draft" | "Ready" | "Broadcasting" | "Sent";
  audience: string;
  body: string;
}

export interface SopStep {
  id: string;
  label: string;
  owner: string;
  complete: boolean;
}
