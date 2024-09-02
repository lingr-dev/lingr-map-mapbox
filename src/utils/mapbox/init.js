import mapboxgl from "mapbox-gl";

export function configMapboxGL() {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
}
