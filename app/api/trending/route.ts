// app/api/trending/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";

export async function GET(req: Request) {
  try {
    console.log("🔵 Trending API: Starting request");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("🔴 Trending API: Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized", trending: [] },
        { status: 401 }
      );
    }

    await connectDB();
    console.log("✅ Trending API: Database connected");

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const hashtag = searchParams.get("hashtag");

    // If a specific hashtag is requested
    if (hashtag) {
      const posts = await Post.find({
        hashtags: { $in: [hashtag, `#${hashtag}`] },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("author", "name username image")
        .lean();

      const formattedPosts = posts.map((post: any) => ({
        ...post,
        _id: post._id.toString(),
        author: post.author ? {
          ...post.author,
          _id: post.author._id.toString(),
        } : null,
        createdAt: post.createdAt?.toISOString(),
      }));

      return NextResponse.json({
        hashtag,
        posts: formattedPosts,
        count: formattedPosts.length,
      });
    }

    // ✅ FIX: Get ALL posts with hashtags
    const allPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
    })
      .select("hashtags")
      .lean();

    console.log(`📊 Total posts with hashtags: ${allPosts.length}`);

    // Count hashtag occurrences
    const hashtagCountMap: Record<string, number> = {};

    allPosts.forEach((post: any) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          const cleanTag = tag.startsWith('#') ? tag.slice(1).toLowerCase() : tag.toLowerCase();
          if (cleanTag && cleanTag.length > 0) {
            hashtagCountMap[cleanTag] = (hashtagCountMap[cleanTag] || 0) + 1;
          }
        });
      }
    });

    console.log("📊 Hashtag counts:", hashtagCountMap);

    // Sort by count (descending) and limit
    const sortedHashtags = Object.entries(hashtagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    // Format trending data
    const trending = sortedHashtags.map(([tag, count]) => ({
      tag,
      count,
    }));

    // ✅ FIX: Get trending posts - ONLY sort by createdAt
    const trendingPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: -1 })  // ✅ Only sort by createdAt
      .limit(20)
      .populate("author", "name username image")
      .lean();

    const formattedTrendingPosts = trendingPosts.map((post: any) => {
      // Calculate counts safely
      const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
      const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
      
      return {
        ...post,
        _id: post._id.toString(),
        author: post.author ? {
          ...post.author,
          _id: post.author._id.toString(),
        } : null,
        likes: likeCount,
        comments: commentCount,
        createdAt: post.createdAt?.toISOString(),
      };
    });

    console.log(`✅ Trending: ${trending.length} hashtags, ${formattedTrendingPosts.length} posts`);

    return NextResponse.json({
      trending,
      trendingPosts: formattedTrendingPosts,
    });
  } catch (error) {
    console.error("❌ Trending API Error:", error);
    return NextResponse.json(
      {
        trending: [],
        trendingPosts: [],
        error: error instanceof Error ? error.message : "Failed to fetch trending",
      },
      { status: 500 }
    );
  }
}

// POST /api/trending - Recalculate trending
export async function POST(req: Request) {
  try {
    console.log("🔵 Trending API: Recalculating...");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const allPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
    }).select("hashtags");

    const hashtagCount: Record<string, number> = {};
    allPosts.forEach((post: any) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          const cleanTag = tag.startsWith('#') ? tag.slice(1).toLowerCase() : tag.toLowerCase();
          if (cleanTag && cleanTag.length > 0) {
            hashtagCount[cleanTag] = (hashtagCount[cleanTag] || 0) + 1;
          }
        });
      }
    });

    const sorted = Object.entries(hashtagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      message: "Trending recalculated",
      trending: sorted.map(([tag, count]) => ({ tag, count })),
    });
  } catch (error) {
    console.error("❌ Trending POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to recalculate trending" },
      { status: 500 }
    );
  }
}