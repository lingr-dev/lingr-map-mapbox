import { each as _each } from "lodash-es";
import { Basemaps } from "@lingr/map-core";
import { convertLayerSourcesFromBasemapJSON } from "../layer/layer-util.js";

export function createBasemapSources() {
  const basemapSources = {};

  _each(Basemaps, (basemapJSON) => {
    const sources = convertLayerSourcesFromBasemapJSON(basemapJSON);

    _each(sources, (source) => {
      const sourceId = source.key;

      basemapSources[sourceId] = source.data;
    });
  });

  return {
    sources: basemapSources,
    layers: [],
  };
}
