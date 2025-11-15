import axios from 'axios';

const API = axios.create({
  baseURL: 'https://gigconnect-backend-r40h.onrender.com/api/auth',
});

export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);
export const updateUser = (id, data) => API.put(`/update/${id}`, data);
