import api from './api';

// Bulk operations API
export const bulkAPI = {
  updateStatus: (data: Record<string, unknown>) =>
    api.post('/bulk/update_status/', data),
  updateTags: (data: Record<string, unknown>) =>
    api.post('/bulk/update_tags/', data),
};