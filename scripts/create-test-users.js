// scripts/create-test-users.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function createTestUsers() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db("zenthra");
    const usersCollection = db.collection("users");

    // Check existing users
    const existingCount = await usersCollection.countDocuments();
    console.log(`📊 Existing users: ${existingCount}`);

    const testUsers = [
      {
        name: "Alice Johnson",
        username: "alicej",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff&size=128",
        bio: "Tech enthusiast | React Developer",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Bob Smith",
        username: "bobsmith",
        email: "bob@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Bob+Smith&background=8b5cf6&color=fff&size=128",
        bio: "Photographer | Traveler",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Carol White",
        username: "carolw",
        email: "carol@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Carol+White&background=ec4899&color=fff&size=128",
        bio: "Travel blogger | Foodie",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "David Brown",
        username: "davidb",
        email: "david@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=David+Brown&background=14b8a6&color=fff&size=128",
        bio: "Gamer | Streamer",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Emma Wilson",
        username: "emmaw",
        email: "emma@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Emma+Wilson&background=f59e0b&color=fff&size=128",
        bio: "Music lover | Singer",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let createdCount = 0;
    for (const user of testUsers) {
      const existing = await usersCollection.findOne({
        $or: [{ email: user.email }, { username: user.username }]
      });
      
      if (!existing) {
        await usersCollection.insertOne(user);
        createdCount++;
        console.log(`✅ Created user: ${user.name} (@${user.username})`);
      } else {
        console.log(`⏭️ User already exists: ${user.name}`);
      }
    }

    console.log(`✅ Created ${createdCount} new users`);
    console.log(`📊 Total users: ${await usersCollection.countDocuments()}`);
    
    await client.close();
  } catch (error) {
    console.error("❌ Error:", error);
    await client.close();
  }
}

createTestUsers();