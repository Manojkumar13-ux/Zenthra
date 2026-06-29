// test-db.js
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://manojkumar:manoj1234@cluster0.hcrcwnx.mongodb.net/zenthra?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully!");
    console.log("✅ Database:", mongoose.connection.db.databaseName);
    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();