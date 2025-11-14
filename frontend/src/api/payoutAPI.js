import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/payouts',
});

// Add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const processPayout = (contractId) => API.post('/process', { contractId });
export const getPayoutStatus = (payoutId) => API.get(`/${payoutId}`);
