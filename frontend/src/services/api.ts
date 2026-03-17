import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Nginx経由で /api/ にプロキシされる想定
  withCredentials: true, // クッキー（セッションID）を送信
});

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'employee' | 'admin';
  department_id: number | null;
}

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export default api;
