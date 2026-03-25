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
  measurement_category: string;
  text: string;
  is_public: boolean;
  sort_order: number;
}

export interface QuestionCreate {
  measurement_category: string;
  text: string;
  is_public: boolean;
  sort_order: number;
}

export interface QuestionSortOrder {
  id: number;
  sort_order: number;
}

export interface QuestionBulkReorderPayload {
  orders: QuestionSortOrder[];
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

export const getAdminQuestions = async (): Promise<Question[]> => {
  const response = await api.get<Question[]>('/admin/questions');
  return response.data;
};

export const createQuestion = async (payload: QuestionCreate): Promise<Question> => {
  console.log(payload);
  const response = await api.post<Question>('/admin/questions', payload);
  return response.data;
};

export const updateQuestion = async (id: number, payload: QuestionCreate): Promise<Question> => {
  const response = await api.put<Question>(`/admin/questions/${id}`, payload);
  return response.data;
};

export const deleteQuestion = async (id: number): Promise<void> => {
  await api.delete(`/admin/questions/${id}`);
};

export const patchPublishQuestion = async (id: number, is_public: boolean): Promise<Question> => {
  const response = await api.patch<Question>(`/admin/questions/${id}/visibility`, { is_public });
  return response.data;
};

export const reorderQuestions = async (payload: QuestionBulkReorderPayload): Promise<{ message: string; updated_ids: number[] }> => {
  const response = await api.put<{ message: string; updated_ids: number[] }>('/admin/questions/reorder', payload);
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
