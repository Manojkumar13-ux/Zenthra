const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const dbName = "zenthra";

async function checkIndexes() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const collections = ['posts', 'comments', 'notifications', 'users'];
    for (const coll of collections) {
      console.log(`\n📊 ${coll} indexes:`);
      const indexes = await db.collection(coll).indexes();
      indexes.forEach(idx => console.log(`  - ${JSON.stringify(idx.key)}`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkIndexes();