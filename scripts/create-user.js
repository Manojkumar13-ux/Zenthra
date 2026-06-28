const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = "mongodb://localhost:27017/zenthra";

async function createUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const userSchema = new mongoose.Schema({
      name: String,
      username: String,
      email: String,
      password: String,
      role: String,
    });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if user exists
    const existing = await User.findOne({ email: 'test@example.com' });
    if (existing) {
      console.log('✅ Test user already exists');
      process.exit(0);
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
    });
    
    console.log('✅ Test user created!');
    console.log('📝 Email: test@example.com');
    console.log('📝 Password: test123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUser();