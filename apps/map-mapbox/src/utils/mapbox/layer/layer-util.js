import qs from "qs";
import { each as _each } from "lodash-es";

const tdtVecUrl = "https://basemaps.geosceneonline.cn/t/vec_w/wmts";
const tdtImgUrl = "https://basemaps.geosceneonline.cn/t/img_w/wmts";
const tdtCiaUrl = "https://basemaps.geosceneonline.cn/t/cia_w/wmts";

const agolImageryUrl =
  "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer";
const agolImageryWmtsUrl =
  "https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/WMTS/tile/1.0.0/World_Imagery/default/default028mm/{z}/{y}/{x}.jpg";
const geoVisEarthBasemapUrl =
  "https://tiles2.geovisearth.com/base/v1/ter/{z}/{x}/{y}?format=png&tmsIds=w&token=a0cae4a26e8e45163e400c098e40b0105623007c1f1179a2cc9e1d10081420c4";

const tdtWmtsParams = {
  SERVICE: "WMTS",
  REQUEST: "GetTile",
  VERSION: "1.0.0",
  STYLE: "default",
  TILEMATRIXSET: "w",
  TILEMATRIX: "{z}",
  TILEROW: "{y}",
  TILECOL: "{x}",
  FORMAT: "tiles",
};

export function convertLayerPropFromKnownId(id) {
  switch (id) {
    case "tdt-vec":
      return {
        type: "raster",
        tiles: [
          `${tdtVecUrl}?${qs.stringify(
            {
              ...tdtWmtsParams,
              LAYER: "vec",
            },
            {
              encode: false,
            },
          )}`,
        ],
        tileSize: 256,
      };
    case "tdt-img":
      return {
        type: "raster",
        tiles: [
          `${tdtImgUrl}?${qs.stringify(
            {
              ...tdtWmtsParams,
              LAYER: "img",
            },
            {
              encode: false,
            },
          )}`,
        ],
        tileSize: 256,
      };
    case "tdt-cia":
      return {
        type: "raster",
        tiles: [
          `${tdtCiaUrl}?${qs.stringify(
            {
              ...tdtWmtsParams,
              LAYER: "cia",
            },
            {
              encode: false,
            },
          )}`,
        ],
        tileSize: 256,
      };
    case "ArcGIS-World-Imagery":
      return {
        type: "raster",
        tiles: [agolImageryWmtsUrl],
        tileSize: 256,
      };
    case "ArcGIS-World-Basemap-V2":
      return {
        type: "vector",
        tiles: [
          "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf",
        ],
      };
    case "GEOVIS-Earth-Basemap-V1":
      return {
        type: "raster",
        tiles: [geoVisEarthBasemapUrl],
        tileSize: 256,
      };
    default:
      break;
  }
}

export function convertLayerSourcesFromBasemapJSON(basemap) {
  if (!basemap || !basemap.layers.length) return null;

  const sources = [];
  _each(basemap.layers, (layer) => {
    if (layer.layerId) {
      sources.push({
        id: layer.layerId,
        key: `lingr-source-known-${layer.layerId}`,
        data: convertLayerPropFromKnownId(layer.layerId),
      });
    } else if (layer.url) {
      sources.push({
        id: layer.id,
        key: `lingr-source-url-${layer.id}`,
        data: {
          type: "raster",
          tiles: [layer.url],
          tileSize: 256,
        },
      });
    }
  });

  return sources;
}
