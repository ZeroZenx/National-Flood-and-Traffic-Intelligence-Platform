export const ARCGIS_WEBMAP_ITEM_ID = "74d07f996dc04ced9d602b90a7923a07";
export const ARCGIS_ITEM_URL = `https://www.arcgis.com/home/item.html?id=${ARCGIS_WEBMAP_ITEM_ID}`;
export const ARCGIS_REST_ITEM_URL = `https://www.arcgis.com/sharing/rest/content/items/${ARCGIS_WEBMAP_ITEM_ID}?f=json`;

export interface ArcGisBounds {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface ArcGisLayerConfig {
  id: "counties" | "wards" | "communities" | "roads" | "parcels";
  title: string;
  url: string;
  fields: string[];
  defaultWhere: string;
  geometryPrecision: number;
  maxAllowableOffset: number;
  resultRecordCount: number;
  minZoom: number;
}

const servicesRoot = "https://services1.arcgis.com/NUSHso3rgWERZOFF/arcgis/rest/services";

export const arcgisLayers: Record<ArcGisLayerConfig["id"], ArcGisLayerConfig> = {
  counties: {
    id: "counties",
    title: "Counties",
    url: `${servicesRoot}/TTO_Administrative_Boundaries/FeatureServer/6/query`,
    fields: ["COUNTY"],
    defaultWhere: "1=1",
    geometryPrecision: 4,
    maxAllowableOffset: 0.001,
    resultRecordCount: 80,
    minZoom: 1,
  },
  wards: {
    id: "wards",
    title: "Wards",
    url: `${servicesRoot}/TTO_Administrative_Boundaries/FeatureServer/5/query`,
    fields: ["NAME", "COUNTY", "TOTPOP", "Shape__Area"],
    defaultWhere: "1=1",
    geometryPrecision: 4,
    maxAllowableOffset: 0.0008,
    resultRecordCount: 160,
    minZoom: 2.2,
  },
  communities: {
    id: "communities",
    title: "Communities",
    url: `${servicesRoot}/TTO_Administrative_Boundaries/FeatureServer/4/query`,
    fields: ["NAME", "COMM_NAME", "COMMUNITY", "TOTPOP", "HH", "BUILDINGS"],
    defaultWhere: "1=1",
    geometryPrecision: 4,
    maxAllowableOffset: 0.00045,
    resultRecordCount: 220,
    minZoom: 3.2,
  },
  roads: {
    id: "roads",
    title: "Roads of Trinidad and Tobago (MNS)",
    url: `${servicesRoot}/TTO_Roads_National_Security/FeatureServer/0/query`,
    fields: ["FullName", "Status", "Category", "Source", "Lanes", "Speed"],
    defaultWhere: "Category in ('Highway','Primary','Secondary','Tertiary','Residential')",
    geometryPrecision: 4,
    maxAllowableOffset: 0.00035,
    resultRecordCount: 750,
    minZoom: 1,
  },
  parcels: {
    id: "parcels",
    title: "Parcels August 2023",
    url: `${servicesRoot}/TRN_Parcels_August2023/FeatureServer/1/query`,
    fields: ["FEATURENAM", "NAME", "OWNER", "Shape__Area"],
    defaultWhere: "1=1",
    geometryPrecision: 4,
    maxAllowableOffset: 0.00012,
    resultRecordCount: 120,
    minZoom: 6,
  },
};

export function buildArcGisQueryUrl(layer: ArcGisLayerConfig, bounds: ArcGisBounds) {
  const params = new URLSearchParams({
    where: layer.defaultWhere,
    outFields: layer.fields.join(","),
    returnGeometry: "true",
    outSR: "4326",
    geometry: JSON.stringify({
      xmin: bounds.xmin,
      ymin: bounds.ymin,
      xmax: bounds.xmax,
      ymax: bounds.ymax,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    resultRecordCount: String(layer.resultRecordCount),
    geometryPrecision: String(layer.geometryPrecision),
    maxAllowableOffset: String(layer.maxAllowableOffset),
    f: "geojson",
  });

  return `${layer.url}?${params.toString()}`;
}

export const arcgisSourceSummary = {
  title: "Geospatial Information Portal for Trinidad",
  owner: "eedwards",
  organizationId: "NUSHso3rgWERZOFF",
  type: "Web Map",
  extent: "Trinidad and Tobago",
  basemap: "Caribbean Sea + TRN_Aerial_2014",
  visibleLayers: [
    "Counties",
    "Wards",
    "Communities",
    "Parcels August 2023",
    "Roads of Trinidad and Tobago (MNS)",
  ],
  optionalLayers: [
    "Parcels August 2020",
    "Parcels August 2021",
    "Control Network",
  ],
};
