// app/api/test/create-users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// ✅ GET - Create sample users
export async function GET() {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check existing users
    const existingCount = await usersCollection.countDocuments();
    
    if (existingCount > 0) {
      const existingUsers = await usersCollection.find().limit(20).toArray();
      
      return NextResponse.json({
        message: `✅ ${existingCount} users already exist in database`,
        users: existingUsers.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          username: u.username,
          email: u.email,
        })),
      });
    }

    // Create sample users
    const sampleUsers = [
      {
        name: "Alice Johnson",
        username: "alicej",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff&size=128",
        bio: "Tech enthusiast | React Developer | Coffee lover ☕",
        location: "San Francisco, CA",
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
        bio: "Professional photographer | Travel addict 📸",
        location: "New York, NY",
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
        bio: "Travel blogger | Foodie | Adventure seeker ✈️",
        location: "London, UK",
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
        bio: "Professional gamer | Streamer | Content creator 🎮",
        location: "Tokyo, Japan",
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
        bio: "Singer | Songwriter | Music producer 🎵",
        location: "Nashville, TN",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await usersCollection.insertMany(sampleUsers);
    
    return NextResponse.json({
      message: `✅ Successfully created ${result.insertedCount} users!`,
      users: sampleUsers.map((u) => ({
        name: u.name,
        username: u.username,
        email: u.email,
        password: "password123",
        image: u.image,
        bio: u.bio,
      })),
      credentials: {
        email: "alice@example.com",
        password: "password123",
      },
    });
  } catch (error) {
    console.error("Error creating users:", error);
    return NextResponse.json(
      { error: "Failed to create users" },
      { status: 500 }
    );
  }
}

// ✅ POST - Create a single user (for your console script)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, username, password, bio, image } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = {
      name,
      username: username || name.toLowerCase().replace(/\s/g, ""),
      email,
      password: await bcrypt.hash(password, 10),
      image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
      bio: bio || "",
      location: "",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    
    return NextResponse.json({
      message: "✅ User created successfully!",
      user: {
        id: result.insertedId.toString(),
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        image: newUser.image,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}