// app/api/debug/feed-test/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { Post } from "@/lib/db/models/Post";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all posts without any filters
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("author", "name username")
      .lean();

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts: posts.map((p) => ({
        id: p._id,
        content: p.content?.substring(0, 50),
        author: p.author?.name || "Unknown",
        hashtags: p.hashtags || [],
        likes: p.likes?.length || 0,
        comments: p.comments?.length || 0,
        isDeleted: p.isDeleted,
      })),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
