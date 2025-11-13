import api from './api';

// Project API
export const projectAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/projects/', { params }),
  get: (id: number) =>
    api.get(`/projects/${id}/`),
  create: (data: Record<string, unknown>) =>
    api.post('/projects/', data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/projects/${id}/`, data),
  patch: (id: number, data: Record<string, unknown>) =>
    api.patch(`/projects/${id}/`, data),
  delete: (id: number) =>
    api.delete(`/projects/${id}/`),
  softDelete: (id: number) =>
    api.post(`/projects/${id}/soft_delete/`),
  restore: (id: number) =>
    api.post(`/projects/${id}/restore/`),
  deleted: () =>
    api.get('/projects/deleted/'),
  emptyTrash: () =>
    api.post('/projects/empty_trash/'),
  activities: (id: number) =>
    api.get(`/projects/${id}/activities/`),
  getChangelog: (id: number, params?: Record<string, unknown>) =>
    api.get(`/projects/${id}/changelog/`, { params }),
  addTeamMember: (id: number, data: Record<string, unknown>) =>
    api.post(`/projects/${id}/add_team_member/`, data),
  removeTeamMember: (id: number, userId: number) =>
    api.delete(`/projects/${id}/remove_team_member/`, {
      data: { user_id: userId },
    }),
  updateTeamMember: (id: number, data: Record<string, unknown>) =>
    api.patch(`/projects/${id}/update_team_member/`, data),
};