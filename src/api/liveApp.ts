import BaseAPI from './index';
import { LoginSession, UserInfo } from '../session';

export type LoginParams = {
  username: string;
  password: string;
  remember: boolean;
};

/**直播大厅信息 */
export type TClientInfo = {
  /**客户端信息主属性 */
  idClientInfo?: string;
  /**编号 */
  clientCode?: string;
  /**注册信息签名密钥 */
  signSecret?: string;
  /**数据传输加密密钥 */
  secret?: string;
  /**备注 */
  note?: string;
  /**名称 */
  name?: string;
};

/**主播信息 */
export type AnchorInfo = {
  /**摄像头分享主属性 */
  id?: string;
  /**名称 */
  name?: string;
  /**权限码 */
  authCode?: string;
  /**启用状态 */
  enabled?: boolean;
  /**创建时间 */
  created?: string;
  /**开始时间 */
  startTime?: string;
  /**结束时间 */
  deadline?: string;
  /**摄像头 */
  camera?: TCamera;
  cameraId?: string;
};
/**摄像头 */
export type TCamera = {
  /**名称 */
  name?: string;
  /**备注 */
  note?: string;
  /**在线状态 */
  onlineStatus?: boolean;
  /**保存录像状态 */
  saveVideo?: boolean;
  /**播放权限码 */
  playAuthCode?: string;
  /**code */
  code?: string;
  /**创建时间 */
  created?: string;
  /**rtmp识别码 */
  rtmpAuthCode?: string;
  /**启用状态 */
  enabled?: boolean;
  /**摄像头主属性 */
  id?: string;
  /**直播状态 */
  live?: boolean;
  /**客户端信息主属性 */
  idClientInfo?: string;
  /**直播大厅 */
  clientInfo?: TClientInfo;
};

/**历史文件 */
export type LiveHistoryFile = {
  /**记录id */
  idCameraRecord?: string;
  /**创建时间 */
  created?: string;
  /**临时文件名称 */
  tempFileName?: string;
  /**临时文件标志 */
  fgTemp?: boolean;
  /**文件名称 */
  fileName?: string;
  /**文件删除标志 */
  fgRemove?: boolean;
  /**文件时长 */
  duration?: number;
  /**开始时间 */
  startTime?: string;
  /**结束时间 */
  endTime?: string;
  /**摄像头 */
  camera?: TCamera;
  idCamera?: string;
};

export type AnchorLiveInfo = {
  liveUrl: string;
  hasAudio?: boolean;
  onlineStatus?: boolean;
};

export const RESERVED_API_PATHS = {
  login: '/login',
  logout: '/logout',
  clientInfos: '/clientInfo/aq',
  anchors: '/cameraShare/aq',
  clientCameras: (idClient: string) => `/clientCamera/aq/${idClient}`,
  anchorLive: (anchor: AnchorInfo) => '/live/getMediaInfo/temp/camera-01/123456.flv',
  clientCameraRecords: (idClient: string) => `/clientCameraRecord/aqPage/${idClient}`,
};

const ensureApiPath = (path: string, name: string) => {
  if (!path) {
    throw new Error(`${name}接口路径未配置`);
  }
  return path;
};

export const pickList = <T>(res: unknown): T[] => {
  if (Array.isArray(res)) {
    return res;
  }
  const value = res as { dataList?: unknown; };
  if (Array.isArray(value?.dataList)) {
    return value.dataList as T[];
  }
  return [];
};

const normalizeLoginSession = (res: unknown, account: string): LoginSession => {
  const value = res as {
    token?: string;
    username?: string;
    nickName?: string;
  };
  const token = value?.token;
  if (!token) {
    throw new Error('登录接口未返回 token');
  }

  const rawUser = value;
  const userInfo: UserInfo = {
    account: account,
    username: rawUser?.username,
    nickName: rawUser?.nickName,
  };

  return { token, userInfo };
};

export const login = async (params: LoginParams) => {
  const path = ensureApiPath(RESERVED_API_PATHS.login, '登录');
  const res = await BaseAPI.POST(path, params);
  return normalizeLoginSession(res, params.username);
};

export const logout = async () => {
  const path = RESERVED_API_PATHS.logout;
  if (!path) {
    return;
  }
  await BaseAPI.POST(path, {});
};

export const fetchAnchors = async () => {
  const path = ensureApiPath(RESERVED_API_PATHS.anchors, '主播列表');
  const param = {
    orders: [{ property: 'camera.onlineStatus', direction: 'desc', ignoreCase: false }],
  };
  const res = await BaseAPI.POST(path, param);
  return pickList<AnchorInfo>(res);
};

export const fetchClientInfos = async () => {
  const path = ensureApiPath(RESERVED_API_PATHS.clientInfos, '直播大厅列表');
  const res = await BaseAPI.POST(path, {});
  return pickList<TClientInfo>(res);
};

export const fetchClientCameras = async (clientInfo: TClientInfo) => {
  const idClient = clientInfo.idClientInfo || clientInfo.clientCode;
  const path = ensureApiPath(
    idClient ? RESERVED_API_PATHS.clientCameras(idClient) : '',
    '直播大厅主播列表',
  );
  const param = {
    orders: [{ property: 'onlineStatus', direction: 'desc', ignoreCase: false }],
  };
  const res = await BaseAPI.POST(path, param);
  return pickList<TCamera>(res);
};

export const fetchAnchorLiveInfo = async (anchor: AnchorInfo) => {
  const path = ensureApiPath(RESERVED_API_PATHS.anchorLive(anchor), '主播直播信息');
  const res = await BaseAPI.GET(path);
  return <AnchorLiveInfo>res;
};

export const fetchClientCameraRecords = async (
  clientInfo: TClientInfo,
  camera: TCamera,
) => {
  const idClient = clientInfo.idClientInfo;
  const path = ensureApiPath(
    idClient ? RESERVED_API_PATHS.clientCameraRecords(idClient) : '',
    '历史直播文件列表',
  );
  const param = {
    pageIndex: 1,
    pageSize: 10,
    logicNode: {
      logicOperatorCode: 'and',
      filterNodes: [
        {
          operatorCode: 'equal',
          name: 'idCamera',
          filterParams: [camera.id],
        },
      ],
    },
    orders: [{ property: 'startTime', direction: 'desc', ignoreCase: false }],
  };
  const res = await BaseAPI.POST(path, param);
  return pickList<LiveHistoryFile>(res);
};
