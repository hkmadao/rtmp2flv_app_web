import { nanoid } from "nanoid";
import Env from "~/conf/env";

export type TLiveInfo = {
  id?: string;
  name?: string;
  mediaInfoUrl?: string;
  url?: string;
};

export type TUser = {
  id?: string;
  account?: string;
  username?: string;
  nickName?: string;
  token?: string;
};

const initData: TLiveInfo[] = [
  {
    id: '1',
    name: '门口',
    mediaInfoUrl: `/live/getMediaInfo/temp/camera-01/123456.flv`,
    url: `/live/temp/camera-01/123456.flv`,
  },
  {
    id: '2',
    name: '厅',
    mediaInfoUrl: `/live/getMediaInfo/temp/camera-02/123456.flv`,
    url: `/live/temp/camera-02/123456.flv`,
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

export const setRememberUser = (user: TUser) => {
  window.localStorage.setItem(user.username!, JSON.stringify(user));
};

export const getRememberUser = (user: TUser) => {
  if (!user.username) {
    return;
  }
  const userJson = window.localStorage.getItem(user.username);
  if (!userJson) {
    return;
  }
  return JSON.parse(userJson) as (TUser & { password: string; remember: boolean });
};

export const clearRememberUser = (user: TUser) => {
  window.localStorage.removeItem(user.username!);
};
