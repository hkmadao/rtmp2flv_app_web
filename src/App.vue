<template>
  <el-config-provider namespace="ep">
    <div class="status_bar">
      <div class="app-shell">
        <main class="app-shell__main">
          <ShareLive v-if="currentTab === 'share'" />
          <BroadcastPage v-else-if="currentTab === 'live'" />
          <PlaybackPage v-else-if="currentTab === 'playback'" />
          <MinePage v-else />
        </main>

        <nav class="bottom-nav" aria-label="底部导航">
          <button
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': currentTab === 'share' }"
            type="button"
            @click="currentTab = 'share'"
          >
            <ShareAltOutlined />
            <span>与我分享</span>
          </button>
          <button
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': currentTab === 'live' }"
            type="button"
            @click="currentTab = 'live'"
          >
            <VideoCameraOutlined />
            <span>直播</span>
          </button>
          <button
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': currentTab === 'playback' }"
            type="button"
            @click="currentTab = 'playback'"
          >
            <HistoryOutlined />
            <span>回看</span>
          </button>
          <button
            class="bottom-nav__item"
            :class="{ 'bottom-nav__item--active': currentTab === 'mine' }"
            type="button"
            @click="currentTab = 'mine'"
          >
            <UserOutlined />
            <span>我的</span>
          </button>
        </nav>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  HistoryOutlined,
  ShareAltOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons-vue";
import ShareLive from "./views/ShareWithMe/index.vue";
import BroadcastPage from "./views/Broadcast/index.vue";
import PlaybackPage from "./views/Playback/index.vue";
import MinePage from "./views/Mine/index.vue";

type TabKey = "share" | "live" | "playback" | "mine";

const currentTab = ref<TabKey>("live");
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
}

#app {
  color: var(--ep-text-color-primary);
}

.app-shell {
  height: 100vh;
  background: #f8fafc;
  overflow: hidden;
}

.app-shell__main {
  height: 100%;
  padding-bottom: calc(68px + env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 12px rgb(15 23 42 / 0.08);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
}

.bottom-nav__item svg {
  width: 20px;
  height: 20px;
}

.bottom-nav__item--active {
  color: #1677ff;
  font-weight: 600;
}

.main-container {
  height: calc(100vh - var(--ep-menu-item-height) - 3px);
}

.status_bar {
  height: var(--status-bar-height);
  width: 100%;
}
</style>

