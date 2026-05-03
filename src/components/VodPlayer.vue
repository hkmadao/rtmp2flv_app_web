<template>
  <Spin :spinning="loading" :delay="100">
    <div class="vod-player" ref="modalContentRef">
      <!-- 音频选项 -->
      <div class="audio-option">
        <Checkbox :checked="hasAudio" @change="handleHasAudioChange">
          <div class="checkbox-label">
            <span>音频</span>
            <span class="hint">若播放错误，可尝试取消此选项</span>
          </div>
        </Checkbox>
      </div>

      <!-- 视频容器 -->
      <div
        class="video-wrapper"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <video
          v-show="showVideoElement"
          ref="videoElementRef"
          class="centered-video"
          width="100%"
          :poster="videoBackground"
          @click="handleVideoTogglePlay"
        >
          您的浏览器不支持 HTML5 video
        </video>

        <!-- 播放/暂停按钮（居中） -->
        <div class="center-play-button" @click="handleVideoTogglePlay">
          <img v-if="!fgPlay" width="50" :src="playIcon" alt="播放" />
        </div>

        <!-- 控制栏 -->
        <div
          class="control-bar"
          :class="{ hidden: !mouseMoveOnVideo && fgPlay }"
        >
          <div class="timeline-content">
            <!-- 进度条 -->
            <div class="progress-container">
              <input
                class="range-input"
                type="range"
                :min="0"
                :max="durationSec"
                :value="Math.floor(currentTime + offsetTime)"
                @input="handleRangeChange"
                :step="step"
              />
            </div>

            <!-- 控制按钮区域 -->
            <div class="controls-row">
              <!-- 播放/暂停按钮 -->
              <div class="play-btn" @click="handleVideoTogglePlay">
                <img v-if="fgPlay" width="26" :src="pauseIcon" alt="暂停" />
                <img v-else width="26" :src="playIcon" alt="播放" />
              </div>

              <!-- 时间显示 -->
              <div class="time-display">
                {{ currentTimeDisplay }} / {{ durationDisplay }}
              </div>

              <!-- 音量控制 -->
              <div class="volume-control">
                <div class="volume-icon" @click="handleVolumeClick">
                  <img width="20" :src="volumeIconSrc" alt="音量" />
                </div>
                <div class="volume-slider">
                  <input
                    class="range-input"
                    type="range"
                    :min="0"
                    :max="100"
                    :value="Math.floor(volume * 100)"
                    @input="handleVolumeRangeChange"
                    step="1"
                  />
                </div>
              </div>
              <!-- 全屏按钮（隐藏） -->
              <div @click="handleFullScreen">
                <img
                  v-if="fgFullScreen"
                  width="20"
                  :src="exitFullScreenIcon"
                  alt="退出全屏"
                />
                <img
                  v-if="!fgFullScreen"
                  width="20"
                  :src="gotoFullScreenIcon"
                  alt="进入全屏"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Spin>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Flv from "flv.js";
import { Checkbox, message, Spin } from "ant-design-vue";
import { nanoid } from "nanoid";
import BaseAPI from "~/api";
import { getLoginLocalStorage } from "~/localStorage";

// 导入图标资源
import playIcon from "~/assets/icons/play.svg";
import pauseIcon from "~/assets/icons/pause.svg";
import volumeDisableIcon from "~/assets/icons/volumeDisable.svg";
import volumeZeroIcon from "~/assets/icons/volumeZero.svg";
import volumeLowIcon from "~/assets/icons/volumeLow.svg";
import volumeMiddleIcon from "~/assets/icons/volumeMiddle.svg";
import volumeHighIcon from "~/assets/icons/volumeHigh.svg";
import exitFullScreenIcon from "~/assets/icons/exit-full-screen.svg";
import gotoFullScreenIcon from "~/assets/icons/goto-full-screen.svg";
import videoBackground from "~/assets/icons/video-background.png";

interface FlvMediaInfo {
  duration: number;
  hasAudio: boolean;
}

interface VodProp {
  mediaDataGetUrl: string;
  playerId: string;
  fgPlay: boolean;
  fgMuted: boolean;
  volume: number;
  duration: number;
  offsetTime: number;
}

const props = defineProps<{
  /**
   * eg. http://127.0.0.1:8080/cameraRecord/getMediaInfo/:camerRecordId
   *     or http://127.0.0.1:8080/cameraRecord/getMediaInfo/:fileName
   */
  mediaInfoGetUrl: string;
  /**
   * eg. http://127.0.0.1:8080/cameraRecord/start/:camerRecordId
   *     or http://127.0.0.1:8080/cameraRecord/start/:fileName
   */
  mediaDataGetUrl: string;
  /**
   * eg. http://127.0.0.1:8080/cameraRecord/fetch
   */
  playTimeNotifyUrl: string;
}>();

// 状态定义
const hasAudio = ref(true);
const loading = ref(false);
const showVideoElement = ref(true);
const videoElementRef = ref<HTMLVideoElement>();
const lockRef = ref(false);

const fgMuted = ref(false);
const fgPlay = ref(false);
const fgFullScreen = ref(false);
const volume = ref(1);
const duration = ref(0);
const currentTime = ref(0);
const playerId = ref(nanoid());
const offsetTime = ref(0);
const mouseMoveOnVideo = ref(false);
const playerRef = ref<Flv.Player>();

// 计算属性
const durationSec = computed(() => {
  return Math.floor(duration.value / 1000);
});

const step = computed(() => {
  if (durationSec.value < 100) {
    return 1;
  }
  return Math.floor(durationSec.value / 100);
});

const volumeIconSrc = computed(() => {
  if (fgMuted.value) {
    return volumeDisableIcon;
  }
  if (volume.value === 0) {
    return volumeZeroIcon;
  }
  if (volume.value >= 0.75) {
    return volumeHighIcon;
  }
  if (volume.value >= 0.5) {
    return volumeMiddleIcon;
  }
  return volumeLowIcon;
});

const currentTimeDisplay = computed(() => {
  return timeDisplay(currentTime.value + offsetTime.value);
});

const durationDisplay = computed(() => {
  return timeDisplay(durationSec.value);
});

// 工具函数
const timeDisplay = (durationSec: number): string => {
  durationSec = Math.floor(durationSec);
  if (durationSec >= 1 * 60 * 60) {
    const hour = Math.floor(durationSec / (60 * 60));
    const m = Math.floor((durationSec % (60 * 60)) / 60);
    const s = (durationSec % (60 * 60)) % 60;
    return `${hour}:${m}:${s}`;
  } else if (durationSec >= 60) {
    const m = Math.floor((durationSec % (60 * 60)) / 60);
    const s = (durationSec % (60 * 60)) % 60;
    return `${m}:${s}`;
  } else {
    const s = durationSec;
    return `00:${s}`;
  }
};

// 事件处理
const handleHasAudioChange = (e: any) => {
  const newHasAudio = e.target.checked;
  hasAudio.value = newHasAudio;
  const newFgMuted = !newHasAudio;
  fgMuted.value = newFgMuted;
  showVideoElement.value = false;
  playerId.value = nanoid();
  fgPlay.value = false;

  const vodProp: VodProp = {
    mediaDataGetUrl: props.mediaDataGetUrl,
    playerId: playerId.value,
    fgPlay: fgPlay.value,
    fgMuted: fgMuted.value,
    volume: volume.value,
    duration: duration.value,
    offsetTime: offsetTime.value,
  };
  flvLoad(vodProp);
};

const handleRangeChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  let value = parseInt(target.value);
  console.log(value);

  const buffered = playerRef.value?.buffered;
  if (buffered && buffered.length > 0) {
    if (
      value <= buffered.start(0) + offsetTime.value ||
      value >= buffered.end(0) + offsetTime.value
    ) {
      if (!lockRef.value) {
        lockRef.value = true;
        offsetTime.value = value;
        playerId.value = nanoid();

        const vodProp: VodProp = {
          mediaDataGetUrl: props.mediaDataGetUrl,
          playerId: playerId.value,
          fgPlay: fgPlay.value,
          fgMuted: fgMuted.value,
          volume: volume.value,
          duration: duration.value,
          offsetTime: offsetTime.value,
        };
        flvLoad(vodProp);

        setTimeout(() => {
          lockRef.value = false;
        }, 500);
      }
    } else {
      if (!lockRef.value && playerRef.value) {
        playerRef.value.currentTime = value - offsetTime.value;
        const seekSecond = Math.floor(value);
        const videoUrl = `${props.playTimeNotifyUrl}?playerId=${playerId.value}&seekSecond=${seekSecond}`;
        BaseAPI.GET(videoUrl);
      }
    }
  }
};

const handleFullScreen = () => {
  if(fgFullScreen.value){
    
  }
  fgFullScreen.value = !fgFullScreen.value;
};

const handleVolumeClick = () => {
  if (!hasAudio.value) {
    return;
  }
  if (videoElementRef.value) {
    videoElementRef.value.muted = !videoElementRef.value.muted;
  }
  fgMuted.value = !fgMuted.value;
};

const handleVolumeRangeChange = (e: Event) => {
  if (!hasAudio.value) {
    return;
  }
  const target = e.target as HTMLInputElement;
  const newVolume = parseInt(target.value) / 100;
  volume.value = newVolume;
  if (videoElementRef.value) {
    videoElementRef.value.volume = newVolume;
  }
};

const handleVideoTogglePlay = () => {
  if (videoElementRef.value) {
    if (!playerRef.value) {
      offsetTime.value = 0;
      playerId.value = nanoid();

      const vodProp: VodProp = {
        mediaDataGetUrl: props.mediaDataGetUrl,
        playerId: playerId.value,
        fgPlay: fgPlay.value,
        fgMuted: fgMuted.value,
        volume: volume.value,
        duration: duration.value,
        offsetTime: offsetTime.value,
      };
      flvLoad(vodProp);
      return;
    }

    if (videoElementRef.value.paused) {
      videoElementRef.value.play().catch((e: any) => {
        console.error("play error:", e);
        message.error("播放出错啦");
        fgPlay.value = false;
        destroyPlayer();
      });
    } else {
      videoElementRef.value.pause();
    }
  }
};

const handleMouseMove = () => {
  mouseMoveOnVideo.value = true;
};

const handleMouseLeave = () => {
  mouseMoveOnVideo.value = false;
};

// FLV 播放器核心逻辑
const destroyPlayer = () => {
  if (playerRef.value) {
    playerRef.value.pause();
    playerRef.value.unload();
    playerRef.value.detachMediaElement();
    playerRef.value.destroy();
    playerRef.value = undefined;
  }
};

const flvLoad = (vodProp: VodProp) => {
  showVideoElement.value = true;
  const seekSecond = Math.floor(vodProp.offsetTime);
  const videoUrl = `${vodProp.mediaDataGetUrl}?playerId=${vodProp.playerId}&seekSecond=${seekSecond}`;

  const mediaDataSource: Flv.MediaDataSource = {
    type: "flv",
    duration: vodProp.duration,
    url: videoUrl,
    hasAudio: !vodProp.fgMuted,
  };

  console.log("MediaDataSource", mediaDataSource);

  const element = videoElementRef.value;
  if (!element) {
    message.error("视频元素未准备好");
    return;
  }

  destroyPlayer();

  const session = getLoginLocalStorage();
  if (!session || !session.token) {
    message.error("获取 token 失败");
    return;
  }

  playerRef.value = Flv.createPlayer(mediaDataSource, {
    isLive: false,
    enableWorker: false,
    lazyLoad: true,
    lazyLoadMaxDuration: 5 * 60 * 60,
    lazyLoadRecoverDuration: 5 * 60 * 60,
    headers: {
      Authorization: session.token,
    },
  });

  playerRef.value.on(Flv.Events.ERROR, (errorType, errorDetail, errorInfo) => {
    console.log("errorType:", errorType);
    console.log("errorDetail:", errorDetail);
    console.log("errorInfo:", errorInfo);
  });

  element.addEventListener("timeupdate", () => {
    currentTime.value = element.currentTime;
  });

  element.addEventListener("pause", () => {
    fgPlay.value = false;
  });

  element.addEventListener("play", () => {
    fgPlay.value = true;
  });

  element.addEventListener("volumechange", () => {
    console.log("volume:", element.volume);
    volume.value = element.volume;
  });

  element.addEventListener("seeking", (e) => {
    console.log("开始移动进度条", e);
  });

  playerRef.value.attachMediaElement(element);
  playerRef.value.load();
  playerRef.value.volume = vodProp.volume;

  if (vodProp.fgPlay) {
    const playPromise = playerRef.value.play();
    if (playPromise && typeof (playPromise as any).catch === "function") {
      (playPromise as Promise<void>).catch((e: any) => {
        console.error("play error:", e);
        message.error("播放出错啦");
        fgPlay.value = false;
        destroyPlayer();
      });
    }
  }
};

// 生命周期
onMounted(() => {
  loading.value = true;
  BaseAPI.GET<FlvMediaInfo>(props.mediaInfoGetUrl)
    .then((mediaInfo) => {
      duration.value = mediaInfo.duration;
      hasAudio.value = mediaInfo.hasAudio;
      fgMuted.value = !mediaInfo.hasAudio;

      const vodProp: VodProp = {
        mediaDataGetUrl: props.mediaDataGetUrl,
        playerId: playerId.value,
        fgPlay: fgPlay.value,
        fgMuted: fgMuted.value,
        volume: volume.value,
        duration: duration.value,
        offsetTime: offsetTime.value,
      };
      flvLoad(vodProp);
    })
    .catch((e) => {
      message.error("获取时长失败");
    })
    .finally(() => {
      loading.value = false;
    });
});

onBeforeUnmount(() => {
  destroyPlayer();
});
</script>

<style scoped>
.vod-player {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
}

.audio-option {
  margin-bottom: 10px;
}

.checkbox-label {
  display: flex;
  gap: 5px;
}

.hint {
  color: #999;
  font-size: 12px;
}

.video-wrapper {
  position: relative;
  width: 100%;
}

.centered-video {
  display: block;
  width: 100%;
}

.center-play-button {
  position: absolute;
  top: 45%;
  left: 45%;
  color: white;
  padding: 0 5px;
  cursor: pointer;
}

.control-bar {
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
  color: white;
  padding: 0 5px;
  transition: opacity 0.3s;
}

.control-bar.hidden {
  opacity: 0;
  pointer-events: none;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.progress-container {
  display: flex;
  align-items: center;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.play-btn {
  cursor: pointer;
}

.time-display {
  flex: 1;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-icon {
  cursor: pointer;
}

.range-input {
  width: 100%;
  height: 2px;
  cursor: pointer;
}

.volume-slider {
  width: 100px;
}
</style>

