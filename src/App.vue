<template>
  <el-config-provider namespace="ep">
    <Live></Live>
  </el-config-provider>
</template>

<script setup lang="ts">
import Live from "./views/Live/index.vue";
</script>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 3px);
}
</style>
