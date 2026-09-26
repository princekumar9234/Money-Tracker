import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start listening
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 MONEYTRACE AI Backend running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`======================================================\n`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] Error: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception] Error: ${err.message}`);
    process.exit(1);
  });
};

startServer();
