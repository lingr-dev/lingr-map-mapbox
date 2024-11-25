<script setup>
import { useMapInit } from "@/hooks/map/useMapInit.js";

const route = useRoute();
const router = useRouter();

useMapInit();

window.addEventListener("visibilitychange", () => {
  return Promise.resolve();
});
</script>

<template>
  <RouterView></RouterView>
</template>
