import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { apiLimiter } from './src/middleware/rateLimiter.middleware.js';
import { errorHandler, notFoundHandler } from './src/middleware/error.middleware.js';

// Route imports
import authRoutes from './src/routes/auth.routes.js';
import transactionRoutes from './src/routes/transaction.routes.js';
import analysisRoutes from './src/routes/analysis.routes.js';
import traceRoutes from './src/routes/trace.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible API usage
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request parsing & size limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Sanitize inputs against MongoDB query injection
app.use(mongoSanitize());

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MONEYTRACE AI Backend Service is running smoothly.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/trace', traceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/user', userRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
