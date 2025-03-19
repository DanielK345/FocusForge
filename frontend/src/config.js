// Cấu hình API endpoint cho ứng dụng
const API = {
  // Kiểm tra nếu ứng dụng đang chạy trong môi trường sản xuất
  isProd: process.env.NODE_ENV === 'production',
  
  // Sử dụng URL Heroku trong môi trường sản xuất, URL local trong môi trường phát triển
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://focus-forge-backend.herokuapp.com'
    : 'http://localhost:5000',
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      verify: '/api/auth/verify'
    },
    dashboard: {
      events: {
        fetch: '/api/dashboard/events',
        save: '/api/dashboard/events/save'
      },
      blocklist: {
        fetch: '/api/dashboard/blocklist',
        save: '/api/dashboard/blocklist/save'
      }
    }
  }
};

export default API; 