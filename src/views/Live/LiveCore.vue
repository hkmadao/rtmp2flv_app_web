<template>
  <div :style="{ display: 'flex', 'flex-direction': 'column', gap: '5px' }">
    <div :style="{ display: 'flex', gap: '5px' }">
      <div>
        摄像头：<b>{{ liveInfo.name }}</b>
      </div>
      <div>
        在线：
        <span v-if="flvMediaInfo.onlineStatus" :style="{ color: 'green' }"
          >是</span
        >
        <span v-if="!flvMediaInfo.onlineStatus" :style="{ color: 'red' }"
          >否</span
        >
      </div>
      <div :style="{ display: 'flex', gap: '5px' }">
        <div>是否有音频:</div>
        <Checkbox size="small" :checked="flvMediaInfo.hasAudio" />
      </div>
    </div>
    <div :style="{ display: 'flex', gap: '5px' }">
      <Button
        type="primary"
        size="small"
        @click="handlePlay"
        :disabled="!flvMediaInfo.onlineStatus"
      >
        播放
      </Button>
      <Button
        type="primary"
        size="small"
        @click="handleStop"
        :disabled="!canStop"
      >
        停止
      </Button>
    </div>
    <div>
      <video
        ref="videoElementRef"
        @click="handleViedoClick"
        :className="liveInfo.id"
        controls
        width="90%"
      >
        Your browser is too old which doesn't support HTML5 video.
      </video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Flv from "flv.js";
import { Button, Checkbox, message } from "ant-design-vue";
import BaseAPI from "../../api";
import { TLiveInfo } from "~/localStorage";

const canStop = ref<boolean>(false);
const playRef = ref<Flv.Player>();
const videoElementRef = ref<HTMLMediaElement>();
const flvMediaInfo = ref<FlvMediaInfo>({
  hasAudio: false,
  onlineStatus: false,
});
const fgOnlineStatusRef = ref<boolean>(flvMediaInfo.value.onlineStatus);
const checkOnlineStatusInterval = ref();
const interval = ref();

const { liveInfo } = defineProps<{
  liveInfo: TLiveInfo;
}>();

type FlvMediaInfo = {
  hasAudio: boolean;
  onlineStatus: boolean;
};

watch(flvMediaInfo, () => {
  fgOnlineStatusRef.value = flvMediaInfo.value.onlineStatus;
});

onBeforeUnmount(() => {
  return () => {
    clearInterval(checkOnlineStatusInterval.value);
    clearInterval(interval.value);
    if (playRef.value) {
      playRef.value.pause();
      playRef.value.unload();
      playRef.value.detachMediaElement();
      playRef.value.destroy();
      playRef.value = undefined;
    }
  };
});

const handlePlay = () => {
  if (!playRef.value) {
    if (liveInfo.mediaInfoUrl) {
      const mediaInfoGetUrl = liveInfo.mediaInfoUrl;
      BaseAPI.GET(mediaInfoGetUrl).then((mediaInfo: FlvMediaInfo) => {
        flvMediaInfo.value = mediaInfo;
        if (!mediaInfo.onlineStatus) {
          message.error(`anchor: ${liveInfo.name} not on the air`);
          return;
        }
        flv_load(mediaInfo.hasAudio);
      });
    } else {
      flv_load(flvMediaInfo.value.hasAudio);
    }
  }
};

const handleStop = () => {
  if (playRef.value) {
    playRef.value.pause();
    playRef.value.unload();
    playRef.value.detachMediaElement();
    playRef.value.destroy();
    playRef.value = undefined;
    canStop.value = false;
  }
};

const flv_load = (hasAudio: boolean) => {
  var mediaDataSource: Flv.MediaDataSource = {
    type: "flv",
  };
  let videoUrl = liveInfo.url;
  mediaDataSource["url"] = videoUrl;
  mediaDataSource["hasAudio"] = hasAudio;
  mediaDataSource["isLive"] = true;
  console.log("MediaDataSource", mediaDataSource);

  let element = document.getElementsByClassName(
    liveInfo.id!
  )[0] as HTMLMediaElement;
  const tempEles = element.getElementsByTagName("video");
  if (tempEles && tempEles.length > 0) {
    element = tempEles[0] as HTMLMediaElement;
  }
  console.log(element);

  if (playRef.value) {
    playRef.value.pause();
    playRef.value.unload();
    playRef.value.detachMediaElement();
    playRef.value.destroy();
    playRef.value = undefined;
  }

  playRef.value = Flv.createPlayer(mediaDataSource, {
    enableWorker: false,
    lazyLoadMaxDuration: 3 * 60,
    seekType: "range",
  });

  playRef.value.on(
    Flv.Events.ERROR,
    (errorType: any, errorDetail: any, errorInfo: any) => {
      console.log("errorType:", errorType);
      console.log("errorDetail:", errorDetail);
      console.log("errorInfo:", errorInfo);
    }
  );
  playRef.value.attachMediaElement(element);
  playRef.value.load();
  playRef.value.play();
};

const handleViedoClick = (e: any) => {
  handlePlay();
};

onMounted(() => {
  if (!liveInfo.mediaInfoUrl) {
    flvMediaInfo.value = {
      hasAudio: true,
      onlineStatus: true,
    };
  } else {
    const mediaInfoGetUrl = liveInfo.mediaInfoUrl;
    BaseAPI.GET(mediaInfoGetUrl).then((mediaInfo: FlvMediaInfo) => {
      flvMediaInfo.value = mediaInfo;
    });

    checkOnlineStatusInterval.value = setInterval(() => {
      if (fgOnlineStatusRef.value === true) {
        return;
      }

      const mediaInfoGetUrl = liveInfo.mediaInfoUrl!;
      BaseAPI.GET(mediaInfoGetUrl).then((mediaInfo: FlvMediaInfo) => {
        flvMediaInfo.value = mediaInfo;
      });
    }, 60000);
    checkOnlineStatusInterval.value;

    interval.value = setInterval(() => {
      if (videoElementRef.value && playRef.value) {
        canStop.value = true;
        const buffered = videoElementRef.value.buffered;
        if (videoElementRef.value.paused && buffered && buffered.length > 0) {
          const maxBufferedSec = 3 * 60;
          const currentTime = videoElementRef.value.currentTime;
          if (buffered.end(0) - currentTime > maxBufferedSec) {
            console.log("vedio paused, buffered max, unload the media data");
            playRef.value.pause();
            playRef.value.unload();
            playRef.value.detachMediaElement();
            playRef.value.destroy();
            playRef.value = undefined;
          }
        }
      } else {
        canStop.value = false;
      }
    }, 1000);
  }
});
</script>

<style></style>
