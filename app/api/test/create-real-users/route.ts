// app/api/test/create-real-users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const db = await connectToDatabase();
    const users = db.collection("users");

    // Check existing users
    const existingCount = await users.countDocuments();
    console.log("📊 Existing users:", existingCount);

    if (existingCount > 5) {
      return NextResponse.json({
        message: `✅ ${existingCount} users already exist`,
        users: await users.find().limit(10).toArray(),
      });
    }

    // Create users
    const sampleUsers = [
      {
        name: "Alice Johnson",
        username: "alicej",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff&size=128",
        bio: "Tech enthusiast | React Developer",
        location: "San Francisco",
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
        location: "New York",
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
        location: "London",
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
        location: "Tokyo",
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
        location: "Nashville",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await users.insertMany(sampleUsers);
    
    return NextResponse.json({
      message: `✅ Created ${result.insertedCount} users!`,
      users: sampleUsers.map(u => ({
        name: u.name,
        username: u.username,
        email: u.email,
        password: "password123",
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}