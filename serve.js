/**
 * Production server for AIPC Healthcare Platform
 * Serves the built React application with proper static asset handling
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Security headers for production
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint (before static files)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AIPC Healthcare Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    backend: 'https://aipcn.onrender.com',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle favicon specifically
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.send('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏥</text></svg>');
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true
}));

// Serve public assets
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d'
}));

// Handle client-side routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🏥 AIPC Healthcare Platform running on port ${PORT}`);
  console.log(`🌐 Frontend URL: http://localhost:${PORT}`);
  console.log(`🔗 Backend API: https://aipcn.onrender.com`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
