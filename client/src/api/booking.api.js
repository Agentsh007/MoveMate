// =============================================
// Booking API Functions
// =============================================

import api from './axiosInstance';

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  list: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  pay: (id, data) => api.post(`/bookings/${id}/pay`, data),
  scheduleVisit: (id, data) => api.post(`/bookings/${id}/visit`, data),
  createAgreement: (id, data) => api.post(`/bookings/${id}/agreement`, data),
};

export const reviewAPI = {
  create: (data) => api.post('/reviews', data),
  getByProperty: (propertyId) => api.get(`/reviews/property/${propertyId}`),
};

export const savedAPI = {
  list: () => api.get('/saved-listings'),
  save: (property_id) => api.post('/saved-listings', { property_id }),
  unsave: (propertyId) => api.delete(`/saved-listings/${propertyId}`),
  check: (propertyId) => api.get(`/saved-listings/check/${propertyId}`),
};
