import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Nginx経由で /api/ にプロキシされる想定
  withCredentials: true, // クッキー（セッションID）を送信
});

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'employee' | 'manager' | 'admin';
  department_id: string | null;
  location_id: string | null;
  onboarding_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** バックエンドの Category enum（work / relationship / health）に合わせる */
export type QuestionCategory = 'work' | 'relationship' | 'health';

export interface Question {
  id: string;
  category: QuestionCategory;
  text: string;
  is_public: boolean;
  sort_order: number;
}

export interface QuestionCreate {
  category: QuestionCategory;
  text: string;
  is_public: boolean;
  sort_order: number;
}

export interface QuestionSortOrder {
  id: string;
  sort_order: number;
}

export interface QuestionBulkReorderPayload {
  orders: QuestionSortOrder[];
}

export interface Answer {
  id: string;
  user_id: string;
  question_id: string;
  answer_date: string;
  rating: number | null;
  free_text: string | null;
}

export interface AnswerCreate {
  question_id: string;
  rating: number | null;
  free_text: string | null;
}

export interface AnswersBulkCreate {
  answer_date: string;
  answers: AnswerCreate[];
}

export interface Location {
  id: string;
  name: string;
  deleted_at: string | null;
}

export interface Department {
  id: string;
  name: string;
  deleted_at: string | null;
}

export interface Assignment {
  id: string;
  department_id: string;
  manager_id: string;
  created_at: string;
}

export interface UserUpdatePayload {
  name?: string;
  role?: string;
  department_id?: string | null;
  location_id?: string | null;
  is_active?: boolean;
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
  const response = await api.post<Question>('/admin/questions', payload);
  return response.data;
};

export const updateQuestion = async (id: string, payload: QuestionCreate): Promise<Question> => {
  const response = await api.put<Question>(`/admin/questions/${id}`, payload);
  return response.data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  await api.delete(`/admin/questions/${id}`);
};

export const patchPublishQuestion = async (id: string, is_public: boolean): Promise<Question> => {
  const response = await api.patch<Question>(`/admin/questions/${id}/visibility`, { is_public });
  return response.data;
};

export const reorderQuestions = async (payload: QuestionBulkReorderPayload): Promise<{ message: string; updated_ids: string[] }> => {
  const response = await api.put<{ message: string; updated_ids: string[] }>('/admin/questions/reorder', payload);
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

export const updateAnswer = async (id: string, rating: number | null, freeText: string | null): Promise<Answer> => {
  const response = await api.put<Answer>(`/answers/${id}`, { rating, free_text: freeText });
  return response.data;
};

export const getLocations = async (): Promise<Location[]> => {
  const response = await api.get<Location[]>('/locations');
  return response.data;
};

export const getAdminLocations = async (): Promise<Location[]> => {
  const response = await api.get<Location[]>('/admin/locations');
  return response.data;
};

export const createLocation = async (name: string): Promise<Location> => {
  const response = await api.post<Location>('/admin/locations', { name });
  return response.data;
};

export const updateLocation = async (id: string, name: string): Promise<Location> => {
  const response = await api.put<Location>(`/admin/locations/${id}`, { name });
  return response.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/admin/locations/${id}`);
};

export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>('/departments');
  return response.data;
};

export const getAdminDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>('/admin/departments');
  return response.data;
};

export const createDepartment = async (name: string): Promise<Department> => {
  const response = await api.post<Department>('/admin/departments', { name });
  return response.data;
};

export const updateDepartment = async (id: string, name: string): Promise<Department> => {
  const response = await api.put<Department>(`/admin/departments/${id}`, { name });
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await api.delete(`/admin/departments/${id}`);
};

export const getAssignments = async (): Promise<Assignment[]> => {
  const response = await api.get<Assignment[]>('/assignments');
  return response.data;
};

export const createAssignment = async (department_id: string, manager_id: string): Promise<Assignment> => {
  const response = await api.post<Assignment>('/assignments', { department_id, manager_id });
  return response.data;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  await api.delete(`/assignments/${id}`);
};

export const getAdminUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

export const updateAdminUser = async (id: string, payload: UserUpdatePayload): Promise<User> => {
  const response = await api.patch<User>(`/admin/users/${id}`, payload);
  return response.data;
};

export default api;
