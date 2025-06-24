#!/usr/bin/env node

/**
 * Basic HTTP Server for AI-Powered Care Demo
 * Uses only Node.js built-in modules - no dependencies required
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8080;

// Mock data
const mockUsers = {
  'patient1@example.com': { role: 'patient', name: 'Alice Johnson', password: 'Patient123!' },
  'dr.smith@aipc.com': { role: 'doctor', name: 'Dr. John Smith', password: 'Doctor123!' },
  'admin@aipc.com': { role: 'admin', name: 'System Admin', password: 'Admin123!' }
};

// Helper function to parse JSON body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = body ? JSON.parse(body) : {};
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data, null, 2));
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${path}`);

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  // Route handlers
  if (path === '/' && method === 'GET') {
    sendJSON(res, 200, {
      message: 'Welcome to AI-Powered Care Backend!',
      status: 'running',
      version: '1.0.0',
      server: 'Basic HTTP Server',
      endpoints: {
        health: '/health',
        api: '/api',
        login: '/api/auth/login',
        symptomChecker: '/api/symptom-checker'
      },
      demo: {
        description: 'This is a demo server for the AI-Powered Care platform',
        credentials: {
          patient: 'patient1@example.com / Patient123!',
          doctor: 'dr.smith@aipc.com / Doctor123!',
          admin: 'admin@aipc.com / Admin123!'
        }
      }
    });
  }
  
  else if (path === '/health' && method === 'GET') {
    sendJSON(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      port: PORT,
      server: 'Basic HTTP Server',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      message: 'AI-Powered Care Backend is running successfully!'
    });
  }
  
  else if (path === '/api' && method === 'GET') {
    sendJSON(res, 200, {
      name: 'AI-Powered Care Backend API',
      version: '1.0.0',
      description: 'Comprehensive healthcare marketplace API with AI-powered features',
      status: 'operational',
      server: 'Basic HTTP Server',
      endpoints: {
        health: 'GET /health - Server health check',
        root: 'GET / - Welcome message',
        login: 'POST /api/auth/login - User authentication',
        symptomChecker: 'POST /api/symptom-checker - AI symptom analysis',
        patientProfile: 'GET /api/patients/me - Patient profile',
        orders: 'GET /api/orders - Order history'
      },
      demo: {
        testCommands: [
          'curl http://localhost:8080/health',
          'curl http://localhost:8080/api',
          'curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"patient1@example.com","password":"Patient123!"}\''
        ]
      },
      documentation: `http://localhost:${PORT}/api`,
      support: 'support@aipc.com'
    });
  }
  
  else if (path === '/api/auth/login' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, {
          success: false,
          error: { code: 'INVALID_JSON', message: 'Invalid JSON in request body' }
        });
        return;
      }

      const { email, password } = body;
      const user = mockUsers[email];

      if (user && user.password === password) {
        sendJSON(res, 200, {
          success: true,
          data: {
            user: {
              id: `user-${Date.now()}`,
              email: email,
              role: user.role,
              name: user.name,
              lastLogin: new Date().toISOString()
            },
            token: `mock-jwt-token-${Date.now()}`,
            refreshToken: `mock-refresh-token-${Date.now()}`,
            expiresIn: '24h'
          },
          message: 'Login successful'
        });
      } else {
        sendJSON(res, 401, {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }
    });
  }
  
  else if (path === '/api/symptom-checker' && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, {
          success: false,
          error: { code: 'INVALID_JSON', message: 'Invalid JSON in request body' }
        });
        return;
      }

      const { symptoms = [], duration = 'unknown', severity = 'mild' } = body;

      sendJSON(res, 200, {
        success: true,
        data: {
          analysisId: `analysis-${Date.now()}`,
          inputSymptoms: symptoms,
          duration: duration,
          severity: severity,
          possibleConditions: [
            {
              condition: 'Common Cold',
              probability: 0.75,
              severity: 'mild',
              description: 'Viral upper respiratory infection',
              icd10: 'J00'
            },
            {
              condition: 'Influenza',
              probability: 0.45,
              severity: 'moderate',
              description: 'Seasonal flu virus infection',
              icd10: 'J11.1'
            },
            {
              condition: 'Allergic Rhinitis',
              probability: 0.30,
              severity: 'mild',
              description: 'Allergic reaction causing nasal symptoms',
              icd10: 'J30.9'
            }
          ],
          recommendations: [
            'Rest and stay well hydrated',
            'Monitor symptoms for 24-48 hours',
            'Consider over-the-counter symptom relief',
            'Seek medical attention if symptoms worsen or persist',
            'Isolate if fever is present to prevent spread'
          ],
          urgencyLevel: severity === 'severe' ? 'high' : 'low',
          redFlags: [
            'Difficulty breathing or shortness of breath',
            'Persistent chest pain or pressure',
            'High fever (>101.5°F) for more than 3 days',
            'Severe headache with neck stiffness'
          ],
          disclaimer: 'This is a demo AI analysis. Always consult qualified healthcare professionals for medical advice.',
          timestamp: new Date().toISOString()
        }
      });
    });
  }
  
  else if (path === '/api/patients/me' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        id: 'patient-demo-001',
        name: 'Demo Patient',
        email: 'patient1@example.com',
        dateOfBirth: '1985-03-15',
        gender: 'female',
        phone: '+1-555-0123',
        address: '123 Demo St, Boston, MA 02101',
        emergencyContact: 'John Doe (Spouse)',
        emergencyPhone: '+1-555-0124',
        allergies: ['Penicillin', 'Shellfish', 'Latex'],
        currentMedications: [
          'Lisinopril 10mg - once daily',
          'Metformin 500mg - twice daily'
        ],
        medicalHistory: {
          conditions: ['Hypertension', 'Type 2 Diabetes'],
          surgeries: ['Appendectomy (2010)'],
          familyHistory: ['Heart Disease (Father)', 'Diabetes (Mother)']
        },
        insuranceInfo: {
          provider: 'Blue Cross Blue Shield',
          policyNumber: 'BC123456789',
          groupNumber: 'GRP001'
        },
        lastUpdated: new Date().toISOString()
      }
    });
  }
  
  else if (path === '/api/orders' && method === 'GET') {
    sendJSON(res, 200, {
      success: true,
      data: {
        orders: [
          {
            id: 'order-demo-001',
            type: 'pharmacy',
            status: 'completed',
            medication: 'Lisinopril 10mg',
            quantity: 30,
            pharmacy: 'City Care Pharmacy',
            pharmacyAddress: '789 Health Blvd, Boston, MA 02101',
            orderDate: '2024-01-15T10:30:00Z',
            completedDate: '2024-01-15T16:45:00Z',
            cost: 25.50
          },
          {
            id: 'order-demo-002',
            type: 'lab',
            status: 'in_progress',
            tests: ['Complete Blood Count', 'Lipid Panel'],
            lab: 'QuickLab Diagnostics',
            labAddress: '321 Science Dr, Cambridge, MA 02139',
            orderDate: '2024-01-16T09:15:00Z',
            estimatedCompletion: '2024-01-17T14:00:00Z',
            cost: 85.00
          }
        ],
        total: 2,
        pagination: {
          page: 1,
          limit: 10,
          hasMore: false
        }
      }
    });
  }
  
  else {
    // 404 handler
    sendJSON(res, 404, {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${method} ${path} not found`,
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
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 AI-Powered Care Basic HTTP Server Started!');
  console.log('===============================================');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📍 API Docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Server Type: Basic HTTP Server (no dependencies)`);
  console.log('');
  console.log('🔑 Demo Credentials:');
  console.log('   Patient: patient1@example.com / Patient123!');
  console.log('   Doctor: dr.smith@aipc.com / Doctor123!');
  console.log('   Admin: admin@aipc.com / Admin123!');
  console.log('');
  console.log('🎯 Test Commands:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/api`);
  console.log('');
  console.log('✅ Server is ready to accept requests!');
  console.log('   Press Ctrl+C to stop the server');
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

module.exports = server;
