// scripts/clear-indexes.ts
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";

async function clearIndexes() {
  try {
    await connectDB();
    
    // Check if db is available
    if (!mongoose.connection.db) {
      console.error("❌ Database connection not available");
      process.exit(1);
    }
    
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      try {
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes for ${collection.collectionName}`);
      } catch (error) {
        // Use type assertion to handle unknown error type
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`⚠️ Could not drop indexes for ${collection.collectionName}:`, errorMessage);
      }
    }
    
    console.log("✅ All indexes cleared. Restart the server to rebuild them.");
    process.exit(0);
  } catch (error) {
    // Use type assertion to handle unknown error type
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error clearing indexes:", errorMessage);
    process.exit(1);
  }
}

clearIndexes();