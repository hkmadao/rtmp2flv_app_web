<template>
  <div class="pannel">
    <span :style="{ 'text-align': 'left' }">
      <Button @click="handleDelete">删除</Button>
    </span>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">名称：</div>
      <div>
        <Input :value="liveInfo.name" @change="handleNameChange" />
      </div>
    </div>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">媒体信息请求地址：</div>
      <div>
        <Input
          :value="liveInfo.mediaInfoUrl"
          @change="handleMediaInfoUrlChange"
        />
      </div>
    </div>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">视频地址：</div>
      <div>
        <Input :value="liveInfo.url" @change="handleUrlChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Input } from "ant-design-vue";
import { onMounted, ref } from "vue";
import {
  saveOrUpdateLiveInfo,
  deleteLiveInfo,
  TLiveInfo,
  getLiveInfoById,
} from "~/localStorage";

const { liveInfo: liveInfoProps, deleteCallback } = defineProps<{
  liveInfo: TLiveInfo;
  deleteCallback: () => void;
}>();

const liveInfo = ref<TLiveInfo>(liveInfoProps);

onMounted(() => {
  liveInfo.value = liveInfoProps;
});

const handleNameChange = (e: any) => {
  const name = e.target.value;
  const liveInfoNew = getLiveInfoById(liveInfo.value.id!);
  saveOrUpdateLiveInfo({
    ...liveInfoNew,
    name: name,
  });
};

const handleMediaInfoUrlChange = (e: any) => {
  const mediaInfoUrl = e.target.value;
  const liveInfoNew = getLiveInfoById(liveInfo.value.id!);
  saveOrUpdateLiveInfo({
    ...liveInfoNew,
    mediaInfoUrl: mediaInfoUrl,
  });
};

const handleUrlChange = (e: any) => {
  const url = e.target.value;
  const liveInfoNew = getLiveInfoById(liveInfo.value.id!);
  saveOrUpdateLiveInfo({
    ...liveInfoNew,
    url: url,
  });
};

const handleDelete = () => {
  deleteLiveInfo(liveInfo.value.id!);
  deleteCallback();
};
</script>

<style>
.pannel {
  display: flex;
  gap: 5px;
  flex-direction: column;
  border-bottom: 1px solid black;
  padding: 5px 0px;
}

.item {
  display: flex;
  gap: 5px;
  flex-direction: column;
  width: 100%;
}
</style>
