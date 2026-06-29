import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

import { User } from "@/lib/db/models/User";

import bcrypt from "bcryptjs";

import { registerSchema } from "@/lib/validations/auth.schema";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.errors },
        { status: 400 }
      );
    }
    const { name, username, email, password } = parsed.data;
    await connectDB();
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      role: "user",
    });
    return NextResponse.json(
      { message: "User created", user: { id: user._id, name, email } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
