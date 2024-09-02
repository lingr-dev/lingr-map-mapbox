const useMapStore = defineStore("map", () => {
  const map = shallowRef(null);
  const ready = ref(false);

  function onViewReady(inst) {
    map.value = inst;
    ready.value = true;
  }

  return {
    map,
    ready,

    onViewReady,
  };
});

export { useMapStore };
