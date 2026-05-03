<template>
  <div class="pannel">
    <span :style="{ 'text-align': 'left' }">
      <Button @click="handleDelete">删除</Button>
    </span>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">名称：</div>
      <div>
        <Input v-model:value="liveInfo.name" @change="handleSave" />
      </div>
    </div>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">媒体信息请求地址：</div>
      <div>
        <Input
          v-model:value="liveInfo.mediaInfoUrl"
          @change="handleSave"
        />
      </div>
    </div>
    <div class="item">
      <div :style="{ 'text-align': 'left' }">视频地址：</div>
      <div>
        <Input v-model:value="liveInfo.url" @change="handleSave" />
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
} from "~/localStorage/shareWithMeConfig";

const { liveInfo: liveInfoProps, deleteCallback } = defineProps<{
  liveInfo: TLiveInfo;
  deleteCallback: () => void;
}>();

const liveInfo = ref<TLiveInfo>({ ...liveInfoProps });

onMounted(() => {
  liveInfo.value = { ...liveInfoProps };
});

const handleSave = () => {
  saveOrUpdateLiveInfo({ ...liveInfo.value });
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
