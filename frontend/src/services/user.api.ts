import api from './api';

interface ProfileUpdateData {
  email: string;
  first_name: string;
  last_name: string;
}

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Users API
export const userAPI = {
  list: (params?: Record<string, unknown>) =>
    api.get('/users/', { params }),
  get: (id: number) =>
    api.get(`/users/${id}/`),
  updateProfile: (data: ProfileUpdateData) =>
    api.patch('/users/me/', data),
  changePassword: (data: ChangePasswordData) =>
    api.post('/users/me/change-password/', data),
  deleteAccount: () =>
    api.delete('/users/me/'),
};