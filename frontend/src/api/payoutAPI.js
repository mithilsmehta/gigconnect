import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gigconnect-backend-r40h.onrender.com/api/payouts',
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
