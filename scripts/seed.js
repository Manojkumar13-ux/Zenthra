const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Import models
const User = require("../lib/db/models/User");
const Post = require("../lib/db/models/Post");
const Community = require("../lib/db/models/Community");

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Community.deleteMany({});
    console.log("Cleared existing data");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      name: "Admin User",
      username: "admin",
      email: process.env.ADMIN_EMAIL || "admin@zenthra.com",
      password: adminPassword,
      role: "admin",
      bio: "Zenthra Platform Administrator",
    });
    console.log("Admin user created:", admin.email);

    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const password = await bcrypt.hash("password123", 10);
      const user = await User.create({
        name: `Test User ${i}`,
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: password,
        bio: `This is test user ${i}`,
        following: i > 1 ? [admin._id] : [],
        followers: i > 1 ? [admin._id] : [],
      });
      testUsers.push(user);
      console.log(`Test user ${i} created:`, user.email);
    }

    // Create sample posts
    const samplePosts = [
      {
        content: "Welcome to Zenthra! 🚀 The future of social networking is here.",
        author: admin._id,
        likesCount: 3,
        commentsCount: 2,
      },
      {
        content: "Just tried the AI post generator - it's amazing! ✨",
        author: testUsers[0]._id,
        likesCount: 2,
        commentsCount: 1,
      },
      {
        content: "What features would you like to see in the next update? 🤔",
        author: testUsers[1]._id,
        likesCount: 1,
      },
    ];

    for (const postData of samplePosts) {
      await Post.create(postData);
    }
    console.log("Sample posts created");

    // Create community
    const community = await Community.create({
      name: "Zenthra Developers",
      description: "A community for Zenthra developers and contributors",
      owner: admin._id,
      moderators: [admin._id],
      members: [admin._id, ...testUsers.map((u) => u._id)],
    });
    console.log("Community created:", community.name);

    // Add users to following relationships
    for (let i = 0; i < testUsers.length - 1; i++) {
      await User.findByIdAndUpdate(testUsers[i]._id, {
        $push: { following: testUsers[i + 1]._id },
      });
      await User.findByIdAndUpdate(testUsers[i + 1]._id, {
        $push: { followers: testUsers[i]._id },
      });
    }
    console.log("User relationships created");

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
