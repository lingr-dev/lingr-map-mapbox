import MapboxGL from 'mapbox-gl';
import { MAPBOX_STYLE_SPEC_VER, MAPBOX_STYLE_GLYPHS } from '@/constants/basemaps.js';
import { createBasemapSources } from './base-creator.js';

function buildStyleObject() {
  const basemapSources = createBasemapSources();

  const style = {
    version: MAPBOX_STYLE_SPEC_VER,
    glyphs: MAPBOX_STYLE_GLYPHS,
    ...basemapSources,
  };

  return style;
}

function createMapControls(map) {
  const nav = new MapboxGL.NavigationControl();

  const fullscreen = new MapboxGL.FullscreenControl({
    container: document.querySelector('body'),
  });

  const scalebar = new MapboxGL.ScaleControl();

  map.addControl(nav);
  map.addControl(fullscreen);
  map.addControl(scalebar);
}

export default {
  createMap(container) {
    const map = new MapboxGL.Map({
      container,
      style: buildStyleObject(),
    });
    createMapControls(map);

    return map;
  },
};
