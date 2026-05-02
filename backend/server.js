const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const institutionRoutes = require('./routes/institutionRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);

// Dev-only routes (DB viewer)
if (process.env.NODE_ENV === 'development') {
  const devRoutes = require('./routes/devRoutes');
  app.use('/api/dev', devRoutes);
  // Serve the visual DB explorer HTML page
  app.get('/db-explorer', (req, res) => {
    res.sendFile(path.join(__dirname, 'db-explorer.html'));
  });
}

// Error Handler Middleware
app.use(errorHandler);

// Main Route
app.get('/', (req, res) => {
  res.send('VERI-CHAIN API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
