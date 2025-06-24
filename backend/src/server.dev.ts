import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { sequelize } from './database/connection';

// Import routes
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import orderRoutes from './routes/orders';
import symptomCheckerRoutes from './routes/symptomCheckerRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import doctorAssistRoutes from './routes/doctorAssistRoutes';
import configRoutes from './routes/configRoutes';

// Import middleware
import { errorHandler, notFoundHandler, corsErrorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (generous for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// CORS error handler
app.use(corsErrorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: 'connected', // We'll update this after DB connection
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI-Powered Care Backend API',
    version: '1.0.0',
    description: 'Comprehensive healthcare marketplace API with AI-powered features',
    endpoints: {
      authentication: '/api/auth',
      patients: '/api/patients',
      orders: '/api/orders',
      symptomChecker: '/api/symptom-checker',
      prescriptions: '/api/prescription',
      doctorAssist: '/api/doctor-assist',
      configuration: '/api/config',
    },
    documentation: 'https://docs.example.com/api',
    support: 'support@example.com',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/symptom-checker', symptomCheckerRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/doctor-assist', doctorAssistRoutes);
app.use('/api/config', configRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database connection and server startup
async function startServer() {
  try {
    console.log('🔄 Starting AI-Powered Care Backend Server...');
    
    // Test database connection
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database models (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database models...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synced successfully.');
    }
    
    // Start the server
    const PORT = config.port || 5000;
    const server = app.listen(PORT, () => {
      console.log('🚀 Server is running successfully!');
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📍 API Documentation: http://localhost:${PORT}/api`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('📊 Available Endpoints:');
      console.log('   - POST /api/auth/register - User registration');
      console.log('   - POST /api/auth/login - User login');
      console.log('   - GET  /api/auth/profile - Get user profile');
      console.log('   - GET  /api/patients/:id - Get patient details');
      console.log('   - POST /api/orders - Create new order');
      console.log('   - GET  /api/orders - List orders');
      console.log('   - POST /api/symptom-checker - AI symptom analysis');
      console.log('   - POST /api/prescription - AI prescription assistance');
      console.log('   - POST /api/doctor-assist - AI doctor assistance');
      console.log('');
      console.log('🎯 Ready to accept requests!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed.');
        sequelize.close().then(() => {
          console.log('✅ Database connection closed.');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed.');
        sequelize.close().then(() => {
          console.log('✅ Database connection closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
