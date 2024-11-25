<template>
  <div class="lingr-map__content">
    <component :is="contents[mapStore.content]" />
  </div>
</template>

<script setup>
import BasemapGallery from './content/BasemapGallery.vue'
import { useMapStore } from '@/stores'
import { MAP_CONTENT_BASEMAP } from '@/constants/application.js'

const contents = {
  [MAP_CONTENT_BASEMAP]: BasemapGallery,
}

const mapStore = useMapStore()
</script>

<style scoped lang="scss">
.lingr-map__content {
  flex: 1;
  width: 100%;
  display: flex;
  overflow: hidden;
}
</style>
