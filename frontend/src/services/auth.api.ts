import api from './api';

interface RegistrationCredentials {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string) => api.post('/auth/token/', { username, password }),
  refresh: (refreshToken: string) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
  getCurrentUser: () => api.get('/users/me/'),
  register: (credentials: RegistrationCredentials) => api.post('/auth/register/', credentials),
};
