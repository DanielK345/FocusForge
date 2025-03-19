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
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://focusforge.netlify.app', 'chrome-extension://*']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', [calendarRoutes, blockListRoutes]);

// Add this route handler for the root path
app.get('/', (req, res) => {
  res.json({ 
    message: 'Focus Forge Backend API is running',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      calendar: '/api/calendar',
      blocklist: '/api/blocklist'
    }
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
  }

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
