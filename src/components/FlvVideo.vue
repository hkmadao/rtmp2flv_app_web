<template>
  <video
    ref="videoElementRef"
    class="flv-video"
    controls
    playsinline
    webkit-playsinline
  >
    当前 WebView 不支持 HTML5 video。
  </video>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Flv from "flv.js";

const props = withDefaults(
  defineProps<{
    url?: string;
    hasAudio?: boolean;
    autoPlay?: boolean;
  }>(),
  {
    hasAudio: true,
    autoPlay: false,
  }
);

const emit = defineEmits<{
  play: [];
  stop: [];
  error: [message: string];
}>();

const videoElementRef = ref<HTMLVideoElement>();
const playerRef = ref<Flv.Player>();
const isPlaying = ref(false);

const destroyPlayer = () => {
  if (playerRef.value) {
    playerRef.value.pause();
    playerRef.value.unload();
    playerRef.value.detachMediaElement();
    playerRef.value.destroy();
    playerRef.value = undefined;
  }
  if (videoElementRef.value) {
    videoElementRef.value.removeAttribute("src");
    videoElementRef.value.load();
  }
  isPlaying.value = false;
};

const stop = () => {
  destroyPlayer();
  emit("stop");
};

const play = async () => {
  if (!props.url) {
    emit("error", "视频地址为空");
    return;
  }
  if (!Flv.isSupported()) {
    emit("error", "当前 WebView 不支持 HTTP-FLV 播放");
    return;
  }
  if (!videoElementRef.value) {
    emit("error", "播放器尚未准备好");
    return;
  }

  destroyPlayer();

  const player = Flv.createPlayer(
    {
      type: "flv",
      url: props.url,
      hasAudio: props.hasAudio,
      isLive: true,
    },
    {
      enableWorker: false,
      lazyLoadMaxDuration: 3 * 60,
      seekType: "range",
    }
  );

  player.on(Flv.Events.ERROR, (_errorType, errorDetail) => {
    emit("error", `播放失败：${String(errorDetail || "未知错误")}`);
  });

  player.attachMediaElement(videoElementRef.value);
  player.load();
  playerRef.value = player;

  try {
    await player.play();
    isPlaying.value = true;
    emit("play");
  } catch (err) {
    destroyPlayer();
    emit("error", `播放失败：${String(err)}`);
  }
};

watch(
  () => props.url,
  () => {
    if (isPlaying.value) {
      stop();
    }
  }
);

onMounted(() => {
  if (props.autoPlay) {
    play();
  }
});

onBeforeUnmount(() => {
  destroyPlayer();
});

defineExpose({
  play,
  stop,
  isPlaying,
});
</script>

<style scoped>
.flv-video {
  display: block;
  width: 100%;
  min-height: 180px;
  background: #111827;
  border-radius: 8px;
}
</style>
