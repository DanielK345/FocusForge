// Cấu hình API endpoint cho ứng dụng
// import dotenv from 'dotenv';
// require('dotenv').config();

const API = {
  
  // Thiết lập baseURL dựa trên môi trường
  // Ưu tiên sử dụng biến môi trường từ .env, nếu không có thì dùng giá trị mặc định

  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : 'https://focusforge-backend-6976505155ee.herokuapp.com',

  // Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      verify: '/auth/verify'
    },
    dashboard: {
      events: {
        fetch: '/dashboard/events',
        save: '/dashboard/events/save'
      },
      blocklist: {
        fetch: '/dashboard/blocklist',
        save: '/dashboard/blocklist/save'
      }
    }
  },
};

export default API; 