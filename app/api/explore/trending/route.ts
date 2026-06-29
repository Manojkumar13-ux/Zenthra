// app/api/explore/trending/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
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

    // Get ALL posts with hashtags
    const allPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
    })
      .select("hashtags")
      .lean();

    // Count hashtag occurrences
    const hashtagCountMap: Record<string, number> = {};

    allPosts.forEach((post: any) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          // Clean the tag (remove # if present)
          const cleanTag = tag.startsWith("#") ? tag.slice(1).toLowerCase() : tag.toLowerCase();
          if (cleanTag && cleanTag.length > 0) {
            hashtagCountMap[cleanTag] = (hashtagCountMap[cleanTag] || 0) + 1;
          }
        });
      }
    });

    // Sort and format
    const trending = Object.entries(hashtagCountMap)
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log("📊 Trending hashtags:", trending);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json({ trending: [] }, { status: 500 });
  }
}
