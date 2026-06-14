import type { AlertDraft, Crew, FloodZone, RoadClosure, Sensor, SopStep, TrafficIncident } from "./types";

export const floodZones: FloodZone[] = [
  { id: "fz-caroni", name: "Caroni", severity: "High", forecastMinutes: 38, waterLevel: "0.42 m below road", point: { x: 37, y: 48 } },
  { id: "fz-bamboo", name: "Bamboo", severity: "High", forecastMinutes: 51, waterLevel: "Rising fast", point: { x: 67, y: 50 } },
  { id: "fz-curepe", name: "Curepe", severity: "Medium", forecastMinutes: 64, waterLevel: "Drain capacity 81%", point: { x: 50, y: 33 } },
  { id: "fz-beetham", name: "Beetham", severity: "High", forecastMinutes: 29, waterLevel: "Road edge pooling", point: { x: 49, y: 64 } },
  { id: "fz-sando", name: "San Fernando", severity: "Medium", forecastMinutes: 86, waterLevel: "Localized ponding", point: { x: 37, y: 76 } },
  { id: "fz-diego", name: "Diego Martin", severity: "Medium", forecastMinutes: 72, waterLevel: "Hill runoff increasing", point: { x: 35, y: 21 } },
];

export const sensors: Sensor[] = [
  { id: "S-114", label: "CHG-120 Rain Gauge", location: "Chaguanas", type: "rain", status: "online", reading: "31 mm/hr", trend: "rising", point: { x: 46, y: 52 } },
  { id: "S-208", label: "Caroni River Level", location: "Caroni", type: "river", status: "warning", reading: "2.8 m", trend: "rising", point: { x: 39, y: 45 } },
  { id: "S-332", label: "Beetham Drain 3", location: "Beetham", type: "drain", status: "warning", reading: "91%", trend: "rising", point: { x: 51, y: 62 } },
  { id: "S-441", label: "Curepe CCTV", location: "Curepe", type: "camera", status: "online", reading: "Clear", trend: "stable", point: { x: 53, y: 32 } },
  { id: "S-529", label: "San Fernando Pump", location: "San Fernando", type: "drain", status: "online", reading: "Active", trend: "stable", point: { x: 36, y: 79 } },
  { id: "S-615", label: "POS Tide Outfall", location: "Port of Spain", type: "tide", status: "online", reading: "+0.6 m", trend: "rising", point: { x: 38, y: 29 } },
  { id: "S-702", label: "Bamboo Culvert", location: "Bamboo", type: "drain", status: "offline", reading: "No signal", trend: "stable", point: { x: 68, y: 50 } },
  { id: "S-755", label: "Diego Martin Drain", location: "Diego Martin", type: "drain", status: "online", reading: "68%", trend: "rising", point: { x: 34, y: 22 } },
];

export const incidents: TrafficIncident[] = [
  {
    id: "INC-2026-0614-0921",
    title: "Flooding - Caroni Savannah Rd",
    location: "Caroni, Chaguanas",
    road: "Caroni Savannah Rd",
    nearby: "Caroni Central, Chaguanas",
    type: "Flooding",
    status: "Active",
    severity: "High",
    impact: "High",
    reportedAt: "09:21 AST",
    eta: "09:28",
    source: "TTPS Patrol Unit 3",
    assignedTo: "Chaguanas North Crew",
    description: "Heavy rainfall causing roadway flooding. Water depth estimated at 300 mm and rising.",
    point: { x: 43, y: 48 },
  },
  {
    id: "INC-2026-0614-0919",
    title: "Flooding - Beetham Main Rd",
    location: "Beetham",
    road: "Beetham Main Rd",
    nearby: "East Port of Spain",
    type: "Flooding",
    status: "Assigned",
    severity: "High",
    impact: "High",
    reportedAt: "09:19 AST",
    eta: "09:35",
    source: "ODPM Sensor Fusion",
    assignedTo: "San Fernando Crew",
    description: "Surface flooding affecting westbound access. Route guidance recommends Churchill Roosevelt diversion.",
    point: { x: 49, y: 63 },
  },
  {
    id: "INC-2026-0614-0918",
    title: "Road closure - Churchill Roosevelt Hwy",
    location: "Curepe",
    road: "Churchill Roosevelt Hwy",
    nearby: "Curepe interchange",
    type: "Road Closure",
    status: "Monitoring",
    severity: "Medium",
    impact: "Medium",
    reportedAt: "09:18 AST",
    eta: "09:40",
    source: "MOWT Traffic Centre",
    assignedTo: "TTPS Patrol Unit 5",
    description: "Two eastbound lanes restricted due to rising water and stranded vehicle.",
    point: { x: 54, y: 36 },
  },
  {
    id: "INC-2026-0614-0916",
    title: "Landslip - Bamboo Rd",
    location: "Bamboo",
    road: "Bamboo Main Rd",
    nearby: "Valsayn South",
    type: "Landslip",
    status: "Active",
    severity: "Medium",
    impact: "Medium",
    reportedAt: "09:16 AST",
    eta: "09:50",
    source: "Citizen WhatsApp Report",
    assignedTo: "MOWT Team 2",
    description: "Mud and debris blocking one lane. Culvert inspection requested before reopening.",
    point: { x: 68, y: 51 },
  },
  {
    id: "INC-2026-0614-0912",
    title: "Crash - Uriah Butler Hwy",
    location: "Chaguanas",
    road: "Uriah Butler Hwy",
    nearby: "Grand Bazaar approach",
    type: "Crash",
    status: "Assigned",
    severity: "High",
    impact: "High",
    reportedAt: "09:12 AST",
    eta: "09:23",
    source: "Camera Analytics",
    assignedTo: "Ambulance 4 / TTPS 7",
    description: "Two-vehicle crash creating queue spillback. Tow contractor notified.",
    point: { x: 46, y: 55 },
  },
];

export const roadClosures: RoadClosure[] = [
  { id: "RC-1", road: "Churchill Roosevelt Hwy", location: "Curepe", severity: "Medium", status: "Restricted", point: { x: 55, y: 36 } },
  { id: "RC-2", road: "Caroni Savannah Rd", location: "Caroni", severity: "High", status: "Closed", point: { x: 43, y: 48 } },
  { id: "RC-3", road: "Southern Main Rd", location: "San Fernando", severity: "Low", status: "Contraflow", point: { x: 38, y: 77 } },
];

export const crews: Crew[] = [
  { id: "CR-1", name: "Chaguanas North Crew", type: "Drainage", status: "Dispatched", priority: "High", location: "Caroni", eta: "09:28" },
  { id: "CR-2", name: "San Fernando Crew", type: "Drainage", status: "Dispatched", priority: "High", location: "Beetham", eta: "09:35" },
  { id: "CR-3", name: "TTPS Patrol Unit 5", type: "Police", status: "Staged", priority: "Medium", location: "Curepe", eta: "09:40" },
  { id: "CR-4", name: "MOWT Team 2", type: "MOWT", status: "Available", priority: "Medium", location: "Bamboo", eta: "09:50" },
  { id: "CR-5", name: "San Fernando Pump Unit", type: "Drainage", status: "Returning", priority: "Low", location: "San Fernando", eta: "09:55" },
];

export const alertDrafts: AlertDraft[] = [
  {
    id: "AL-1",
    channel: "WhatsApp",
    status: "Ready",
    audience: "Chaguanas, Caroni, Curepe corridor",
    body: "Flooding reported on Caroni Savannah Rd. Avoid the area and use signed diversions via Uriah Butler Hwy. Crews dispatched.",
  },
  {
    id: "AL-2",
    channel: "Waze",
    status: "Draft",
    audience: "Drivers near Beetham and Port of Spain",
    body: "Surface flooding and delays expected near Beetham. Expect slower westbound traffic for the next 45 minutes.",
  },
];

export const sopSteps: SopStep[] = [
  { id: "sop-1", label: "Confirm depth and road status with nearest field unit", owner: "TTPS", complete: true },
  { id: "sop-2", label: "Dispatch drainage crew and pump support if depth exceeds 250 mm", owner: "MOWT", complete: false },
  { id: "sop-3", label: "Issue public alert through WhatsApp and radio partners", owner: "ODPM", complete: false },
  { id: "sop-4", label: "Update route closure feeds for Waze and Google", owner: "Traffic Centre", complete: false },
];

export const timeline = [
  { time: "09:21", label: "New incident reported: Flooding - Caroni Savannah Rd", tone: "new" },
  { time: "09:19", label: "Road closure updated: Churchill Roosevelt Hwy restricted", tone: "update" },
  { time: "09:18", label: "Drainage crew dispatched: Chaguanas North", tone: "dispatch" },
  { time: "09:16", label: "Sensor offline: CHG-120 Rain Gauge", tone: "warning" },
  { time: "09:15", label: "Flood forecast updated: 30-90 min", tone: "info" },
];
