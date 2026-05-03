import Axios, { } from 'axios';
import Env from '~/conf/env';
import { clearLoginSession, getAuthToken, getLonginUser, setLonginUser, setRediectPath } from '../session';

const serverURL = Env.serverURL;

Axios.defaults.withCredentials = false;

Axios.defaults.timeout = 60000;

Axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (config.headers) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (err) => {
    console.error(err);
    return Promise.reject(err);
  },
);

Axios.interceptors.response.use(
  function (response) {
    if (response.data) {
      if (response.data.status === 0) {
        response.data = response.data.data;
      } else if (response.data.status === 1) {
        console.error(response.data.message);
        return Promise.reject(response.data.message);
      }
    }
    return response;
  },
  function (error) {
    if (Axios.isCancel('')) {
      return Promise.reject(error);
    } else {
      if (error.response) {
        if (error.response.status === 401) {
          const path = window.location.href.substring(
            window.location.href.indexOf('#') + 1,
          );
          setRediectPath(path);
          // history.push('/login');
          const user = getLonginUser();
          setLonginUser({ ...user, token: undefined });
          clearLoginSession();
          console.error('尚未登录或登录已过期，请重新登录!');
        } else if (error.response.status === 403) {
          console.error('权限不足!');
        } else if (error.response.status === 500) {
          console.error('server exception !');
        }
      } else if (
        error &&
        String(error).toLowerCase().substring(0, 14) === 'error: timeout'
      ) {
        console.error('server timeout !');
      } else {
        console.error('server error !');
      }
      return Promise.reject(error);
    }
  },
);

Axios.defaults.baseURL = serverURL;

export const POST = async <T>(url: string, params: T) => {
  const res = await Axios.post(`${url}`, params);
  return res.data;
};
export const GET = async <T>(url: string, params?: T) => {
  const res = await Axios.get(`${url}`, {
    params: params,
  });
  return res.data;
};

export const PUT = async <T>(url: any, params: T) => {
  const res = await Axios.put(`${url}`, params);
  return res.data;
};

export const DELETE = async <T>(url: any, params: { vos: T[] }) => {
  const res = await Axios.delete(`${url}`, {
    params: params,
  });
  return res.data;
};

export const PATCH = async <T>(url: any, params: T) => {
  const res = await Axios.patch(`${url}`, params);
  return res.data;
};

const BaseAPI = {
  POST,
  GET,
  PUT,
  DELETE,
  PATCH,
}

export default BaseAPI;
