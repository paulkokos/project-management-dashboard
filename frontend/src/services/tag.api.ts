import api from './api';

// Tag API
export const tagAPI = {
  list: () =>
    api.get('/tags/'),
  get: (id: number) =>
    api.get(`/tags/${id}/`),
  create: (data: Record<string, unknown>) =>
    api.post('/tags/', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/tags/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/tags/${id}/`),
};