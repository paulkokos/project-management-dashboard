import api from './api';

// Roles API
export const roleAPI = {
  list: () =>
    api.get('/roles/'),
  get: (id: number) =>
    api.get(`/roles/${id}/`),
};