<script setup>
import { useWebWorkspace } from "@/hooks/useWebWorkspace.js";

const route = useRoute();
const router = useRouter();

const { workspaceDomain } = useWebWorkspace();

window.addEventListener("visibilitychange", () => {
  return Promise.resolve();
});
</script>

<template>
  <RouterView></RouterView>
</template>
