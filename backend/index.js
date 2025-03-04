const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const connectDB = require('./db');

const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const blockListRoutes = require('./routes/blockListRoutes');

const app = express();
app.use(cors());
app.use(express.json());


// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', [calendarRoutes, blockListRoutes]);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
