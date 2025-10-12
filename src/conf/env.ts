let env = process.env.NODE_ENV;
let serverURL;
let directServerUrl;

if (env === 'development') {
  serverURL = 'https://47.115.229.21:9090';
  // serverURL = '/api'
  directServerUrl = 'https://47.115.229.21:9090'
} else if (env === 'production') {
  // serverURL = window.location.origin;
  // serverURL = 'http://localhost:8082';
  // directServerUrl = window.location.origin;
  serverURL = 'https://47.115.229.21:9090';
  directServerUrl = 'https://47.115.229.21:9090'
}

const Env = { serverURL: serverURL, directServerUrl: directServerUrl };

export default Env;
