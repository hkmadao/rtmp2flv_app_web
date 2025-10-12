<template>
  <div
    :style="{
      display: 'flex',
      flex: 'auto',
      margin: '5px',
      'flex-direction': 'column',
      gap: '20px',
    }"
  >
    <div v-if="!showConfig">
      <Button @click="handleShowConfig">配置</Button>
      <LiveCore
        v-for="liveInfo in liveInfoList"
        :key="liveInfo.id"
        :liveInfo="liveInfo"
      />
    </div>
    <div v-if="showConfig">
      <Button @click="handleHiddenConfig">完成配置</Button>
      <LiveList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "ant-design-vue";
import LiveCore from "./LiveCore.vue";
import LiveList from "./LiveList.vue";
import { getLiveInfoList, TLiveInfo } from "~/localStorage";
const liveInfoList = ref<TLiveInfo[]>();
const showConfig = ref<boolean>(false);

const handleShowConfig = () => {
  showConfig.value = true;
  liveInfoList.value = getLiveInfoList();
};

const handleHiddenConfig = () => {
  showConfig.value = false;
  liveInfoList.value = getLiveInfoList();
};

onMounted(() => {
  liveInfoList.value = getLiveInfoList();
});
</script>

<style></style>
