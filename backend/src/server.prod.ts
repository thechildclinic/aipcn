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

// Enhanced security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Strict CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
}));

// Strict rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});
app.use(limiter);

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
  },
});
app.use('/api/', apiLimiter);

// Body parsing middleware with smaller limits for production
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// CORS error handler
app.use(corsErrorHandler);

// Trust proxy for production (if behind load balancer)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: process.env.npm_package_version || '1.0.0',
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
    console.log('🔄 Starting AI-Powered Care Backend Server (Production)...');
    
    // Test database connection
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run migrations in production (don't sync)
    console.log('🔄 Database ready for production.');
    
    // Start the server
    const PORT = config.port || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Production server is running successfully!');
      console.log(`📍 Server URL: http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log('🎯 Ready to accept requests!');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`🔄 ${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ Server closed.');
        sequelize.close().then(() => {
          console.log('✅ Database connection closed.');
          process.exit(0);
        }).catch((error: any) => {
          console.error('❌ Error closing database connection:', error);
          process.exit(1);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
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
