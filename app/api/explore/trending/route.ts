// app/api/explore/trending/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all non-deleted posts with hashtags
    const posts = await Post.find({ 
      isDeleted: { $ne: true },
      hashtags: { $exists: true, $ne: [] }
    })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

    // Extract and count hashtags
    const hashtagMap = new Map();
    
    posts.forEach((post: any) => {
      if (post.hashtags && post.hashtags.length > 0) {
        post.hashtags.forEach((tag: string) => {
          const cleanTag = tag.toLowerCase().replace(/^#/, '');
          if (hashtagMap.has(cleanTag)) {
            hashtagMap.set(cleanTag, hashtagMap.get(cleanTag) + 1);
          } else {
            hashtagMap.set(cleanTag, 1);
          }
        });
      }
    });

    // Convert to array and sort by count
    const trendingHashtags = Array.from(hashtagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get trending posts with hashtags (latest with engagement)
    const trendingPosts = await Post.find({ 
      isDeleted: { $ne: true },
      hashtags: { $exists: true, $ne: [] }
    })
    .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
    .limit(5)
    .populate("author", "name username image verified")
    .lean();

    return NextResponse.json({ 
      hashtags: trendingHashtags,
      posts: trendingPosts 
    });

  } catch (error) {
    console.error("Error getting trending:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending" },
      { status: 500 }
    );
  }
}