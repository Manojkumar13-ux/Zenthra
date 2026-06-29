const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const dbName = "zenthra";

async function addMissingIndexes() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // Add missing likedBy index on posts
    console.log("📊 Adding likedBy index on posts...");
    await db.collection("posts").createIndex({ likedBy: 1 });

    // Add missing followers index on users
    console.log("📊 Adding followers index on users...");
    await db.collection("users").createIndex({ followers: 1 });

    // Add missing following index on users
    console.log("📊 Adding following index on users...");
    await db.collection("users").createIndex({ following: 1 });

    console.log("✅ Missing indexes created successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

addMissingIndexes();
