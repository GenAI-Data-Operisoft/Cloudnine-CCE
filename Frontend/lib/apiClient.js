import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

// Mock API functions for demonstration - replace with your actual API
export const patientsApi = {
  getAll: (searchTerm) => apiClient.get(`/patients?search=${searchTerm}`),
  getNotes: (patientId) => apiClient.get(`/patients/${patientId}/notes`),
  addNote: (patientId, note) => apiClient.post(`/patients/${patientId}/notes`, note),
  update: (patientId, data) => apiClient.put(`/patients/${patientId}`, data),
};

export const sessionsApi = {
  create: (data) => apiClient.post('/sessions', data),
  getStatus: (sessionId) => apiClient.get(`/sessions/${sessionId}/status`),
};

export default apiClient;