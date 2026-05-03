<template>
  <div
    :style="{
      display: 'flex',
      flex: 'auto',
      'flex-direction': 'column',
      margin: '10px',
      gap: '5px',
    }"
  >
    <div
      v-if="!showConfig"
      style="display: flex; justify-content: flex-end; margin-bottom: 10px"
    >
      <Button @click="handleShowConfig">
        <template #icon>
          <SettingOutlined />
        </template>
        配置
      </Button>
    </div>
    <div v-if="!showConfig">
      <LiveCore
        v-for="liveInfo in liveInfoList"
        :key="liveInfo.id"
        :liveInfo="liveInfo"
      />
    </div>
    <div
      v-if="showConfig"
      style="display: flex; justify-content: flex-end; margin-bottom: 10px"
    >
      <Button @click="handleHiddenConfig" type="primary">
        <template #icon>
          <CheckOutlined />
        </template>
        完成配置
      </Button>
    </div>
    <div v-if="showConfig">
      <LiveList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button } from "ant-design-vue";
import { SettingOutlined, CheckOutlined } from "@ant-design/icons-vue";
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
