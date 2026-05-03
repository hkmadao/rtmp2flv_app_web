<template>
  <Card class="anchor-card" :body-style="{ padding: '14px' }">
    <div class="anchor-card__main">
      <div class="anchor-card__view">
        <img
          v-if="anchor.authCode"
          class="anchor-card__cover"
          :src="anchor.authCode"
          :alt="anchor.name"
        />
        <div class="anchor-card__info">
          <div class="anchor-card__title">
            {{ anchor.name || "未命名主播" }}
          </div>
          <Tag :color="anchor.camera?.onlineStatus === false ? 'red' : 'green'">
            {{ anchor.camera?.onlineStatus === false ? "离线" : "在线" }}
          </Tag>
        </div>
      </div>
      <div class="anchor-card__actions">
        <Button
          type="primary"
          size="small"
          @click="handlePlay"
          :loading="loading"
        >
          <template #icon><PlayCircleOutlined /></template>
          播放
        </Button>
        <Button size="small" @click="handleStop" :disabled="!playing">
          <template #icon><PauseCircleOutlined /></template>
          停止
        </Button>
      </div>
    </div>

    <div v-if="playUrl" class="anchor-card__player">
      <FlvVideo
        ref="playerRef"
        :url="playUrl"
        :hasAudio="hasAudio"
        @play="playing = true"
        @stop="playing = false"
        @error="handlePlayerError"
      />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import { Button, Card, Tag, message } from "ant-design-vue";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons-vue";
import { AnchorInfo } from "../../api/liveApp";
import FlvVideo from "../../components/FlvVideo.vue";
import Env from "~/conf/env";

const { anchor } = defineProps<{
  anchor: AnchorInfo;
}>();

const playerRef = ref<InstanceType<typeof FlvVideo>>();
const playUrl = ref("");
const hasAudio = ref(true);
const loading = ref(false);
const playing = ref(false);

const handlePlay = async () => {
  loading.value = true;
  try {
    const liveInfo = {
      liveUrl: `${Env.directServerUrl}/live/temp/${anchor.camera?.code}/${anchor.authCode}.flv`,
      hasAudio: true,
      onlineStatus: anchor.camera?.onlineStatus,
    };

    if (liveInfo.onlineStatus === false) {
      message.error(`${anchor.name || "主播"} 当前不在线`);
      return;
    }

    playUrl.value = liveInfo.liveUrl;
    hasAudio.value = liveInfo.hasAudio ?? true;
    await nextTick();
    await playerRef.value?.play();
  } catch (err) {
    message.error(`主播直播播放失败：${String(err)}`);
  } finally {
    loading.value = false;
  }
};

const handleStop = () => {
  playerRef.value?.stop();
  playing.value = false;
};

const handlePlayerError = (errorMessage: string) => {
  playing.value = false;
  message.error(errorMessage);
};

onBeforeUnmount(() => {
  playerRef.value?.stop();
});
</script>

<style scoped>
.anchor-card {
  border-radius: 8px;
  text-align: left;
}

.anchor-card__main {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.anchor-card__view {
  display: flex;
  gap: 12px;
  align-items: center;
}

.anchor-card__cover {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: #e5e7eb;
}

.anchor-card__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.anchor-card__title {
  max-width: 100%;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  overflow-wrap: anywhere;
}

.anchor-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.anchor-card__player {
  margin-top: 12px;
}
</style>

