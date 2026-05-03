const defaultServerUrl = 'https://47.115.229.21:9090';

const serverURL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || defaultServerUrl;

const directServerUrl = import.meta.env.VITE_DIRECT_API_BASE_URL || defaultServerUrl;

const Env = { serverURL, directServerUrl };

export default Env;
