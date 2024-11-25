<template>
  <div ref="viewRef" class="viewDiv"></div>
</template>

<script setup>
import { useMapboxView } from "@/hooks/map/useMapboxView.js";

const viewRef = ref(null);

useMapboxView(viewRef);
</script>

<style scoped lang="scss">
.viewDiv {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
