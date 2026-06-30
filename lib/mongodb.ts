// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

// Use different URIs for different environments
const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "zenthra";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedClient && cachedDb) {
    console.log("📚 Database: Using existing connection");
    return cachedDb;
  }

  try {
    console.log(`📚 Database: Connecting to MongoDB (${process.env.NODE_ENV || 'development'} mode)...`);
    console.log(`📚 Database: Using URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    const client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log("✅ Connected to MongoDB successfully");

    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export type { Db, MongoClient };