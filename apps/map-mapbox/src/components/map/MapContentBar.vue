<template>
  <div class="lingr-map__content-bar">
    <span
      :class="[
        'lingr-map__content-bar-item',
        {
          active: mapStore.content === MAP_CONTENT_SEARCH,
        },
      ]"
      title="搜索"
      @click="switchContent(MAP_CONTENT_SEARCH)"
    >
      <i-material-symbols-search style="font-size: 20px" />
    </span>
    <span
      :class="[
        'lingr-map__content-bar-item',
        {
          active: mapStore.content === MAP_CONTENT_BASEMAP,
        },
      ]"
      title="底图库"
      @click="switchContent(MAP_CONTENT_BASEMAP)"
    >
      <i-material-symbols-grid-view-outline style="font-size: 20px" />
    </span>
    <span
      :class="[
        'lingr-map__content-bar-item',
        {
          active: mapStore.content === MAP_CONTENT_LAYERLIST,
        },
      ]"
      title="图层"
      @click="switchContent(MAP_CONTENT_LAYERLIST)"
    >
      <i-material-symbols-layers-outline style="font-size: 20px" />
    </span>
  </div>
</template>

<script setup>
import { useMapStore } from "@/stores";
import {
  MAP_CONTENT_BASEMAP,
  MAP_CONTENT_SEARCH,
  MAP_CONTENT_LAYERLIST,
} from "@/constants/application.js";

const mapStore = useMapStore();

function switchContent(contentKey) {
  mapStore.content = contentKey;
}
</script>

<style scoped lang="scss">
.lingr-map__content-bar {
  flex: none;
  width: 48px;
  height: 100%;
  border-right: 1px solid $support-01;
  display: flex;
  flex-direction: column;

  &-item {
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-right: 3px solid transparent;
    color: $text-02;
    font-size: 36px;
    cursor: pointer;

    &:not(.active):hover {
      color: $text-01;
    }

    &.active {
      color: $text-01;
      background: linear-gradient(to right, #1c11344c 0%, #ff66514c 100%);
      border-right-color: $interactive-03;
    }
  }
}
</style>
