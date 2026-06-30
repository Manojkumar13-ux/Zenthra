// app/api/users/following/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    const follows = await db.collection("follows")
      .find({ followerId: session.user.id })
      .toArray();

    const followingIds = follows.map(f => f.followingId);

    return NextResponse.json({ users: followingIds });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json({ error: "Failed to fetch following users" }, { status: 500 });
  }
}