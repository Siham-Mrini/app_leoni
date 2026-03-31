import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal ? 'http://localhost:8000/api' : 'https://appleoni-production.up.railway.app/api';

const api = axios.create({
    baseURL: baseURL,
    withCredentials: false,
});

console.log("Current API BaseURL:", api.defaults.baseURL);

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
