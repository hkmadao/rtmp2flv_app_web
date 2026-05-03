import { TUser } from "./model";

export type UserInfo = {
  account?: string;
  username?: string;
  nickName?: string;
};

export type LoginStorage = {
  token: string;
  userInfo: UserInfo;
};

const loginLocalStorageKey = 'loginStorage';

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

export const clearLocalStorageStore = () => {
  window.localStorage.removeItem('user');
  window.localStorage.removeItem(loginLocalStorageKey);
};

export const setLonginUser = (user: TUser) => {
  window.localStorage.setItem('user', JSON.stringify(user));
};

export const setLoginLocalStorage = (session: LoginStorage) => {
  window.localStorage.setItem(loginLocalStorageKey, JSON.stringify(session));
  setLonginUser({
    account: session.userInfo.account,
    username: session.userInfo.username,
    nickName: session.userInfo.nickName,
    token: session.token,
  });
};

export const clearLoginLocalStorage = () => {
  window.localStorage.removeItem(loginLocalStorageKey);
  const user = getLonginUser();
  setLonginUser({ ...user, token: undefined });
  clearRememberUser(user);
};

export const getLoginLocalStorage: () => LoginStorage | undefined = () => {
  const sessionStr = window.localStorage.getItem(loginLocalStorageKey);
  if (!sessionStr) {
    return undefined;
  }
  try {
    return <LoginStorage>JSON.parse(sessionStr);
  } catch (err) {
    window.localStorage.removeItem(loginLocalStorageKey);
    return undefined;
  }
};

export const getAuthToken = () => {
  const session = getLoginLocalStorage();
  if (session?.token) {
    return session.token;
  }
  const user = getLonginUser();
  return user?.token || '';
};

export const setRediectPath = (uri: string) => {
  window.localStorage.setItem('rediectPath', uri);
};

export const getRediectPath = () => {
  return <string>window.localStorage.getItem('rediectPath');
};

export const getLonginUser: () => TUser = () => {
  if (!window.localStorage.getItem('user')) {
    return <TUser>{};
  }
  try {
    return <TUser>JSON.parse(<string>window.localStorage.getItem('user'));
  } catch (err) {
    window.localStorage.removeItem('user');
    return <TUser>{};
  }
};
