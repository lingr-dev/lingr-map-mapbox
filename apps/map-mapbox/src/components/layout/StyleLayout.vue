<template>
  <div class="page-layout_styled">
    <component :is="layouts[layoutStore.layout]" />
  </div>
</template>

<script setup>
import HolyGrailLayout from "./HolyGrailLayout.vue";
import TwinWingLayout from "./TwinWingLayout.vue";
import { usePageLayout } from "@/stores";
import {
  LAYOUT_HOLY_GRAIL,
  LAYOUT_TWIN_WING,
} from "@/constants/application.js";

const layoutStore = usePageLayout();

const layouts = {
  [LAYOUT_HOLY_GRAIL]: HolyGrailLayout,
  [LAYOUT_TWIN_WING]: TwinWingLayout,
};
</script>

<style scoped lang="scss">
.page-layout_styled {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
}
</style>
