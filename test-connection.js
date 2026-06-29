// test-connection.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://manojkumar:manoj1234@cluster0.hcrcwnx.mongodb.net/zenthra?retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  try {
    console.log("🔄 Connecting...");
    await client.connect();
    console.log("✅ Connected!");
    const db = client.db('zenthra');
    const collections = await db.listCollections().toArray();
    console.log("📁 Collections:", collections.map(c => c.name));
    await client.close();
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();