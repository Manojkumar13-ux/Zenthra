// app/api/hashtags/trending/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    // Get trending hashtags sorted by count
    const hashtags = await db.collection("hashtags")
      .find()
      .sort({ count: -1 })
      .limit(10)
      .project({ 
        _id: 1, 
        tag: 1, 
        count: 1,
        isTrending: 1
      })
      .toArray();

    // If no hashtags exist, return mock trending data for demo
    if (hashtags.length === 0) {
      // Check if there are posts to generate hashtags from
      const posts = await db.collection("posts")
        .find()
        .limit(20)
        .toArray();

      const tagCounts: Record<string, number> = {};
      posts.forEach((post: any) => {
        if (post.hashtags && Array.isArray(post.hashtags)) {
          post.hashtags.forEach((tag: string) => {
            const cleanTag = tag.toLowerCase();
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          });
        }
      });

      const generatedHashtags = Object.entries(tagCounts)
        .map(([tag, count]) => ({
          _id: `temp_${tag}`,
          tag: tag,
          count: count,
          isTrending: count > 3
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (generatedHashtags.length > 0) {
        return NextResponse.json({ hashtags: generatedHashtags });
      }

      // Return empty array if no hashtags
      return NextResponse.json({ hashtags: [] });
    }

    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending hashtags" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json(
        { error: "Tag is required" },
        { status: 400 }
      );
    }

    const cleanTag = tag.toLowerCase().trim();
    
    // Update or insert hashtag
    const result = await db.collection("hashtags").findOneAndUpdate(
      { tag: cleanTag },
      { 
        $inc: { count: 1 },
        $set: { 
          lastUsed: new Date(),
          isTrending: true
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { 
        upsert: true, 
        returnDocument: "after" 
      }
    );

    // If count is high enough, mark as trending
    if (result && result.count > 5) {
      await db.collection("hashtags").updateOne(
        { tag: cleanTag },
        { $set: { isTrending: true } }
      );
    }

    return NextResponse.json({ 
      hashtag: result,
      message: "Hashtag updated successfully" 
    });
  } catch (error) {
    console.error("Error updating hashtag:", error);
    return NextResponse.json(
      { error: "Failed to update hashtag" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    if (!tag) {
      return NextResponse.json(
        { error: "Tag is required" },
        { status: 400 }
      );
    }

    const cleanTag = tag.toLowerCase().trim();
    
    // Decrease count or remove if count becomes 0
    const result = await db.collection("hashtags").findOneAndUpdate(
      { tag: cleanTag },
      { $inc: { count: -1 } },
      { returnDocument: "after" }
    );

    // If count is 0 or less, delete the hashtag
    if (result && result.count <= 0) {
      await db.collection("hashtags").deleteOne({ tag: cleanTag });
      return NextResponse.json({ 
        message: "Hashtag removed completely" 
      });
    }

    return NextResponse.json({ 
      message: "Hashtag count decreased",
      count: result?.count || 0
    });
  } catch (error) {
    console.error("Error deleting hashtag:", error);
    return NextResponse.json(
      { error: "Failed to delete hashtag" },
      { status: 500 }
    );
  }
}