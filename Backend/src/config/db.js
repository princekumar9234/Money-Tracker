import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js SRV DNS lookup issues on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moneytrace_ai';
  const localUri = 'mongodb://127.0.0.1:27017/moneytrace_ai';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected to Primary: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Failed connecting to primary URI (${error.message}). Attempting local MongoDB...`);
    try {
      const localConn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] MongoDB Connected to Local Fallback: ${localConn.connection.host}/${localConn.connection.name}`);
    } catch (localErr) {
      console.error(`[Database Error] Connection failed: ${localErr.message}`);
      process.exit(1);
    }
  }
};
