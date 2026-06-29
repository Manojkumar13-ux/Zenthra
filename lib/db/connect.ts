// lib/db/connect.ts
import mongoose from "mongoose";

// Use environment variable or fallback to local for development
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/zenthra";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable");
}

let cached = (global as any).mongoose || { conn: null, promise: null };

if (!(global as any).mongoose) {
  (global as any).mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    console.log("🔄 Connecting to MongoDB...");
    console.log(`📚 Using environment: ${process.env.NODE_ENV || 'development'}`);
    
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        console.log(`📚 Database: ${mongoose.connection.db?.databaseName || 'zenthra'}`);
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}