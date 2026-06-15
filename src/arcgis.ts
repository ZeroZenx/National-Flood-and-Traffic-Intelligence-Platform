export const ARCGIS_WEBMAP_ITEM_ID = "74d07f996dc04ced9d602b90a7923a07";
export const ARCGIS_ITEM_URL = `https://www.arcgis.com/home/item.html?id=${ARCGIS_WEBMAP_ITEM_ID}`;
export const ARCGIS_REST_ITEM_URL = `https://www.arcgis.com/sharing/rest/content/items/${ARCGIS_WEBMAP_ITEM_ID}?f=json`;

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
