<template>
  <div class="page-layout_holy-grail">
    <header>
      <Logo />
      <div class="page-layout_holy-grail-links">
        <DemoTag />
        <Github />
      </div>
    </header>
    <div
      class="page-layout_holy-grail-left-side"
      :style="{ width: layoutStore.leftWidth + 'px' }"
    >
      <MapContentBar />
      <MapContent />
    </div>
    <main>
      <RouterView></RouterView>
    </main>
    <div class="page-layout_holy-grail-right-side"></div>
    <footer>
      <Footer />
    </footer>
  </div>
</template>

<script setup>
import MapContentBar from "@/components/map/MapContentBar.vue";
import MapContent from "@/components/map/MapContent.vue";
import Logo from "@/components/system/Logo.vue";
import DemoTag from "@/components/system/DemoTag.vue";
import Github from "@/components/system/Github.vue";
import Footer from "@/components/system/Footer.vue";
import { usePageLayout } from "@/stores";

const layoutStore = usePageLayout();
</script>

<style scoped lang="scss">
.page-layout_holy-grail {
  flex: 1;
  height: 100vh;
  display: grid;
  grid-template: auto 1fr auto / auto 1fr auto;
  background: $ui-background;

  &-links {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  header,
  footer {
    padding: 10px;
  }

  header {
    grid-column: 1 / 4;
    border-bottom: 1px solid $support-01;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .page-layout_holy-grail-left-side {
    grid-column: 1 / 2;
    display: flex;
    align-items: stretch;
  }
  main {
    grid-column: 2 / 3;
  }
  .page-layout_holy-grail-right-side {
    grid-column: 3 / 4;
  }
  footer {
    grid-column: 1 / 4;
    border-top: 1px solid $support-01;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .page-layout_holy-grail {
    grid: repeat(5, 1fr) / 1fr;
  }

  header,
  footer,
  .page-layout_holy-grail-left-side,
  .page-layout_holy-grail-right-side,
  main {
    grid-column: 1 / 2;
  }
}
</style>
