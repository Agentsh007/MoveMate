// =============================================
// Location API Functions — Essentials + Emergency
// =============================================

import api from './axiosInstance';

export const essentialsAPI = {
  getCategories: () => api.get('/essentials/categories'),
  getNearby: (params) => api.get('/essentials', { params }),
  report: (data) => api.post('/essentials/report', data),
};

export const emergencyAPI = {
  getCategories: () => api.get('/emergency/categories'),
  getContacts: (params) => api.get('/emergency', { params }),
  report: (data) => api.post('/emergency/report', data),
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
