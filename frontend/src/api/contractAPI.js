import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/contracts',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getClientContracts = () => API.get('/client');
export const getFreelancerContracts = () => API.get('/freelancer');
export const getContractById = (id) => API.get(`/${id}`);
export const updateContractProgress = (id, progress) => API.patch(`/${id}/progress`, { progress });
