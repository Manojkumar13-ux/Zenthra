const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function addIndexes() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Post indexes
    console.log('📊 Creating Post indexes...');
    await db.collection('posts').createIndex({ author: 1, createdAt: -1 });
    await db.collection('posts').createIndex({ createdAt: -1 });
    await db.collection('posts').createIndex({ isPublished: 1 });
    await db.collection('posts').createIndex({ likedBy: 1 });
    await db.collection('posts').createIndex({ hashtags: 1 });

    // Comment indexes
    console.log('📊 Creating Comment indexes...');
    await db.collection('comments').createIndex({ post: 1, createdAt: -1 });
    await db.collection('comments').createIndex({ author: 1, createdAt: -1 });
    await db.collection('comments').createIndex({ parent: 1 });

    // Notification indexes
    console.log('📊 Creating Notification indexes...');
    await db.collection('notifications').createIndex({ user: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ read: 1 });

    // User indexes
    console.log('📊 Creating User indexes...');
    await db.collection('users').createIndex({ username: 1 });
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('users').createIndex({ following: 1 });
    await db.collection('users').createIndex({ followers: 1 });

    console.log('✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

addIndexes();