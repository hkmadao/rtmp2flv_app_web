<template>
  <div
    :style="{
      display: 'flex',
      flex: 'auto',
      margin: '5px',
      'flex-direction': 'column',
      gap: '20px',
    }"
  >
    <div
      :style="{
        display: 'flex',
        flex: 'auto',
        'flex-direction': 'column',
        gap: '5px',
        'border-bottom': '1px solid black',
        padding: '5px 0px',
      }"
    >
      <span :style="{ display: 'flex', gap: '5px', 'text-align': 'left' }">
        <input :style="{ width: '100%' }" v-model="confValue" /><Button
          @click="handleSaveConfig"
          >导入</Button
        >
      </span>
      <span :style="{ 'text-align': 'left' }">
        <Button @click="handleCopy">复制到剪贴板</Button>
      </span>
      <span :style="{ 'text-align': 'left' }">
        <Button @click="handleDefault">默认配置</Button>
      </span>
      <span :style="{ 'text-align': 'left' }">
        <Button @click="handleAdd">添加</Button>
      </span>
    </div>
    <LiveInfoEdit
      v-for="liveInfo in liveInfoList"
      :key="liveInfo.id"
      :liveInfo="liveInfo"
      :deleteCallback="deleteCallback"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Button, message } from "ant-design-vue";
import LiveInfoEdit from "./LiveInfoEdit.vue";
import {
  clearLiveInfoList,
  getLiveInfoList,
  saveOrUpdateLiveInfo,
  setLiveInfoList,
  TLiveInfo,
} from "~/localStorage/shareWithMeConfig";
import { nanoid } from "nanoid";
const liveInfoList = ref<TLiveInfo[]>([]);
const confValue = ref("");

onMounted(() => {
  liveInfoList.value = getLiveInfoList();
});

const handleDefault = () => {
  clearLiveInfoList();
  liveInfoList.value = getLiveInfoList();
};

const handleAdd = () => {
  const newLiveInfo: TLiveInfo = {
    id: nanoid(),
    name: "",
    mediaInfoUrl: "",
    url: "",
  };
  saveOrUpdateLiveInfo(newLiveInfo);
  liveInfoList.value = getLiveInfoList();
};

const deleteCallback = () => {
  liveInfoList.value = [];
  liveInfoList.value = getLiveInfoList();
};

const handleSaveConfig = () => {
  if (!confValue.value) {
    return;
  }
  try {
    const newLiveInfoList: TLiveInfo[] = JSON.parse(confValue.value);
    newLiveInfoList.forEach((item) => {
      item.id = nanoid();
    });
    setLiveInfoList(newLiveInfoList);
    liveInfoList.value = getLiveInfoList();
    message.success("配置导入成功");
  } catch (err) {
    message.error(`配置导入失败：${String(err)}`);
  }
};

const handleCopy = () => {
  const liveInfoList = getLiveInfoList();
  navigator.clipboard
    .writeText(JSON.stringify(liveInfoList))
    .then(() => {
      message.success("复制成功");
    })
    .catch((err) => {
      message.error(`复制失败：${String(err)}`);
    });
};
</script>

<style></style>
