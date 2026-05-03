<template>
  <div class="history-list-container">
    <!-- 头部：返回按钮、标题、刷新 -->
    <div class="history-header">
      <Button @click="$emit('back')">
        <template #icon><ArrowLeftOutlined /></template>
        返回
      </Button>
      <div class="history-title-section">
        <h2 class="history-title">{{ camera?.name || "主播" }}</h2>
        <p class="history-subtitle">
          {{ camera?.clientName ? `所属大厅：${camera.clientName}` : "" }}
        </p>
      </div>
      <Button @click="refreshList" :loading="loading">
        <template #icon><ReloadOutlined /></template>
        刷新
      </Button>
    </div>

    <!-- 日期搜索栏 -->
    <div class="history-search-bar">
      <DatePicker
        v-model:value="selectedDate"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        style="width: 200px"
        @change="handleDateChange"
      />
      <Button
        type="primary"
        @click="handleSearchByDate"
        :disabled="!selectedDate"
      >
        <template #icon><SearchOutlined /></template>
        搜索
      </Button>
      <Button v-if="selectedDate" @click="handleClearDateFilter">
        清除筛选
      </Button>
    </div>

    <Alert
      v-if="errorMessage"
      type="warning"
      show-icon
      :message="errorMessage"
    />

    <Spin :spinning="loading && files.length === 0">
      <div
        v-if="files.length > 0"
        class="history-list-content"
        ref="listRef"
        @scroll="handleScroll"
      >
        <Card
          v-for="file in files"
          :key="file.idCameraRecord || file.fileName || file.tempFileName"
          class="history-file-card"
          :body-style="{ padding: '14px' }"
        >
          <div class="history-file-card__content">
            <div class="history-file-card__info">
              <div class="history-file-card__name">
                <FileOutlined class="history-file-card__icon" />
                <div>
                  <div>开始时间：{{ formatTime(file.startTime) }}</div>
                  <div>终止时间：{{ formatTime(file.endTime) }}</div>
                </div>
              </div>
              <div v-if="file.duration" class="history-file-card__duration">
                时长：{{ formatDuration(file.duration) }}
              </div>
              <div class="history-file-card__time">
                文件名：{{ getFileName(file) }}
              </div>
            </div>
            <div class="history-file-card__actions">
              <Tag v-if="file.fgTemp" color="blue">临时文件</Tag>
              <Tag v-if="file.fgRemove" color="red">已删除</Tag>
              <Button
                type="primary"
                :disabled="file.fgRemove === true"
                @click="handlePlay(file)"
              >
                <template #icon><PlayCircleOutlined /></template>
                播放
              </Button>
            </div>
          </div>
        </Card>

        <!-- 加载更多按钮 -->
        <div v-if="hasMore" class="load-more-container">
          <Button @click="loadMoreFiles" :loading="isLoadingMore" block>
            {{ isLoadingMore ? "加载中..." : "加载更多" }}
          </Button>
        </div>
        <div
          v-else-if="!isLoadingMore && files.length > 0"
          class="no-more-indicator"
        >
          没有更多数据了
        </div>
      </div>
      <Empty v-else-if="!loading" description="暂无历史文件" />
    </Spin>

    <!-- 回到顶部按钮 -->
    <Button
      v-if="showBackToTop"
      class="back-to-top-btn"
      type="primary"
      shape="circle"
      size="large"
      @click="scrollToTop"
    >
      <template #icon><ArrowUpOutlined /></template>
    </Button>

    <!-- 视频播放模态框 -->
    <Modal
      v-model:open="playModalOpen"
      :title="selectedFile ? getFileName(selectedFile) : '历史播放'"
      :footer="null"
      width="800px"
      destroy-on-close
      @cancel="handleCloseModal"
    >
      <VodPlayer
        v-if="selectedFile"
        ref="playerRef"
        :mediaInfoGetUrl="
          getMediaInfoUrl(selectedFile, props.camera?.clientInfo.idClientInfo)
        "
        :mediaDataGetUrl="
          getMediaDataUrl(selectedFile, props.camera?.clientInfo.idClientInfo)
        "
        :playTimeNotifyUrl="
          getPlayTimeNotifyUrl(
            selectedFile,
            props.camera?.clientInfo.idClientInfo,
          )
        "
        @error="handlePlayerError"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import dayjs, { Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Modal,
  Spin,
  Tag,
  message,
} from "ant-design-vue";
import {
  ArrowLeftOutlined,
  ArrowUpOutlined,
  FileOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import { LiveHistoryFile } from "../../api/liveApp";
import FlvVideo from "../../components/FlvVideo.vue";
import BaseAPI from "~/api";
import { pickList } from "../../api/liveApp";
import Env from "~/conf/env";
import { getLoginLocalStorage } from "~/localStorage";

// 定义属性
interface CameraInfo {
  name: string;
  clientName?: string;
  camera: {
    id?: string;
    code?: string;
  };
  clientInfo: {
    idClientInfo?: string;
    clientCode?: string;
  };
}

const props = defineProps<{
  camera: CameraInfo | null;
}>();

// 定义事件
const emit = defineEmits<{
  (e: "back"): void;
}>();

// 状态定义
const loading = ref(false);
const errorMessage = ref("");
const files = ref<LiveHistoryFile[]>([]);
const selectedFile = ref<LiveHistoryFile>();
const playModalOpen = ref(false);
const playerRef = ref<InstanceType<typeof FlvVideo>>();

// 分页和搜索相关状态
const selectedDate = ref<string>("");
const currentPage = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);
const isLoadingMore = ref(false);
const listRef = ref<HTMLElement>();
const showBackToTop = ref(false);

// 工具函数
const getFileName = (file: LiveHistoryFile) =>
  file.fileName || file.tempFileName || "未命名历史文件";

// 构建 VodPlayer 所需的 URL
const getMediaInfoUrl = (
  file: LiveHistoryFile,
  idClientInfo?: string,
): string => {
  if (!file) {
    return "";
  }
  return `/clientCameraRecord/getMediaInfo/${idClientInfo}/${file.idCameraRecord}`;
};

const getMediaDataUrl = (
  file: LiveHistoryFile,
  idClientInfo?: string,
): string => {
  if (!file) {
    return "";
  }
  return `${Env.directServerUrl}/clientCameraRecord/start/${idClientInfo}/${file.idCameraRecord}`;
};

const getPlayTimeNotifyUrl = (
  file: LiveHistoryFile,
  idClientInfo?: string,
): string => {
  if (!file) {
    return "";
  }
  return `/clientCameraRecord/fetch/${file.idCameraRecord}`;
};

const formatTime = (date?: string) => {
  if (!date) {
    return "未知时间";
  }
  return `${formatDate(date)}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) {
    return "未知时间";
  }
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
};

const formatDuration = (millSeconds: number) => {
  const hours = Math.floor(millSeconds / 1000 / 3600);
  const minutes = Math.floor(((millSeconds / 1000) % 3600) / 1000 / 60);
  const secs = Math.floor((millSeconds / 1000) % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// 核心逻辑：获取历史文件
const fetchHistoryFilesWithParams = async (
  pageIndex: number,
): Promise<LiveHistoryFile[]> => {
  if (!props.camera) return [];

  const mockClientInfo = {
    idClientInfo:
      props.camera.clientInfo.idClientInfo ||
      props.camera.clientInfo.clientCode,
    clientCode:
      props.camera.clientInfo.idClientInfo ||
      props.camera.clientInfo.clientCode,
  };

  const mockCamera = {
    id: props.camera.camera.id || props.camera.camera.code,
    code: props.camera.camera.id || props.camera.camera.code,
  };

  // 构建查询参数
  const filterNodes: any[] = [
    {
      operatorCode: "equal",
      name: "idCamera",
      filterParams: [mockCamera.id],
    },
  ];

  // 如果选择了日期，添加时间范围过滤
  if (selectedDate.value) {
    const startDate = dayjs(selectedDate.value).startOf("day");
    const endDate = dayjs(selectedDate.value).endOf("day");

    filterNodes.push({
      operatorCode: "greaterThan",
      name: "startTime",
      filterParams: [startDate],
    });
    filterNodes.push({
      operatorCode: "lessThan",
      name: "startTime",
      filterParams: [endDate],
    });
  }

  const param = {
    pageIndex,
    pageSize: pageSize.value,
    logicNode: {
      logicOperatorCode: "and",
      filterNodes,
    },
    orders: [{ property: "startTime", direction: "desc", ignoreCase: false }],
  };

  const path = `/clientCameraRecord/aqPage/${mockClientInfo.idClientInfo}`;
  const res = await BaseAPI.POST(path, param);
  return pickList<LiveHistoryFile>(res);
};

const loadFiles = async (isRefresh = false) => {
  if (!props.camera) return;

  const session = getLoginLocalStorage();
  errorMessage.value = "";

  if (!session?.token) {
    files.value = [];
    return;
  }

  // 如果是刷新，重置页码
  if (isRefresh) {
    currentPage.value = 1;
    files.value = [];
    hasMore.value = true;
  }

  // 首次加载或刷新时显示全屏 loading
  if (currentPage.value === 1 && !isLoadingMore.value) {
    loading.value = true;
  }

  try {
    const newFiles = await fetchHistoryFilesWithParams(currentPage.value);

    if (isRefresh || currentPage.value === 1) {
      files.value = newFiles;
    } else {
      files.value = [...files.value, ...newFiles];
    }

    // 判断是否还有更多数据
    hasMore.value = newFiles.length >= pageSize.value;
  } catch (err) {
    errorMessage.value = `历史文件获取失败：${String(err)}`;
    if (currentPage.value === 1) {
      files.value = [];
    }
  } finally {
    loading.value = false;
  }
};

// 加载更多数据
const loadMoreFiles = async () => {
  if (isLoadingMore.value || !hasMore.value || !props.camera) return;

  isLoadingMore.value = true;
  currentPage.value += 1;

  try {
    const newFiles = await fetchHistoryFilesWithParams(currentPage.value);

    if (newFiles.length > 0) {
      files.value = [...files.value, ...newFiles];
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    message.error(`加载更多数据失败：${String(err)}`);
    currentPage.value -= 1; // 回滚页码
  } finally {
    isLoadingMore.value = false;
  }
};

// 事件处理
const refreshList = () => {
  loadFiles(true);
};

const handleDateChange = (date: string | Dayjs) => {
  if (typeof date === "string") {
    selectedDate.value = date;
  } else if (date) {
    selectedDate.value = dayjs(date).format("YYYY-MM-DD");
  } else {
    selectedDate.value = "";
  }
};

const handleSearchByDate = async () => {
  if (!selectedDate.value) {
    message.warning("请先选择日期");
    return;
  }
  // 重置分页并重新加载
  currentPage.value = 1;
  files.value = [];
  hasMore.value = true;
  await loadFiles(true);
};

const handleClearDateFilter = () => {
  selectedDate.value = "";
  currentPage.value = 1;
  files.value = [];
  hasMore.value = true;
  loadFiles(true);
};

// 回到顶部功能
const scrollToTop = () => {
  if (listRef.value) {
    listRef.value.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  console.log("Scroll top:", target.scrollTop);
  if (!target) return;

  // 控制回到顶部按钮的显示/隐藏
  showBackToTop.value = target.scrollTop > 300;
  console.log(
    "Scroll top:",
    target.scrollTop,
    "Show button:",
    showBackToTop.value,
  );
};

const handlePlay = (file: LiveHistoryFile) => {
  selectedFile.value = file;
  playModalOpen.value = true;
};

const handleCloseModal = () => {
  // playerRef.value?.stop();
  playModalOpen.value = false;
};

const handlePlayerError = (error: string) => {
  message.error(error);
};

// 监听模态框打开以自动播放
watch(playModalOpen, async (open) => {
  if (open) {
    await nextTick();
    // window.setTimeout(() => {
    //   playerRef.value?.play();
    // }, 0);
  }
});

// 初始加载
// 注意：这里使用 watch 监听 camera 变化来触发加载，或者由父组件控制
watch(
  () => props.camera,
  (newVal) => {
    if (newVal) {
      // 重置状态
      selectedDate.value = "";
      currentPage.value = 1;
      files.value = [];
      hasMore.value = true;
      showBackToTop.value = false;
      loadFiles(true);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  // playerRef.value?.stop();
});
</script>

<style scoped>
.history-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%; /* 使用百分比高度，让flex布局自动计算 */
  overflow: hidden; /* 防止外层滚动 */
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.history-title-section {
  flex: 1;
  text-align: left;
}

.history-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  color: #111827;
}

.history-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.history-search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.history-list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  max-height: calc(100vh - 200px);
  min-height: 0; /* 关键：允许flex子项正确收缩 */
}

.history-file-card {
  border-radius: 8px;
}

.history-file-card__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.history-file-card__info {
  flex: 1;
  min-width: 0;
}

.history-file-card__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #111827;
  overflow-wrap: anywhere;
}

.history-file-card__icon {
  font-size: 16px;
  color: #1677ff;
}

.history-file-card__time,
.history-file-card__duration {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.history-file-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.load-more-container {
  text-align: center;
  padding: 12px 0;
}

.no-more-indicator {
  text-align: center;
  padding: 12px;
  color: #9ca3af;
  font-size: 12px;
}

.back-to-top-btn {
  position: fixed;
  right: 24px;
  bottom: 70px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 640px) {
  .back-to-top-btn {
    right: 16px;
    bottom: 70px;
  }

  .history-file-card__content {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-file-card__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
