// app/api/users/check-username/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { connectDB } from "@/lib/db/connect";

import { User } from "@/lib/db/models/User";


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if username exists (excluding current user)
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: session.user.id },
    });

    return NextResponse.json({
      available: !existingUser,
      username: username,
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 });
  }
}
