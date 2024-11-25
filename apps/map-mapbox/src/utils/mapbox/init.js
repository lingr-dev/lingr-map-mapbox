import MapboxGL from "mapbox-gl";

export function configMapboxGL() {
  MapboxGL.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
}
