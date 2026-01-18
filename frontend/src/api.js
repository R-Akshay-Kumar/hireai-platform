import axios from 'axios';

const API = axios.create({
  // UPDATED: Points to your Live Render Backend
  baseURL: 'https://hireai-backend-68kv.onrender.com/api',
});

// Add a token to every request automatically if it exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;