#!/usr/bin/env node

/**
 * Simple Express Server for AI-Powered Care Demo
 * This is a minimal server to test basic functionality
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all origins (development only)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    port: PORT,
    message: 'AI-Powered Care Backend is running successfully!'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI-Powered Care Backend API',
    version: '1.0.0',
    description: 'Comprehensive healthcare marketplace API with AI-powered features',
    status: 'operational',
    endpoints: {
      health: '/health',
      authentication: '/api/auth',
      patients: '/api/patients',
      orders: '/api/orders',
      symptomChecker: '/api/symptom-checker',
      providers: '/api/providers'
    },
    demo: {
      credentials: {
        patient: 'patient1@example.com / Patient123!',
        doctor: 'dr.smith@aipc.com / Doctor123!',
        admin: 'admin@aipc.com / Admin123!'
      }
    },
    documentation: `http://localhost:${PORT}/api`,
    support: 'support@aipc.com'
  });
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock user database
  const users = {
    'patient1@example.com': { role: 'patient', name: 'Alice Johnson' },
    'dr.smith@aipc.com': { role: 'doctor', name: 'Dr. John Smith' },
    'admin@aipc.com': { role: 'admin', name: 'System Admin' }
  };
  
  if (users[email] && password.includes('123!')) {
    res.json({
      success: true,
      data: {
        user: {
          id: `user-${Date.now()}`,
          email: email,
          role: users[email].role,
          name: users[email].name,
          lastLogin: new Date().toISOString()
        },
        token: `mock-jwt-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }
});

// Mock symptom checker endpoint
app.post('/api/symptom-checker', (req, res) => {
  const { symptoms, duration, severity } = req.body;
  
  res.json({
    success: true,
    data: {
      analysisId: `analysis-${Date.now()}`,
      symptoms: symptoms || ['headache', 'fever'],
      possibleConditions: [
        {
          condition: 'Common Cold',
          probability: 0.75,
          severity: 'mild',
          description: 'Viral upper respiratory infection'
        },
        {
          condition: 'Flu',
          probability: 0.45,
          severity: 'moderate',
          description: 'Influenza virus infection'
        }
      ],
      recommendations: [
        'Rest and stay hydrated',
        'Monitor symptoms for 24-48 hours',
        'Consider over-the-counter pain relievers',
        'Seek medical attention if symptoms worsen'
      ],
      urgencyLevel: 'low',
      disclaimer: 'This is a demo response. Always consult healthcare professionals for medical advice.'
    }
  });
});

// Mock patient profile endpoint
app.get('/api/patients/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'patient-demo-001',
      name: 'Demo Patient',
      email: 'patient1@example.com',
      dateOfBirth: '1985-03-15',
      allergies: ['Penicillin', 'Shellfish'],
      currentMedications: ['Lisinopril 10mg'],
      medicalHistory: {
        conditions: ['Hypertension'],
        surgeries: [],
        familyHistory: ['Heart Disease (Father)']
      }
    }
  });
});

// Mock orders endpoint
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: [
        {
          id: 'order-demo-001',
          type: 'pharmacy',
          status: 'completed',
          medication: 'Lisinopril 10mg',
          pharmacy: 'City Care Pharmacy',
          createdAt: '2024-01-15T10:30:00Z'
        }
      ],
      total: 1
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AI-Powered Care Backend!',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/api'
    },
    demo: {
      description: 'This is a demo server for the AI-Powered Care platform',
      features: [
        'Health monitoring',
        'User authentication',
        'AI symptom checker',
        'Patient management',
        'Order tracking'
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api',
        'POST /api/auth/login',
        'POST /api/symptom-checker',
        'GET /api/patients/me',
        'GET /api/orders'
      ]
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 AI-Powered Care Backend Demo Server Started!');
  console.log('================================================');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📍 API Docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('🔑 Demo Credentials:');
  console.log('   Patient: patient1@example.com / Patient123!');
  console.log('   Doctor: dr.smith@aipc.com / Doctor123!');
  console.log('   Admin: admin@aipc.com / Admin123!');
  console.log('');
  console.log('🎯 Available Endpoints:');
  console.log('   GET  / - Welcome message');
  console.log('   GET  /health - Health check');
  console.log('   GET  /api - API documentation');
  console.log('   POST /api/auth/login - User login');
  console.log('   POST /api/symptom-checker - AI symptom analysis');
  console.log('   GET  /api/patients/me - Patient profile');
  console.log('   GET  /api/orders - Order history');
  console.log('');
  console.log('✅ Server is ready to accept requests!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

module.exports = app;
