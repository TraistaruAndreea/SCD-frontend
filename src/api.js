import axios from 'axios';
import auth from './auth';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  // Allow certain requests to opt out of sending Authorization.
  // Useful for public endpoints (e.g. /articles/search) where a stale token
  // could cause the backend to attempt auth and reject the request.
  if (config?.skipAuth) return config;

  const t = auth.getToken();
  if (t) {
    if (!config.headers) config.headers = {};
    // Axios v1 may use AxiosHeaders (has .set)
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', 'Bearer ' + t);
    } else {
      config.headers.Authorization = 'Bearer ' + t;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // If token expired/invalid, try refresh once and retry
    if ((status === 401 || status === 403) && originalRequest && !originalRequest.__retry) {
      originalRequest.__retry = true;
      try {
        // Only possible if we have a refresh token (i.e. login flow, not pasted token)
        if (auth.getRefreshToken && auth.getRefreshToken()) {
          await auth.refreshAccessToken();
          return api.request(originalRequest);
        }
      } catch (e) {
        // fall through to original error
      }
    }

    return Promise.reject(error);
  }
);

export default api;
