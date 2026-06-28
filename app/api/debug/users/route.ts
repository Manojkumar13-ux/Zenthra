// app/api/debug/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    
    // Get current user
    const currentUser = await db.collection("users").findOne({
      email: session.user.email
    });

    // Get all users (limit to 10)
    const allUsers = await db.collection("users")
      .find({})
      .limit(10)
      .toArray();

    // Format user data for debugging
    const formattedUsers = allUsers.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    }));

    return NextResponse.json({
      currentUser: currentUser ? {
        _id: currentUser._id.toString(),
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      } : null,
      allUsers: formattedUsers,
      totalUsers: allUsers.length,
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      isValidObjectId: /^[0-9a-fA-F]{24}$/.test(session.user.id)
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Failed to get debug info" },
      { status: 500 }
    );
  }
}