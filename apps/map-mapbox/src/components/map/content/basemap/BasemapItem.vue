<template>
  <div
    :class="[
      'lingr-map__content-basemap-item',
      {
        active: basemapStore.current === item.id,
        detail: mode === BASEMAP_LAYER_MODE_DETAIL,
      },
    ]"
    :style="{
      'view-transition-name': 'basemapItem' + item.id,
    }"
    @click="switchCurrentBasemap"
  >
    <div class="lingr-map__content-basemap-item-thumbnail">
      <img
        alt=""
        :src="item.thumbnail"
        :style="{
          'view-transition-name': 'basemapThumbnail' + item.id,
        }"
      />
    </div>
    <div class="lingr-map__content-basemap-item-content">
      <div
        class="lingr-map__content-basemap-item-title"
        :style="{
          'view-transition-name': 'basemapTitle' + item.id,
        }"
      >
        {{ item.name }}
      </div>
      <template v-if="mode === BASEMAP_LAYER_MODE_DETAIL">
        <div
          class="lingr-map__content-basemap-item-stat"
          :style="{
            'view-transition-name': 'basemapStat' + item.id,
          }"
        >
          共 {{ item.layers.length }} 个图层
          <a
            class="lingr-map__content-basemap-item-detail-btn"
            @click="showDetail"
          >
            <i-mdi-information /> 详情
          </a>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useBasemap } from '@/stores'
import { transitionHelper } from '@/utils/transition/helper.js'
import {
  BASEMAP_LAYER_MODE_DETAIL,
  BASEMAP_LAYER_MODE_SIMPLE,
} from '@/constants/basemaps.js'

const basemapStore = useBasemap()
const mode = ref(BASEMAP_LAYER_MODE_SIMPLE)

const workspaceBloc = inject('workspaceBloc')

const props = defineProps({
  item: {},
})

function toggleDisplayMode(toggleMode) {
  const types = [
    // mode.value === BASEMAP_LAYER_MODE_SIMPLE
    //   ? 'detailBasemap'
    //   : 'simpleBasemap',
  ]

  const transition = transitionHelper({
    async update() {
      mode.value = toggleMode
      await nextTick()
    },
    types,
  })
}

function switchCurrentBasemap() {
  basemapStore.switchCurrentBasemap(props.item.id)

  workspaceBloc.toggleBasemapId(props.item.id)
}

function showDetail() {}

defineExpose({ toggleDisplayMode })
</script>

<style scoped lang="scss">
.lingr-map__content-basemap-item {
  padding: 8px;
  margin-bottom: 6px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid $support-01;
  background: $ui-background;
  display: flex;
  flex-direction: row;
  gap: 10px;

  view-transition-class: basemapItem;

  &.active {
    border-color: $active-primary;
  }

  &.detail {
    height: 64px;
  }
  &.detail > &-thumbnail {
    width: 84px;
  }

  &-thumbnail {
    flex: none;
    width: 42px;

    > img {
      width: 100%;
      height: 100%;
      object-fit: none;

      view-transition-class: basemapThumbnail;
    }
  }
  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: all 0.5s ease-in-out;
  }
  &-title {
    margin-bottom: 0.5em;
    color: $text-01;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.02em;

    view-transition-class: basemapTitle;
  }
  &-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: $text-02;
    font-size: 12px;
    letter-spacing: -0.02em;

    view-transition-class: basemapStat;
  }
  &-detail-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    color: $text-06;
    font-size: 12px;
    letter-spacing: -0.02em;
    cursor: pointer;

    &:hover {
      color: $text-03;
    }
  }
}

::view-transition-group(.basemapTitle) {
  width: fit-content;
}

::view-transition-group(.basemapThumbnail) {
  mix-blend-mode: normal;

  transform-origin: 0 0;
}
</style>
