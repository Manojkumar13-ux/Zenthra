// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📝 Registration request:", { ...body, password: "[REDACTED]" });

    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Connect to database
    console.log("🔄 Connecting to database...");
    await connectDB();
    console.log("✅ Connected to database");

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email.split("@")[0].toLowerCase() },
      ],
    });

    if (existingUser) {
      console.log("❌ User already exists:", email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log("🔄 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");

    // Create username from email
    const baseUsername = email.split("@")[0].toLowerCase();
    const randomNum = Math.floor(Math.random() * 10000);
    const username = `${baseUsername}${randomNum}`;

    // Create user
    console.log("🔄 Creating user...");
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      username: username,
      password: hashedPassword,
    });

    console.log("✅ User created successfully:", user._id);

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Registration error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}