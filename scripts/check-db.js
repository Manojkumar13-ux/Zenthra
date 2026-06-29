// scripts/check-db.js
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function checkDB() {
  try {
    console.log("🔍 Connecting to MongoDB...");

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local");
      console.log("💡 Please add MONGODB_URI to your .env.local file");
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(
      "\n📊 Collections:",
      collections.map((c) => c.name).join(", ") || "No collections found"
    );

    // Check posts
    const postCount = await mongoose.connection.db.collection("posts").countDocuments();
    console.log(`\n📝 Posts: ${postCount}`);

    if (postCount > 0) {
      const posts = await mongoose.connection.db.collection("posts").find().toArray();
      console.log("\n📋 All Posts:");
      posts.forEach((post, i) => {
        console.log(`  ${i + 1}. ${post.content?.substring(0, 60)}...`);
        console.log(`     Hashtags: ${post.hashtags?.join(", ") || "none"}`);
        console.log(`     Author: ${post.author}`);
        console.log(`     Created: ${post.createdAt}`);
        console.log(`     ---`);
      });
    } else {
      console.log("⚠️ No posts found in database");
    }

    // Check users
    const userCount = await mongoose.connection.db.collection("users").countDocuments();
    console.log(`\n👤 Users: ${userCount}`);

    if (userCount > 0) {
      const users = await mongoose.connection.db.collection("users").find().toArray();
      console.log("\n📋 Users:");
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.name} (${user.email})`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

checkDB();
