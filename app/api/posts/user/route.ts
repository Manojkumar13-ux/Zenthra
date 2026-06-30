export const dynamic = 'force-dynamic';

// app/api/posts/user/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb"; // ✅ Changed

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const posts = await db.collection("posts")
      .find({ "author.id": session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}