import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import symptomCheckerRoutes from './routes/symptomCheckerRoutes';
import prescriptionRoutes from './routes/prescriptionRoutes';
import doctorAssistRoutes from './routes/doctorAssistRoutes';
import marketplaceRoutes from './routes/marketplaceRoutes'; // New
import orderRoutes from './routes/orderRoutes'; // New
import configRoutes from './routes/configRoutes'; // New

// Validate configuration before starting server
validateConfig();

const app: Express = express();
const port = config.port;

// Middleware - CORS Configuration
console.log('🔧 CORS Origins:', config.cors.origin);
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    const allowedOrigins = config.cors.origin;
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS Allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS Blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  if (config.logging.level === 'debug' || config.logging.level === 'info') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.ip}`);
  }

  // Log response time on completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (config.logging.level === 'debug') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
});

// API Routes
app.use('/api/symptom-checker', symptomCheckerRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/doctor-assist', doctorAssistRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'operational',
      ai: 'operational'
    }
  });
});
app.use('/api/marketplace', marketplaceRoutes); // New
app.use('/api/orders', orderRoutes); // New
app.use('/api/config', configRoutes); // New


// Root Endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Primary Care AI Assistant API is running!');
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.stack);
  if (res.headersSent) { // Important check
    return next(err);
  }
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 AIPC Backend server is running on http://localhost:${port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`📝 Log Level: ${config.logging.level}`);

  if (!config.geminiApiKey) {
      console.warn("***************************************************************************");
      console.warn("⚠️  WARNING: GEMINI API KEY IS NOT SET in .env file.");
      console.warn("The AI functionalities of this API will not work without a valid API_KEY.");
      console.warn("Please create a .env file from .env.example and add your API_KEY.");
      console.warn("***************************************************************************");
  } else {
      console.log("🤖 Gemini API Key found. AI services should be operational.");
  }

  console.log("🔧 Available endpoints:");
  console.log("   - GET  /                           - Health check");
  console.log("   - POST /api/symptom-checker/*      - Symptom analysis");
  console.log("   - POST /api/prescription/*         - Prescription generation");
  console.log("   - POST /api/doctor-assist/*        - Doctor assistance tools");
  console.log("   - POST /api/marketplace/*          - Marketplace management");
  console.log("   - POST /api/orders/*               - Order management");
  console.log("   - GET  /api/config/*               - Configuration management");
});
