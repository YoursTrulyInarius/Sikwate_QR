// Base API URL - Automatically switches between dev server (8000) and production (XAMPP)
export const API_BASE = window.location.port === '5173'
    ? 'http://127.0.0.1:8000'
    : 'http://localhost/Sikwate_QR/api';

export const AUTH_KEYS = {
    USER: 'sikwate_user'
};

export const setStoredUser = (user) => localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
export const getStoredUser = () => JSON.parse(localStorage.getItem(AUTH_KEYS.USER));
export const logoutUser = () => localStorage.removeItem(AUTH_KEYS.USER);
