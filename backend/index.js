const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const connectDB = require('./db');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const blockListRoutes = require('./routes/blockListRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV;
const FRONTEND_URL = process.env.FRONTEND_URL;
const EXTENSION_URL = 'chrome-extension://*';

// CORS configuration based on environment
if (NODE_ENV === 'development') {
  console.log('Running in DEVELOPMENT mode');
} else if (NODE_ENV === 'production'){
  console.log('Running in PRODUCTION mode');
}

console.log(FRONTEND_URL);
console.log(EXTENSION_URL);

app.use(cors({ origin: ['https://focus-forge-frontend.vercel.app', 'http://localhost:3000', 'chrome-extension://*'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Optional: Specify allowed HTTP methods
  credentials: true
 }));


// app.use(cors({
//   origin: process.env.NODE_ENV === 'production'
//     ? ['https://focusforge.netlify.app', 'chrome-extension://*']
//     : ['http://localhost:3000', 'chrome-extension://*'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));
app.use(express.json());


// Connect to MongoDB
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', [calendarRoutes, blockListRoutes]);
app.use('/auth', authRoutes);
app.use('/dashboard', [calendarRoutes, blockListRoutes]);

// Add this route handler for the root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'Focus Forge Backend API is running',
    status: 'OK',
    endpoints: {
      auth: '/auth',
      calendar: '/dashboard',
      auth: '/auth',
      calendar: '/dashboard',
    }
  });
});

// Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../frontend/build')));
// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static(path.join(__dirname, '../frontend/build')));
    
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
//     });
//   }
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
//     });
//   }

// Error handling middleware (add this at the end, before app.listen)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
