import axios, { type AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(
          `${process.env['NEXT_PUBLIC_API_URL']}/auth/refresh`,
          { refreshToken },
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        if (original.headers) original.headers['Authorization'] = `Bearer ${data.data.accessToken as string}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/es/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
