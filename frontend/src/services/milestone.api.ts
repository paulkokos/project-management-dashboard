import api from './api';

// Milestones API
export const milestoneAPI = {
  list: (projectId: number, params?: Record<string, unknown>) =>
    api.get('/milestones/', { params: { ...params, project_id: projectId } }),
  get: (id: number) =>
    api.get(`/milestones/${id}/`),
  create: (projectId: number, data: Record<string, unknown>) =>
    api.post('/milestones/', data, { params: { project_id: projectId } }),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/milestones/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/milestones/${id}/`),
  complete: (id: number) =>
    api.post(`/milestones/${id}/complete/`),
};