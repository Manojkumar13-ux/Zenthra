// app/api/auth/register/route.ts
import { NextResponse } from "next/server";

// ✅ Mock registration - bypass database
const USE_MOCK_AUTH = true;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    console.log("📝 Registration request:", { name, email, password: "[REDACTED]" });

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

    // ✅ MOCK MODE - Always succeed
    if (USE_MOCK_AUTH) {
      console.log("🔓 MOCK MODE: User registered:", email);
      return NextResponse.json(
        {
          message: "User created successfully (mock)",
          user: {
            id: "mock-user-" + Date.now(),
            name: name.trim(),
            email: email.toLowerCase(),
            username: email.split("@")[0].toLowerCase() + Math.floor(Math.random() * 1000),
          },
        },
        { status: 201 }
      );
    }

    // Real registration (skip this if mock mode is on)
    try {
      const { connectDB } = await import("@/lib/db/connect");
      const { User } = await import("@/lib/db/models/User");
      const bcrypt = await import("bcryptjs");
      
      await connectDB();

      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: email.split("@")[0].toLowerCase() },
        ],
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "User with this email already exists" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const baseUsername = email.split("@")[0].toLowerCase();
      const randomNum = Math.floor(Math.random() * 10000);
      const username = `${baseUsername}${randomNum}`;

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        username: username,
        password: hashedPassword,
      });

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
      return NextResponse.json(
        { message: error.message || "Failed to create user" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}