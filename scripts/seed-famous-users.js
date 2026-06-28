const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function seedFamousUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', require('../lib/db/models/User').schema);
  
  const famousUsers = [
    {
      name: "Virat Kohli",
      username: "viratkohli",
      email: "virat@example.com",
      image: "https://i.pravatar.cc/150?img=12",
      bio: "Indian cricketer | RCB | 💪",
      coverImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
      role: "user",
    },
    {
      name: "MS Dhoni",
      username: "msdhoni",
      email: "dhoni@example.com",
      image: "https://i.pravatar.cc/150?img=13",
      bio: "Captain Cool | CSK | 🏏",
      coverImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
      role: "user",
    },
    {
      name: "Rohit Sharma",
      username: "rohitsharma",
      email: "rohit@example.com",
      image: "https://i.pravatar.cc/150?img=14",
      bio: "Hitman | MI | 🏆",
      coverImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
      role: "user",
    },
  ];

  for (const userData of famousUsers) {
    const existing = await User.findOne({ username: userData.username });
    if (!existing) {
      await User.create(userData);
      console.log(`✅ Created user: ${userData.name}`);
    } else {
      console.log(`⚠️ User ${userData.name} already exists`);
    }
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seedFamousUsers().catch(console.error);