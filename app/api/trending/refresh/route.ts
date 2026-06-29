// app/api/trending/refresh/route.ts
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

    const allPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
    }).select("hashtags");

    const hashtagCount: Record<string, number> = {};
    allPosts.forEach((post: any) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => {
          const cleanTag = tag.startsWith("#") ? tag.slice(1).toLowerCase() : tag.toLowerCase();
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
      message: "Trending refreshed",
      trending: sorted.map(([tag, count]) => ({ tag, count })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to refresh trending" }, { status: 500 });
  }
}
