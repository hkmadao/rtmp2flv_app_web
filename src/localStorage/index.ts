import { nanoid } from "nanoid";

export type TLiveInfo = {
  id?: string;
  name?: string;
  mediaInfoUrl?: string;
  url?: string;
};

const initData: TLiveInfo[] = [
  {
    id: '1',
    name: '门口',
    mediaInfoUrl: 'https://192.168.1.11:9090/live/getMediaInfo/temp/camera-01/123456.flv',
    url: 'https://192.168.1.11:9090/live/temp/camera-01/123456.flv',
  },
  {
    id: '2',
    name: '厅',
    mediaInfoUrl: 'https://192.168.1.10:9090/live/getMediaInfo/temp/camera-02/123456.flv',
    url: 'https://192.168.1.10:9090/live/temp/camera-02/123456.flv',
  }
];

export const clearLiveInfoList = () => {
  window.localStorage.removeItem('liveInfoList');
};

export const setLiveInfoList = (liveInfoList: TLiveInfo[]) => {
  window.localStorage.setItem('liveInfoList', JSON.stringify(liveInfoList));
};

export const getLiveInfoList = () => {
  const liveInfoListStr = window.localStorage.getItem('liveInfoList');
  if (!liveInfoListStr) {
    const liveInfoList: TLiveInfo[] = JSON.parse(JSON.stringify(initData));
    liveInfoList.forEach(item => {
      item.id = nanoid();
    })
    window.localStorage.setItem('liveInfoList', JSON.stringify(liveInfoList));
  }
  const liveInfoList: TLiveInfo[] = JSON.parse(window.localStorage.getItem('liveInfoList')!);
  return liveInfoList;
};

export const getLiveInfoById = (id: string) => {
  const liveInfoListStr = window.localStorage.getItem('liveInfoList');
  if (!liveInfoListStr) {
    return;
  }
  const liveInfoList: TLiveInfo[] = JSON.parse(window.localStorage.getItem('liveInfoList')!);

  return liveInfoList.find(item => item.id === id);
};

export const saveOrUpdateLiveInfo = (liveInfo: TLiveInfo) => {
  const liveInfoListStr = window.localStorage.getItem('liveInfoList');
  if (liveInfoListStr) {
    const liveInfoList: TLiveInfo[] = JSON.parse(liveInfoListStr);
    const oldIndex = liveInfoList.findIndex(item => item.id === liveInfo.id);
    if (oldIndex === -1) {
      liveInfoList.push(liveInfo);
    } else {
      liveInfoList.splice(oldIndex, 1, liveInfo);
    }
    window.localStorage.setItem('liveInfoList', JSON.stringify(liveInfoList));
  }
};

export const deleteLiveInfo = (id: string) => {
  const liveInfoListStr = window.localStorage.getItem('liveInfoList');
  if (liveInfoListStr) {
    const liveInfoList: TLiveInfo[] = JSON.parse(liveInfoListStr);
    const newLiveInfoList = liveInfoList.filter(item => item.id !== id);
    window.localStorage.setItem('liveInfoList', JSON.stringify(newLiveInfoList));
  }
}
