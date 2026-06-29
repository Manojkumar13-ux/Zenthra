// test-local.js
const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017/zenthra";

async function test() {
  try {
    console.log("🔄 Connecting to local MongoDB...");
    const client = await MongoClient.connect(uri);
    console.log("✅ Connected successfully!");
    const db = client.db('zenthra');
    console.log("✅ Database:", db.databaseName);
    await client.close();
    console.log("✅ Disconnected");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

test();