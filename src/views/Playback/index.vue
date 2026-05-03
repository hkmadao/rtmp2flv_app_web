<template>
  <section class="playback-page">
    <!-- 主播列表视图 -->
    <div v-if="!showHistoryList" class="view-container">
      <div class="playback-page__toolbar">
        <div>
          <h1 class="playback-page__title">回看</h1>
          <p class="playback-page__summary">选择主播查看历史录像文件。</p>
        </div>
        <Button @click="loadCameras" :loading="loading">
          <template #icon><ReloadOutlined /></template>
          刷新
        </Button>
      </div>

      <Alert
        v-if="!session"
        type="info"
        show-icon
        message="请先在“我的”页面登录后查看回看。"
      />
      <Alert
        v-if="errorMessage"
        type="warning"
        show-icon
        :message="errorMessage"
      />

      <Spin :spinning="loading">
        <div v-if="cameraCards.length > 0" class="playback-page__grid">
          <Card
            v-for="camera in cameraCards"
            :key="camera.key"
            class="camera-card"
            :body-style="{ padding: '16px' }"
          >
            <div class="camera-card__header">
              <div class="camera-card__info">
                <h3 class="camera-card__title">{{ camera.name }}</h3>
                <p class="camera-card__code">
                  {{ camera.camera.code || camera.camera.id || "无编号" }}
                </p>
                <p v-if="camera.clientName" class="camera-card__client">
                  所属大厅：{{ camera.clientName }}
                </p>
              </div>
              <Tag :color="camera.camera.onlineStatus ? 'green' : 'red'">
                {{ camera.camera.onlineStatus ? "在线" : "离线" }}
              </Tag>
            </div>

            <div class="camera-card__actions">
              <Button
                type="primary"
                block
                @click="handleViewHistory(camera)"
                :loading="camera.loading"
              >
                <template #icon><FileTextOutlined /></template>
                查看历史文件
              </Button>
            </div>
          </Card>
        </div>
        <Empty v-else-if="!loading" description="暂无主播" />
      </Spin>
    </div>

    <!-- 历史文件列表视图 (使用提取的组件) -->
    <HistoryList
      v-else
      :camera="selectedCamera"
      @back="handleBackToList"
      class="history-list-wrapper"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  Alert,
  Button,
  Card,
  Empty,
  Spin,
  Tag,
} from "ant-design-vue";
import {
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import { getLoginSession } from "../../session";
import {
  TCamera,
  TClientInfo,
  fetchClientCameras,
  fetchClientInfos,
} from "../../api/liveApp";
// 引入新组件
import HistoryList from "./HistoryList.vue";

type CameraCard = {
  key: string;
  name: string;
  camera: TCamera;
  clientInfo: TClientInfo;
  clientName: string;
  loading: boolean;
};

const session = ref(getLoginSession());
const loading = ref(false);
const errorMessage = ref("");
const cameraCards = ref<CameraCard[]>([]);

// 历史文件相关状态
const showHistoryList = ref(false);
const selectedCamera = ref<CameraCard | null>(null);

const getClientInfoName = (clientInfo: TClientInfo, index: number) =>
  clientInfo.name ||
  clientInfo.clientCode ||
  clientInfo.idClientInfo ||
  `直播大厅 ${index + 1}`;

const getCameraKey = (camera: TCamera, clientKey: string, index: number) =>
  camera.id || camera.code || `${clientKey}-camera-${index}`;

const getCameraName = (camera: TCamera, index: number) =>
  camera.name || camera.code || camera.id || `主播 ${index + 1}`;

const loadCameras = async () => {
  session.value = getLoginSession();
  errorMessage.value = "";

  if (!session.value?.token) {
    cameraCards.value = [];
    return;
  }

  loading.value = true;
  try {
    const clientInfos = await fetchClientInfos();
    const allCameras: CameraCard[] = [];

    for (const clientInfo of clientInfos) {
      try {
        const cameras = await fetchClientCameras(clientInfo);
        const clientName = getClientInfoName(
          clientInfo,
          clientInfos.indexOf(clientInfo),
        );
        const clientKey =
          clientInfo.idClientInfo ||
          clientInfo.clientCode ||
          `client-${clientInfos.indexOf(clientInfo)}`;

        cameras.forEach((camera, index) => {
          allCameras.push({
            key: getCameraKey(camera, clientKey, index),
            name: getCameraName(camera, index),
            camera,
            clientInfo,
            clientName,
            loading: false,
          });
        });
      } catch (err) {
        console.error(`获取直播大厅 ${clientInfo.name} 的主播失败:`, err);
      }
    }

    cameraCards.value = allCameras;
  } catch (err) {
    errorMessage.value = `主播列表获取失败：${String(err)}`;
    cameraCards.value = [];
  } finally {
    loading.value = false;
  }
};

const handleViewHistory = (camera: CameraCard) => {
  selectedCamera.value = camera;
  showHistoryList.value = true;
};

const handleBackToList = () => {
  showHistoryList.value = false;
  selectedCamera.value = null;
};

onMounted(() => {
  loadCameras();
});
</script>

<style scoped>
.playback-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.view-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-list-wrapper {
  flex: 1;
  min-height: 0; /* 允许flex子项收缩 */
}

.playback-page__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.playback-page__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  color: #111827;
}

.playback-page__summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.playback-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .playback-page__grid {
    grid-template-columns: 1fr;
  }
}

.camera-card {
  border-radius: 8px;
  transition: all 0.2s;
}

.camera-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
}

.camera-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.camera-card__info {
  min-width: 0;
  flex: 1;
}

.camera-card__title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  overflow-wrap: anywhere;
}

.camera-card__code,
.camera-card__client {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  overflow-wrap: anywhere;
}

.camera-card__client {
  margin-top: 2px;
}

.camera-card__actions {
  margin-top: 12px;
}
</style>