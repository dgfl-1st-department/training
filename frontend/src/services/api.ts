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

export interface Question {
  id: number;
  measurement_category: 'satisfaction' | 'relationship' | 'health';
  text: string;
  is_public: boolean;
  sort_order: number;
}

export interface Answer {
  id: number;
  user_id: number;
  question_id: number;
  answer_date: string;
  rating: number | null;
  free_text: string | null;
}

export interface AnswerCreate {
  question_id: number;
  rating: number | null;
  free_text: string | null;
}

export interface AnswersBulkCreate {
  answer_date: string;
  answers: AnswerCreate[];
}

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getQuestions = async (): Promise<Question[]> => {
  const response = await api.get<Question[]>('/questions');
  return response.data;
};

export const getAnswers = async (startDate?: string, endDate?: string): Promise<Answer[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const response = await api.get<Answer[]>(`/answers?${params.toString()}`);
  return response.data;
};

export const createAnswers = async (payload: AnswersBulkCreate): Promise<Answer[]> => {
  const response = await api.post<Answer[]>('/answers', payload);
  return response.data;
};

export const updateAnswer = async (id: number, rating: number | null, freeText: string | null): Promise<Answer> => {
  const response = await api.put<Answer>(`/answers/${id}`, { rating, free_text: freeText });
  return response.data;
};

export default api;
