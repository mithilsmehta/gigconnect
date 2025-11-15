import axios from 'axios';

export const getMe = async () => {
  const token = localStorage.getItem('token');

  const res = await axios.get('https://gigconnect-backend-r40h.onrender.com/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.user;
};
