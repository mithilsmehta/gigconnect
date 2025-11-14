import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/connects',
});

// Add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getConnectBalance = () => API.get('/balance');
export const getConnectPackages = () => API.get('/packages');
export const createConnectsOrder = (packageType) => API.post('/create-order', { packageType });
export const verifyAndCreditConnects = (data) => API.post('/verify', data);
export const getPurchaseHistory = () => API.get('/history');
