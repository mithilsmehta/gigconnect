import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/payments',
});

// Add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createPaymentOrder = (contractId) => API.post('/create-order', { contractId });
export const verifyAndFundContract = (data) => API.post('/verify', data);
export const processRefund = (contractId, reason) => API.post('/refund', { contractId, reason });
export const getTransactionHistory = (params) => API.get('/transactions', { params });
