<template>
  <div class="page-footer">
    <span>© 2020-2024 Lingerer</span>
    <span class="page-footer__divide">|</span>
    <a href="https://beian.miit.gov.cn/" target="_blank"
      >鄂ICP备2024063300号-1</a
    >
    <span class="page-footer__divide">|</span>
    <a href="https://beian.mps.gov.cn/#/" class="beian-mps" target="_blank">
      <img
        alt=""
        src="https://img-xs.lingerer.cn/info/beian-mps.png"
        height="16"
        width="16"
      />鄂公网安备42011102005624号
    </a>
    <span class="page-footer__divide">|</span>
    <a href="https://support.qq.com/product/667538" target="_blank">交流反馈</a>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.page-footer {
  display: flex;
  align-items: center;
  color: $text-06;
  font-size: 13px;

  & > a {
    color: $text-06;
  }

  &__divide {
    margin: 0 12px;
  }

  .beian-mps {
    display: flex;
    align-items: center;
    color: $text-06;
    gap: 3px;
  }
}
</style>
