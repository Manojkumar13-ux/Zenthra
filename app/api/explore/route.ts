// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hashtag = searchParams.get("hashtag");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query: any = {};
    
    // Filter by category
    if (category && category !== "all") {
      // Category stored with first letter capital
      const categoryMap: Record<string, string> = {
        "movies": "Movies",
        "sports": "Sports",
        "technology": "Technology",
        "music": "Music",
        "gaming": "Gaming",
        "business": "Business",
        "education": "Education",
      };
      query.category = categoryMap[category] || category;
    }
    
    // Filter by hashtag
    if (hashtag) {
      query.hashtags = hashtag.toLowerCase();
    }

    const posts = await db.collection("posts")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}