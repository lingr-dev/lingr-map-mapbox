import { each as _each } from "lodash-es";
import { Basemaps } from "@lingr/map-core";
import { MAP_CONTENT_BASEMAP } from "@/constants/application.js";

const useMapStore = defineStore("map", () => {
  const map = shallowRef(null);
  const ready = ref(false);

  const content = ref(MAP_CONTENT_BASEMAP);

  function onViewReady(inst) {
    map.value = inst;
    ready.value = true;
  }

  return {
    map,
    content,
    ready,

    onViewReady,
  };
});

export { useMapStore };
