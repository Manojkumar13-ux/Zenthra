// app/api/users/posts/route.ts
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    await connectDB();

    const query: any = { author: userId };

    // Only show public posts or posts from followed users
    // For simplicity, we'll show all posts for now

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username image")
      .lean();

    const total = await Post.countDocuments(query);

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      _id: post._id.toString(),
      author: post.author
        ? {
            ...post.author,
            _id: post.author._id.toString(),
          }
        : null,
      createdAt: post.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
