const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = "mongodb://localhost:27017/zenthra";

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");

    // List databases
    const db = mongoose.connection.db;
    const dbs = await db.admin().listDatabases();
    console.log("📊 Available databases:", dbs.databases.map((d) => d.name).join(", "));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect:", error.message);
    process.exit(1);
  }
}

testConnection();
