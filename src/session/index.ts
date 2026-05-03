import { clearRememberUser, TUser } from "~/localStorage";

export type UserInfo = {
  account?: string;
  username?: string;
  nickName?: string;
};

export type LoginSession = {
  token: string;
  userInfo: UserInfo;
};

const loginSessionKey = 'loginSession';

export const clearSessionStore = () => {
  window.sessionStorage.removeItem('user');
  window.sessionStorage.removeItem(loginSessionKey);
};

export const setLonginUser = (user: TUser) => {
  window.sessionStorage.setItem('user', JSON.stringify(user));
};

export const setLoginSession = (session: LoginSession) => {
  window.sessionStorage.setItem(loginSessionKey, JSON.stringify(session));
  setLonginUser({
    account: session.userInfo.account,
    username: session.userInfo.username,
    nickName: session.userInfo.nickName,
    token: session.token,
  });
};

export const clearLoginSession = () => {
  window.sessionStorage.removeItem(loginSessionKey);
  const user = getLonginUser();
  setLonginUser({ ...user, token: undefined });
  clearRememberUser(user);
};

export const getLoginSession: () => LoginSession | undefined = () => {
  const sessionStr = window.sessionStorage.getItem(loginSessionKey);
  if (!sessionStr) {
    return undefined;
  }
  try {
    return <LoginSession>JSON.parse(sessionStr);
  } catch (err) {
    window.sessionStorage.removeItem(loginSessionKey);
    return undefined;
  }
};

export const getAuthToken = () => {
  const session = getLoginSession();
  if (session?.token) {
    return session.token;
  }
  const user = getLonginUser();
  return user?.token || '';
};

export const setRediectPath = (uri: string) => {
  window.sessionStorage.setItem('rediectPath', uri);
};

export const getRediectPath = () => {
  return <string>window.sessionStorage.getItem('rediectPath');
};

export const getLonginUser: () => TUser = () => {
  if (!window.sessionStorage.getItem('user')) {
    return <TUser>{};
  }
  try {
    return <TUser>JSON.parse(<string>window.sessionStorage.getItem('user'));
  } catch (err) {
    window.sessionStorage.removeItem('user');
    return <TUser>{};
  }
};
