// test-atlas.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://manojkumar:manoj1234@cluster0.hcrcwnx.mongodb.net/zenthra?retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    await client.connect();
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