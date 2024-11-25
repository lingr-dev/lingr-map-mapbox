import { watchOnce } from "@vueuse/core";
import { useDomainState, WORKSPACE_STATE_MAP_INFO, provideWorkspaceDomain } from "@lingr/map-core";
import { useMapStore, useBasemap } from "@/stores";

const useWebWorkspace = () => {
  const domain = provideWorkspaceDomain();
  const state = useDomainState(domain);

  const mapStore = useMapStore();
  const basemapStore = useBasemap();

  provide("workspaceDomain", domain);

  watch(state, () => {
    const stateValue = toValue(state);

    if (stateValue.type === WORKSPACE_STATE_MAP_INFO) {
      basemapStore.current = stateValue.ctx.mapInfo.basemap;
    }
  });

  watchOnce(
    () => mapStore.ready,
    () => {
      domain.init({ map: mapStore.map });
    },
  );

  return { state, workspaceDomain: domain };
};

export { useWebWorkspace };
