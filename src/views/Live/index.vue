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
    <LiveCore :getLiveInfo="getHwLiveInfo" />
    <LiveCore :getLiveInfo="get0517LiveInfo" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import LiveCore, { type TLiveInfo } from "./LiveCore.vue";

const getHwLiveInfo = () => {
  const liveInfo: TLiveInfo = {
    method: "temp",
    code: "camera-hw",
    playAuthCode: "g2BapeNuvFGt22Al5gt",
  };
  return liveInfo;
};

const get0517LiveInfo = () => {
  const liveInfo: TLiveInfo = {
    method: "temp",
    code: "camera-0517",
    playAuthCode: "yGUsKIfHHO",
  };
  return liveInfo;
};
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
