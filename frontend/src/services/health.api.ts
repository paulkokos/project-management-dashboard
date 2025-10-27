import api from './api';

// Health check
export const healthAPI = {
  check: () =>
    api.get('/health/'),
};