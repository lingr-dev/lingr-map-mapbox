import { BASEMAP_LAYER_MODE_SIMPLE } from "@/constants/basemaps.js";

const useBasemap = defineStore("basemap", {
  state() {
    return {
      current: null,

      mode: BASEMAP_LAYER_MODE_SIMPLE,

      gallery: [],
    };
  },

  actions: {
    switchCurrentBasemap(basemapId) {
      this.current = basemapId;
    },
  },
});

export { useBasemap };
