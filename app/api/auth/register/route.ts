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

    // ✅ Create user with complete data
    const newUser = {
      name: name.trim(),
      username: username ? username.trim().toLowerCase() : name.toLowerCase().replace(/\s/g, ""),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`,
      bio: "",
      location: "",
      website: "",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user
    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: result.insertedId.toString(),
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