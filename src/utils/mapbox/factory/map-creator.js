import mapboxgl from "mapbox-gl";
import { configMapboxGL } from "../init.js";

function createMapControls(map) {
  const nav = new mapboxgl.NavigationControl();

  const fullscreen = new mapboxgl.FullscreenControl({
    container: document.querySelector("body"),
  });

  const scalebar = new mapboxgl.ScaleControl();

  map.addControl(nav);
  map.addControl(fullscreen);
  map.addControl(scalebar);
}

export default {
  createMap(container) {
    configMapboxGL();

    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v12",
    });
    createMapControls(map);

    return map;
  },
};
