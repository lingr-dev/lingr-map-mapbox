<template>
  <div class="lingr-map__content-basemap">
    <div class="lingr-map__content-basemap-title">
      <span class="lingr-map__content-basemap-title-text">
        <i-material-symbols-grid-view-outline style="font-size: 20px" />底图
      </span>
      <v-switch
        :model-value="basemapStore.mode"
        :false-value="BASEMAP_LAYER_MODE_SIMPLE"
        :true-value="BASEMAP_LAYER_MODE_DETAIL"
        :label="
          basemapStore.mode === BASEMAP_LAYER_MODE_SIMPLE ? '简要' : '详细'
        "
        color="#705df2"
        @update:model-value="val => (basemapStore.mode = val)"
        hide-details
      />
    </div>
    <div class="lingr-map__content-basemap-style">
      <span class="lingr-map__content-basemap-style-label">样式</span>
      <BasemapItem
        v-for="(item, index) in basemapStore.gallery"
        :key="item.id"
        :item="item"
        :ref="el => createBaseItemRef(el, index)"
      />
    </div>
    <div class="lingr-map__content-basemap-detail">
      <span class="lingr-map__content-basemap-detail-label">详细</span>
    </div>
    <div class="lingr-map__content-basemap-projection">
      <span class="lingr-map__content-basemap-projection-label">投影</span>
    </div>
  </div>
</template>

<script setup>
import BasemapItem from './basemap/BasemapItem.vue'
import { useBasemap } from '@/stores'
import {
  BASEMAP_LAYER_MODE_SIMPLE,
  BASEMAP_LAYER_MODE_DETAIL,
} from '@/constants/basemaps.js'

const basemapStore = useBasemap()

const baseItemRefs = ref([])

function createBaseItemRef(el, index) {
  baseItemRefs.value[index] = el
}

watch(
  () => basemapStore.mode,
  () => {
    baseItemRefs.value?.forEach(item => {
      item.toggleDisplayMode(basemapStore.mode)
    })
  }
)
</script>

<style scoped lang="scss">
.lingr-map__content-basemap {
  width: 100%;
  padding: 15px;
  display: flex;
  flex-direction: column;

  &-title {
    margin-bottom: 0.5em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $text-01;

    &-text {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 800;
      gap: 4px;
    }
  }

  &-style,
  &-detail,
  &-projection {
    margin-bottom: 1em;
    display: flex;
    flex-direction: column;

    &-label {
      flex: none;
      margin-bottom: 0.5em;
      color: $text-02;
      font-size: 14px;
    }
  }
}
</style>
