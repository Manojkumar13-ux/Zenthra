// test-direct.js
const { MongoClient } = require('mongodb');

const uri = "mongodb://manojkumar:manoj1234@cluster0-shard-00-00.hcrcwnx.mongodb.net:27017,cluster0-shard-00-01.hcrcwnx.mongodb.net:27017,cluster0-shard-00-02.hcrcwnx.mongodb.net:27017/zenthra?ssl=true&replicaSet=atlas-oa6x6o-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function test() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    console.log("🔄 Connecting...");
    await client.connect();
    console.log("✅ Connected!");
    await client.close();
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();