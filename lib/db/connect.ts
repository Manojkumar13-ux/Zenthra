// lib/db/connect.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "zenthra";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable");
}

// Define the global mongoose cache
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a different variable name to avoid redeclaration
let cached: GlobalMongoose = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
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
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        
        if (process.env.NODE_ENV === "development") {
          try {
            // Sync indexes in development
            // Using any to avoid type issues
            (mongoose as any).syncIndexes?.();
          } catch (error) {
            console.warn("⚠️ Could not sync indexes:", error);
          }
        }
        
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
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

export { mongoose };