<template>
  <div class="live-core">
    <div class="live-core__meta">
      <div>
        摄像头：<b>{{ liveInfo.name || "未命名" }}</b>
      </div>
      <div>
        在线：
        <span v-if="flvMediaInfo.onlineStatus" class="live-core__online">是</span>
        <span v-else class="live-core__offline">否</span>
      </div>
      <div class="live-core__audio">
        <span>是否有音频：</span>
        <Checkbox size="small" :checked="flvMediaInfo.hasAudio" disabled />
      </div>
    </div>
    <div class="live-core__actions">
      <Button
        type="primary"
        size="small"
        @click="handlePlay"
        :disabled="!flvMediaInfo.onlineStatus"
      >
        播放
      </Button>
      <Button type="primary" size="small" @click="handleStop" :disabled="!canStop">
        停止
      </Button>
    </div>
    <button class="live-core__video-button" type="button" @click="handleVideoClick">
      <FlvVideo
        ref="playerRef"
        :url="liveInfo.url"
        :hasAudio="playerHasAudio"
        @play="canStop = true"
        @stop="canStop = false"
        @error="handlePlayerError"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Button, Checkbox, message } from "ant-design-vue";
import BaseAPI from "../../api";
import FlvVideo from "../../components/FlvVideo.vue";
import { TLiveInfo } from "~/localStorage/shareWithMeConfig";

const canStop = ref<boolean>(false);
const playerRef = ref<InstanceType<typeof FlvVideo>>();
const playerHasAudio = ref<boolean>(true);
const flvMediaInfo = ref<FlvMediaInfo>({
  hasAudio: false,
  onlineStatus: false,
});
const checkOnlineStatusInterval = ref<number>();

const { liveInfo } = defineProps<{
  liveInfo: TLiveInfo;
}>();

type FlvMediaInfo = {
  hasAudio: boolean;
  onlineStatus: boolean;
};

const loadMediaInfo = async () => {
  if (!liveInfo.mediaInfoUrl) {
    flvMediaInfo.value = {
      hasAudio: true,
      onlineStatus: Boolean(liveInfo.url),
    };
    return flvMediaInfo.value;
  }

  const mediaInfo = await BaseAPI.GET<undefined>(liveInfo.mediaInfoUrl);
  flvMediaInfo.value = mediaInfo as FlvMediaInfo;
  return flvMediaInfo.value;
};

const handlePlay = async () => {
  try {
    const mediaInfo = await loadMediaInfo();
    if (!mediaInfo.onlineStatus) {
      message.error(`${liveInfo.name || "摄像头"} 当前不在线`);
      return;
    }
    playerHasAudio.value = mediaInfo.hasAudio;
    await nextTick();
    await playerRef.value?.play();
  } catch (err) {
    message.error(`获取媒体信息失败：${String(err)}`);
  }
};

const handleStop = () => {
  playerRef.value?.stop();
  canStop.value = false;
};

const handleVideoClick = () => {
  if (!canStop.value) {
    handlePlay();
  }
};

const handlePlayerError = (errorMessage: string) => {
  canStop.value = false;
  message.error(errorMessage);
};

onMounted(async () => {
  try {
    await loadMediaInfo();
  } catch (err) {
    message.error(`获取媒体信息失败：${String(err)}`);
  }

  if (liveInfo.mediaInfoUrl) {
    checkOnlineStatusInterval.value = window.setInterval(async () => {
      if (flvMediaInfo.value.onlineStatus) {
        return;
      }
      try {
        await loadMediaInfo();
      } catch (err) {
        flvMediaInfo.value = {
          ...flvMediaInfo.value,
          onlineStatus: false,
        };
      }
    }, 60000);
  }
});

onBeforeUnmount(() => {
  if (checkOnlineStatusInterval.value) {
    clearInterval(checkOnlineStatusInterval.value);
  }
  playerRef.value?.stop();
});
</script>

<style scoped>
.live-core {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.live-core__meta,
.live-core__actions,
.live-core__audio {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.live-core__online {
  color: #16a34a;
}

.live-core__offline {
  color: #dc2626;
}

.live-core__video-button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
}
</style>
