// app/api/debug/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Debug: Checking posts...");
    await connectDB();

    // Get all posts raw
    const allPosts = await Post.find({}).sort({ createdAt: -1 }).lean();
    
    // Get posts with author populated
    const populatedPosts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate("author", "name username")
      .lean();

    // Check collection stats
    const stats = await mongoose.connection.db?.collection("posts").stats();

    return NextResponse.json({
      success: true,
      totalPosts: allPosts.length,
      posts: allPosts.map(p => ({
        id: p._id,
        content: p.content?.substring(0, 50),
        authorId: p.author,
        isPublished: p.isPublished,
        hashtags: p.hashtags || [],
        createdAt: p.createdAt
      })),
      populatedPosts: populatedPosts.map(p => ({
        id: p._id,
        content: p.content?.substring(0, 50),
        author: p.author?.name || 'Unknown',
        isPublished: p.isPublished
      })),
      collectionStats: stats
    });

  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Failed to get debug info", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}