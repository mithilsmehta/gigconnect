import axios from 'axios';

export const getMe = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};
