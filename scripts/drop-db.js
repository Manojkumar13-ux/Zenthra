const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

async function dropDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collections = await db.collections();

    for (const collection of collections) {
      await collection.drop();
      console.log(`Dropped collection: ${collection.collectionName}`);
    }

    console.log("✅ Database dropped successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping database:", error);
    process.exit(1);
  }
}

dropDatabase();
