import { useMapStore } from "@/stores";
import mapCreator from "@/utils/mapbox/factory/map-creator.js";

const useMapboxView = (container) => {
  const mapStore = useMapStore();

  onMounted(() => {
    if (!container.value) return;

    const map = mapCreator.createMap(container.value);

    map.on("load", () => {
      mapStore.onViewReady(map);
    });
  });
};

export { useMapboxView };
