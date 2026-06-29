// scripts/clear-indexes.js
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function clearIndexes() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    if (!mongoose.connection.db) {
      console.error("❌ Database connection not available");
      process.exit(1);
    }

    const collections = await mongoose.connection.db.collections();
    console.log(`📁 Found ${collections.length} collections`);

    for (const collection of collections) {
      try {
        await collection.dropIndexes();
        console.log(`✅ Dropped indexes for ${collection.collectionName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop indexes for ${collection.collectionName}:`, error.message);
      }
    }

    console.log("✅ All indexes cleared. Restart the server to rebuild them.");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing indexes:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

clearIndexes();
