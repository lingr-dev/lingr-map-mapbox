<template>
  <div class="page-logo">
    <a alt="Lingerer" href="https://www.lingerer.cn">
      <img alt="Lingerer" src="https://img-xs.lingerer.cn/lingerer/logo.svg" height="40" width="40" />
    </a>
    <span class="page-logo__title">Lingr Map</span>
  </div>
</template>

<script setup></script>

<style scoped lang="scss">
.page-logo {
  display: flex;
  align-items: center;
  gap: 8px;

  > a {
    display: flex;
    align-items: center;
  }

  &__title {
    color: $active-primary;
    font-size: 28px;
    font-family: Inter, sans-serif;
    font-style: italic;
    font-weight: 800;
    text-shadow: $shadow-02;
  }
}
</style>
