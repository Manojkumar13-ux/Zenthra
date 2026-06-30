// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, email, password, username } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email or username" },
        { status: 400 }
      );
    }

    // ✅ Create new user with proper ObjectId (MongoDB will generate automatically)
    const newUser = {
      name,
      username: username || name.toLowerCase().replace(/\s/g, ""),
      email,
      password: await bcrypt.hash(password, 10),
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
      bio: "",
      location: "",
      website: "",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ✅ Insert user - MongoDB will generate the _id automatically
    const result = await usersCollection.insertOne(newUser);

    // ✅ Return the actual user ID (not a mock ID)
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: result.insertedId.toString(), // ✅ Real MongoDB ObjectId
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        image: newUser.image,
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}