const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixGoogleUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Find users with non-ObjectId _ids (Google IDs)
    const allUsers = await users.find({}).toArray();
    
    let fixedCount = 0;
    for (const user of allUsers) {
      // Check if _id is not a MongoDB ObjectId (not 24 hex chars)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(user._id.toString());
      
      if (!isObjectId) {
        console.log(`Found user with non-ObjectId: ${user._id} (${user.email})`);
        // Keep the Google ID as a reference field
        await users.updateOne(
          { _id: user._id },
          { 
            $set: { googleId: user._id.toString() },
            $unset: { _id: "" }
          }
        );
        // Note: This is complex in MongoDB, better to create new users
        // For simplicity, we'll just log the issue
        fixedCount++;
      }
    }

    console.log(`Found ${fixedCount} users with invalid IDs`);
    console.log('Please delete these users and re-authenticate with Google');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixGoogleUsers();