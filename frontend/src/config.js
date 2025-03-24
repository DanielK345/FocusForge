// Cấu hình API endpoint cho ứng dụng
const API = {
  // Đọc URL API từ biến môi trường hoặc sử dụng localhost nếu không có
  // baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  baseURL: process.env.REACT_APP_API_URL,
  
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
  }
};

export default API; 