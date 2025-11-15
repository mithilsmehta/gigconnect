import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gigconnect-backend-r40h.onrender.com/api/payout-accounts',
});

// Add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const addPayoutAccount = (data) => API.post('/', data);
export const getPayoutAccounts = () => API.get('/');
export const updatePayoutAccount = (accountId, data) => API.put(`/${accountId}`, data);
export const deletePayoutAccount = (accountId) => API.delete(`/${accountId}`);
export const verifyBankAccount = (accountId) => API.post(`/${accountId}/verify`);
