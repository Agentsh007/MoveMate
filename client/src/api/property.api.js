// =============================================
// Property API Functions
// =============================================

import api from './axiosInstance';

export const propertyAPI = {
  // List with filters
  list: (params) => api.get('/properties', { params }),

  // Featured listings for homepage
  featured: (limit = 6) => api.get('/properties/featured', { params: { limit } }),

  // Get property detail
  getById: (id) => api.get(`/properties/${id}`),

  // Owner: create property
  create: (data) => api.post('/properties', data),

  // Owner: update property
  update: (id, data) => api.put(`/properties/${id}`, data),

  // Owner: delete property
  delete: (id) => api.delete(`/properties/${id}`),

  // Owner: get my listings
  myListings: () => api.get('/properties/owner/my-listings'),

  // Upload images (multipart form data)
  uploadImages: (id, formData) =>
    api.post(`/properties/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Delete image
  deleteImage: (propertyId, imageId) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`),
};
