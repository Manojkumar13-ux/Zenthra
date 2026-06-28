// app/api/users/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";

// GET /api/users/posts - Get current user's posts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const posts = await Post.find({ author: session.user.id, isPublished: true })
      .sort({ createdAt: -1 })
      .populate("author", "name username image verified")
      .lean();

    // Add user interaction status
    const postsWithData = posts.map((post: any) => {
      const liked = post.likedBy?.some((id: any) => id.toString() === session.user.id) || false;
      const bookmarked = post.bookmarkedBy?.some((id: any) => id.toString() === session.user.id) || false;
      const reposted = post.repostedBy?.some((id: any) => id.toString() === session.user.id) || false;
      
      return { 
        ...post, 
        liked,
        bookmarked,
        reposted,
        author: post.author || { name: "Unknown", username: "unknown" }
      };
    });

    return NextResponse.json({ posts: postsWithData });
  } catch (error) {
    console.error("User posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}