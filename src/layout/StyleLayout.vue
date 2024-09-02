<template>
  <div class="page-layout_styled">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>

<style scoped lang="scss">
.page-layout_styled {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
}
</style>
