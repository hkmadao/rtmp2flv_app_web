<template>
  <section class="broadcast-page">
    <div class="broadcast-page__toolbar">
      <div>
        <h1 class="broadcast-page__title">直播</h1>
        <p class="broadcast-page__summary">查看主播实时直播。</p>
      </div>
      <Button @click="loadAnchors" :loading="loading">
        <template #icon><ReloadOutlined /></template>
        刷新
      </Button>
    </div>

    <Alert
      v-if="!session"
      type="info"
      show-icon
      message="请先在“我的”页面登录后查看主播直播。"
    />
    <Alert
      v-if="errorMessage"
      type="warning"
      show-icon
      :message="errorMessage"
    />

    <Spin :spinning="loading">
      <div v-if="anchorGroups.length > 0" class="broadcast-page__groups">
        <section
          v-for="group in anchorGroups"
          :key="group.key"
          class="broadcast-page__group"
        >
          <div class="broadcast-page__group-header">
            <div>
              <h2 class="broadcast-page__group-title">{{ group.name }}</h2>
              <p v-if="group.description" class="broadcast-page__group-desc">
                {{ group.description }}
              </p>
            </div>
            <span class="broadcast-page__group-count">
              {{ group.anchors.length }} 个主播
            </span>
          </div>
          <div v-if="group.anchors.length > 0" class="broadcast-page__grid">
            <AnchorCard
              v-for="(anchor, index) in group.anchors"
              :key="anchor.id || `${group.key}-${index}`"
              :anchor="anchor"
            />
          </div>
          <Empty v-else description="该直播大厅暂无主播" />
        </section>
      </div>
      <Empty v-else-if="!loading" description="暂无主播" />
    </Spin>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Alert, Button, Empty, Spin } from "ant-design-vue";
import { ReloadOutlined } from "@ant-design/icons-vue";
import { getLoginSession } from "../../session";
import { AnchorInfo, TClientInfo, fetchAnchors, fetchClientInfos } from "../../api/liveApp";
import AnchorCard from "./AnchorCard.vue";

const session = ref(getLoginSession());
const loading = ref(false);
const errorMessage = ref("");
const anchors = ref<AnchorInfo[]>([]);
const clientInfos = ref<TClientInfo[]>([]);

type AnchorGroup = {
  key: string;
  name: string;
  description: string;
  anchors: AnchorInfo[];
};

const getHallInfo = (anchor: AnchorInfo) => anchor.camera?.clientInfo;

const getClientInfoKey = (clientInfo: TClientInfo, index: number) => (
  clientInfo.idClientInfo ||
  clientInfo.clientCode ||
  `client-info-${index}`
);

const getClientInfoName = (clientInfo: TClientInfo, index: number) => (
  clientInfo.name ||
  clientInfo.clientCode ||
  clientInfo.idClientInfo ||
  `直播大厅 ${index + 1}`
);

const getHallKey = (anchor: AnchorInfo) => {
  const hallInfo = getHallInfo(anchor);
  return (
    anchor.camera?.idClientInfo ||
    hallInfo?.idClientInfo ||
    hallInfo?.clientCode ||
    "unassigned"
  );
};

const getHallName = (anchor: AnchorInfo) => {
  const hallInfo = getHallInfo(anchor);
  return (
    hallInfo?.name ||
    hallInfo?.clientCode ||
    anchor.camera?.idClientInfo ||
    "未分配直播大厅"
  );
};

const getHallDescription = (anchor: AnchorInfo) => {
  const hallInfo = getHallInfo(anchor);
  return hallInfo?.note || "";
};

const anchorGroups = computed<AnchorGroup[]>(() => {
  const anchorBuckets = new Map<string, AnchorInfo[]>();

  anchors.value.forEach((anchor) => {
    const key = getHallKey(anchor);
    if (!anchorBuckets.has(key)) {
      anchorBuckets.set(key, []);
    }
    anchorBuckets.get(key)!.push(anchor);
  });

  const groups = clientInfos.value.map((clientInfo, index) => {
    const key = getClientInfoKey(clientInfo, index);
    const anchors = anchorBuckets.get(key) || [];
    anchorBuckets.delete(key);
    return {
      key,
      name: getClientInfoName(clientInfo, index),
      description: clientInfo.note || "",
      anchors,
    };
  });

  anchorBuckets.forEach((groupAnchors, key) => {
    if (groupAnchors.length === 0) {
      return;
    }
    const firstAnchor = groupAnchors[0];
    groups.push({
      key,
      name: getHallName(firstAnchor),
      description: getHallDescription(firstAnchor),
      anchors: groupAnchors,
    });
  });

  return groups;
});

const loadAnchors = async () => {
  session.value = getLoginSession();
  errorMessage.value = "";

  if (!session.value?.token) {
    anchors.value = [];
    clientInfos.value = [];
    return;
  }

  loading.value = true;
  try {
    const [nextClientInfos, nextAnchors] = await Promise.all([
      fetchClientInfos(),
      fetchAnchors(),
    ]);
    clientInfos.value = nextClientInfos;
    anchors.value = nextAnchors;
  } catch (err) {
    errorMessage.value = `直播大厅或主播列表获取失败：${String(err)}`;
    clientInfos.value = [];
    anchors.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAnchors();
});
</script>

<style scoped>
.broadcast-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.broadcast-page__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.broadcast-page__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  color: #111827;
}

.broadcast-page__summary {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.broadcast-page__groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.broadcast-page__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.broadcast-page__group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
  text-align: left;
}

.broadcast-page__group-title {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
  color: #111827;
  overflow-wrap: anywhere;
}

.broadcast-page__group-desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
  overflow-wrap: anywhere;
}

.broadcast-page__group-count {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
}

.broadcast-page__grid {
  display: flex;
  flex-direction: column;
  /* grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); */
  gap: 12px;
}

@media (max-width: 480px) {
  .broadcast-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
